"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormAlert } from "@/components/ui/Field";
import { STATUS_LABELS } from "@/components/ui/StatusBadge";
import type { DossierStatus } from "@/db/schema";

const statusOptions = (
  Object.keys(STATUS_LABELS) as DossierStatus[]
).map((value) => ({ value, label: STATUS_LABELS[value] }));

export default function DossierAdminForms() {
  const router = useRouter();

  const [clientId, setClientId] = useState("");
  const [taxYear, setTaxYear] = useState("");

  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [statusDossierId, setStatusDossierId] = useState("");
  const [status, setStatus] = useState<string>("not_started");

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  async function handleCreate() {
    setCreateMessage(null);
    setCreateError(null);

    if (!clientId.trim()) {
      setCreateError("Veuillez renseigner l'identifiant du client.");
      return;
    }

    if (!taxYear || Number(taxYear) < 2000) {
      setCreateError("Veuillez renseigner une année fiscale valide.");
      return;
    }

    setCreating(true);

    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ clientId, taxYear: Number(taxYear) }),
      });

      if (!res.ok) {
        setCreateError("Échec de la création du dossier.");
        return;
      }

      const body = await res.json();

      setCreateMessage(`Dossier créé : ${body.dossier.id}`);
      setClientId("");
      setTaxYear("");
      router.refresh();
    } catch {
      setCreateError(
        "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function handleSetStatus() {
    setStatusMessage(null);
    setStatusError(null);

    if (!statusDossierId.trim()) {
      setStatusError("Veuillez renseigner l'identifiant du dossier.");
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch(`/api/dossiers/${statusDossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        setStatusError("Échec du changement de statut.");
        return;
      }

      setStatusMessage("Le statut du dossier a été mis à jour.");
      router.refresh();
    } catch {
      setStatusError(
        "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
      );
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="mt-4 grid gap-3.5 lg:grid-cols-2">
      {/* Create */}
      <section className="rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          Créer un dossier
        </span>

        <p className="mt-2 text-[12.5px] leading-[1.4] text-muted">
          Créez un nouveau dossier fiscal pour un client.
        </p>

        <div className="mt-4 space-y-4">
          <Field
            id="clientId"
            label="Identifiant du client"
            type="text"
            placeholder="Ex. cli_8f92..."
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />

          <Field
            id="taxYear"
            label="Année fiscale"
            type="number"
            min="2000"
            max="2100"
            placeholder="2026"
            value={taxYear}
            onChange={(e) => setTaxYear(e.target.value)}
          />

          {createError && <FormAlert variant="error">{createError}</FormAlert>}
          {createMessage && (
            <FormAlert variant="success">{createMessage}</FormAlert>
          )}

          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="flex h-[46px] w-full items-center justify-center rounded-xl bg-brand px-5 text-[14px] font-semibold text-white transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {creating ? "Création..." : "Créer le dossier"}
          </button>
        </div>
      </section>

      {/* Status */}
      <section className="rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          Modifier le statut
        </span>

        <p className="mt-2 text-[12.5px] leading-[1.4] text-muted">
          Mettez à jour l&apos;état d&apos;avancement d&apos;un dossier.
        </p>

        <div className="mt-4 space-y-4">
          <Field
            id="statusDossierId"
            label="Identifiant du dossier"
            type="text"
            placeholder="Ex. dos_8f92..."
            value={statusDossierId}
            onChange={(e) => setStatusDossierId(e.target.value)}
          />

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              Nouveau statut
            </label>

            <div className="relative">
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-[46px] w-full appearance-none rounded-xl border border-line-default bg-card px-4 pr-10 text-[14px] text-strong outline-none transition hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <svg
                viewBox="0 0 20 20"
                fill="none"
                className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              >
                <path
                  d="m6 8 4 4 4-4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {statusError && <FormAlert variant="error">{statusError}</FormAlert>}
          {statusMessage && (
            <FormAlert variant="success">{statusMessage}</FormAlert>
          )}

          <button
            type="button"
            onClick={handleSetStatus}
            disabled={updating}
            className="flex h-[46px] w-full items-center justify-center rounded-xl border border-line-default bg-card px-5 text-[14px] font-semibold text-strong transition hover:border-line-strong hover:bg-sunken focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {updating ? "Mise à jour..." : "Mettre à jour le statut"}
          </button>
        </div>
      </section>
    </div>
  );
}
