"use client";

import { useEffect, useState } from "react";

interface DocumentItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export default function DocumentsPanel() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadDocuments() {
    const res = await fetch("/api/documents");
    if (!res.ok) return;
    const body = await res.json();
    setDocuments(body.documents ?? []);
  }

  useEffect(() => {
    // Initial data fetch on mount, per Task 11 brief. eslint-plugin-react-hooks@7's
    // set-state-in-effect rule flags this idiomatic pattern; suppressed rather than
    // restructured so behavior matches the brief exactly.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDocuments();
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
          filename: file.name,
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

      await loadDocuments();
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
    // Navigating the current tab (rather than window.open, which needs a
    // fresh user gesture that two awaits above have already consumed and
    // gets blocked by popup blockers in Safari/Firefox) starts the download
    // without leaving the page, since the response carries
    // Content-Disposition: attachment. eslint-plugin-react-hooks@7's
    // immutability rule flags assigning window.location.href as mutating
    // state defined outside the component; suppressed because this is a
    // plain browser-navigation side effect inside a click handler, not a
    // React state mutation during render.
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
    await loadDocuments();
  }

  return (
    <section style={{ marginTop: 40 }}>
      <h2>Mes documents</h2>
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
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            {doc.filename}{" "}
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
