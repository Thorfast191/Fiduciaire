"use client";

import { useState } from "react";

export default function AdminDossiersPage() {
  const [clientId, setClientId] = useState("");
  const [taxYear, setTaxYear] = useState("");
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [statusDossierId, setStatusDossierId] = useState("");
  const [status, setStatus] = useState("not_started");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleCreate() {
    setCreateMessage(null);
    const res = await fetch("/api/dossiers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, taxYear: Number(taxYear) }),
    });
    if (!res.ok) {
      setCreateMessage("Échec de la création du dossier.");
      return;
    }
    const body = await res.json();
    setCreateMessage(`Dossier créé : ${body.dossier.id}`);
  }

  async function handleSetStatus() {
    setStatusMessage(null);
    const res = await fetch(`/api/dossiers/${statusDossierId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setStatusMessage("Échec du changement de statut.");
      return;
    }
    setStatusMessage("Statut mis à jour.");
  }

  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <p>
        <a href="/admin">← Retour</a>
      </p>
      <h1>Dossiers fiscaux</h1>

      <h2>Créer un dossier</h2>
      <input
        placeholder="ID du client"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <input
        placeholder="Année fiscale"
        value={taxYear}
        onChange={(e) => setTaxYear(e.target.value)}
      />
      <button type="button" onClick={handleCreate}>
        Créer
      </button>
      {createMessage && <p role="alert">{createMessage}</p>}

      <h2>Changer le statut d&apos;un dossier</h2>
      <input
        placeholder="ID du dossier"
        value={statusDossierId}
        onChange={(e) => setStatusDossierId(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="not_started">Non commencé</option>
        <option value="submitted">Soumis</option>
        <option value="in_review">En cours de traitement</option>
        <option value="completed">Terminé</option>
      </select>
      <button type="button" onClick={handleSetStatus}>
        Mettre à jour
      </button>
      {statusMessage && <p role="alert">{statusMessage}</p>}
    </main>
  );
}
