"use client";

import { useState } from "react";
import Link from "next/link";
import { Field, FormAlert } from "@/components/ui/Field";

const statusOptions = [
  {
    value: "not_started",
    label: "Non commencé",
  },
  {
    value: "submitted",
    label: "Soumis",
  },
  {
    value: "in_review",
    label: "En cours de traitement",
  },
  {
    value: "completed",
    label: "Terminé",
  },
];

export default function AdminDossiersPage() {
  const [clientId, setClientId] = useState("");
  const [taxYear, setTaxYear] = useState("");

  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [statusDossierId, setStatusDossierId] = useState("");
  const [status, setStatus] = useState("not_started");

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
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          clientId,
          taxYear: Number(taxYear),
        }),
      });

      if (!res.ok) {
        setCreateError("Échec de la création du dossier.");
        return;
      }

      const body = await res.json();

      setCreateMessage(`Dossier créé : ${body.dossier.id}`);
      setClientId("");
      setTaxYear("");
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
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      if (!res.ok) {
        setStatusError("Échec du changement de statut.");
        return;
      }

      setStatusMessage("Le statut du dossier a été mis à jour.");
    } catch {
      setStatusError(
        "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
      );
    } finally {
      setUpdating(false);
    }
  }

  const selectedStatus =
    statusOptions.find((option) => option.value === status)?.label ??
    "Non commencé";

  return (
    <main className="min-h-screen bg-surface text-strong">
      {/* Main */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[12px] font-medium text-muted transition hover:text-strong"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M12.5 4.5 7 10l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Retour au tableau de bord
          </Link>
        </div>

        {/* Page heading */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="fx-eyebrow">Gestion administrative</p>

            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.04em] sm:text-[38px]">
              Dossiers fiscaux
            </h1>

            <p className="mt-2 max-w-[600px] text-[14px] leading-6 text-muted">
              Créez et gérez les dossiers fiscaux de vos clients et suivez leur
              progression.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-line bg-card px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-brand">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-4 w-4"
              >
                <path d="M6 3h9l3 3v15H6z" />
                <path d="M14 3v4h4" />
                <path d="M9 12h6M9 16h6" />
              </svg>
            </span>

            <div>
              <p className="text-[10px] uppercase tracking-[0.08em] text-subtle">
                Section
              </p>
              <p className="text-[12px] font-medium text-strong">Dossiers</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {/* Create dossier */}
          <section className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-brand">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5"
                  >
                    <path d="M5 4h10l4 4v12H5z" />
                    <path d="M14 4v5h5" />
                    <path d="M12 13v5M9.5 15.5h5" />
                  </svg>
                </div>

                <h2 className="mt-5 text-[19px] font-semibold tracking-[-0.025em]">
                  Créer un dossier
                </h2>

                <p className="mt-1.5 text-[13px] leading-5 text-muted">
                  Créez un nouveau dossier fiscal pour un client.
                </p>
              </div>

              <span className="text-[11px] font-medium text-subtle">01</span>
            </div>

            <div className="mt-7 space-y-5">
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

              {createError && (
                <FormAlert variant="error">{createError}</FormAlert>
              )}

              {createMessage && (
                <FormAlert variant="success">{createMessage}</FormAlert>
              )}

              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex h-[48px] w-full items-center justify-center rounded-xl bg-brand px-5 text-[13px] font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Création...
                  </span>
                ) : (
                  <>
                    Créer le dossier
                    <span className="ml-2">→</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Update status */}
          <section className="rounded-2xl border border-line bg-card p-6 shadow-sm sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-brand">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5"
                  >
                    <circle cx="12" cy="12" r="8" />
                    <path d="M12 8v4l2.5 2" />
                  </svg>
                </div>

                <h2 className="mt-5 text-[19px] font-semibold tracking-[-0.025em]">
                  Modifier le statut
                </h2>

                <p className="mt-1.5 text-[13px] leading-5 text-muted">
                  Mettez à jour l&apos;état d&apos;avancement d&apos;un dossier.
                </p>
              </div>

              <span className="text-[11px] font-medium text-subtle">02</span>
            </div>

            <div className="mt-7 space-y-5">
              <Field
                id="statusDossierId"
                label="Identifiant du dossier"
                type="text"
                placeholder="Ex. dos_8f92..."
                value={statusDossierId}
                onChange={(e) => setStatusDossierId(e.target.value)}
              />

              {/* Status */}
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
                    className="h-[48px] w-full appearance-none rounded-xl border border-line-default bg-card px-4 pr-10 text-[14px] text-strong outline-none transition hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
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

              {/* Current selection */}
              <div className="flex items-center justify-between rounded-xl bg-sunken px-4 py-3">
                <span className="text-[11px] text-muted">
                  Statut sélectionné
                </span>

                <span className="rounded-full bg-teal-100 px-2.5 py-1 text-[10px] font-medium text-brand">
                  {selectedStatus}
                </span>
              </div>

              {statusError && (
                <FormAlert variant="error">{statusError}</FormAlert>
              )}

              {statusMessage && (
                <FormAlert variant="success">{statusMessage}</FormAlert>
              )}

              <button
                type="button"
                onClick={handleSetStatus}
                disabled={updating}
                className="flex h-[48px] w-full items-center justify-center rounded-xl border border-line-default bg-card px-5 text-[13px] font-medium text-strong transition hover:border-line-strong hover:bg-sunken focus:outline-none focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-default border-t-brand" />
                    Mise à jour...
                  </span>
                ) : (
                  "Mettre à jour le statut"
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Status guide */}
        <section className="mt-5 rounded-2xl border border-line bg-card p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[12px] font-semibold text-strong">
                Cycle de traitement
              </p>
              <p className="mt-1 text-[12px] text-muted">
                Les statuts permettent de suivre la progression d&apos;un dossier.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <span
                  key={option.value}
                  className="rounded-full border border-line bg-sunken px-3 py-1.5 text-[10px] font-medium text-muted"
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-subtle">
          Fiduvia Administration · Gestion sécurisée des dossiers
        </p>
      </div>
    </main>
  );
}
