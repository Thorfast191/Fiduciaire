"use client";

import { useEffect, useState } from "react";

interface DocumentItem {
  id: string;
  filename: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

interface DossierData {
  id: string;
  taxYear: number;
  status: "not_started" | "submitted" | "in_review" | "completed";
}

const CATEGORY_LABELS: Record<string, string> = {
  salaire: "Certificat de salaire",
  releves_bancaires: "Relevés bancaires",
  assurance: "Attestations d'assurance",
  pilier3: "3e pilier",
  justificatifs: "Justificatifs divers",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Non commencé",
  submitted: "Soumis",
  in_review: "En cours de traitement",
  completed: "Terminé",
};

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export default function DossierDetail({ dossierId }: { dossierId: string }) {
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [category, setCategory] = useState<string>("salaire");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadDossier() {
    const res = await fetch(`/api/dossiers/${dossierId}`);
    if (!res.ok) return;
    const body = await res.json();
    setDossier(body.dossier);
    setDocuments(body.documents ?? []);
  }

  useEffect(() => {
    // Initial data fetch on mount. eslint-plugin-react-hooks@7's
    // set-state-in-effect rule flags this idiomatic pattern; suppressed
    // rather than restructured, matching the precedent already established
    // in Document Storage's DocumentsPanel component.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDossier();
  }, []);

  async function handleUpload(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Type de fichier non autorisé (PDF, JPG ou PNG uniquement).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Fichier trop volumineux (20 Mo maximum).");
      return;
    }

    setUploading(true);
    try {
      const startRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dossierId,
          filename: file.name,
          category,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!startRes.ok) {
        setError("Impossible de démarrer l'envoi.");
        return;
      }
      const { documentId, uploadUrl } = await startRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        setError("Échec de l'envoi du fichier.");
        return;
      }

      const confirmRes = await fetch(`/api/documents/${documentId}/confirm`, { method: "POST" });
      if (!confirmRes.ok) {
        setError("Échec de la confirmation de l'envoi.");
        return;
      }

      await loadDossier();
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(id: string) {
    setError(null);
    const res = await fetch(`/api/documents/${id}/download-url`);
    if (!res.ok) {
      setError("Impossible de récupérer le lien de téléchargement.");
      return;
    }
    const { downloadUrl } = await res.json();
    // Same-tab navigation (not window.open) so it works regardless of
    // popup-blocker state, matching Document Storage's DocumentsPanel.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = downloadUrl;
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Échec de la suppression.");
      return;
    }
    await loadDossier();
  }

  async function handleSubmit() {
    setError(null);
    const res = await fetch(`/api/dossiers/${dossierId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "submitted" }),
    });
    if (!res.ok) {
      setError("Échec de la soumission du dossier.");
      return;
    }
    await loadDossier();
  }

  if (!dossier) {
    return <p>Chargement…</p>;
  }

  return (
    <section>
      <h1>Dossier fiscal {dossier.taxYear}</h1>
      <p>Statut : {STATUS_LABELS[dossier.status]}</p>

      {dossier.status === "not_started" && (
        <button type="button" onClick={handleSubmit}>
          Marquer comme soumis
        </button>
      )}

      <h2>Ajouter un document</h2>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
      {uploading && <p>Envoi en cours…</p>}
      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      <h2>Documents</h2>
      {documents.length === 0 && <p>Aucun document pour le moment.</p>}
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            [{CATEGORY_LABELS[doc.category] ?? doc.category}] {doc.filename}{" "}
            <button type="button" onClick={() => handleDownload(doc.id)}>
              Télécharger
            </button>{" "}
            <button type="button" onClick={() => handleDelete(doc.id)}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
