"use client";

import { useState } from "react";
import Link from "next/link";

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
    <main className="min-h-screen bg-[#F5F7F5] text-[#17231D]">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-[#E1E6E2] bg-white/95 backdrop-blur">
        <div className="flex h-[72px] items-center justify-between px-5 sm:px-7 lg:px-10">
          <div className="flex items-center gap-8">
            <Link
              href="/admin"
              className="text-[23px] font-semibold tracking-[-0.05em]"
            >
              fiduvia
            </Link>

            <div className="hidden h-6 w-px bg-[#E3E7E4] sm:block" />

            <div className="hidden sm:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#8A938D]">
                Administration
              </p>
              <p className="mt-0.5 text-[12px] text-[#68736D]">
                Gestion des dossiers
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="rounded-lg px-3 py-2 text-[13px] font-medium text-[#68736D] transition hover:bg-[#F5F7F5] hover:text-[#17231D]"
            >
              Tableau de bord
            </Link>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17231D] text-[11px] font-medium text-white">
              AD
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-[12px] font-medium text-[#7A847E] transition hover:text-[#17231D]"
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
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#65796C]">
              Gestion administrative
            </p>

            <h1 className="mt-2 text-[32px] font-semibold tracking-[-0.04em] sm:text-[38px]">
              Dossiers fiscaux
            </h1>

            <p className="mt-2 max-w-[600px] text-[14px] leading-6 text-[#737E77]">
              Créez et gérez les dossiers fiscaux de vos clients et suivez leur
              progression.
            </p>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#DCE3DD] bg-white px-4 py-3">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF3EF] text-[#536B5C]">
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
              <p className="text-[10px] uppercase tracking-[0.08em] text-[#8A938D]">
                Section
              </p>
              <p className="text-[12px] font-medium text-[#29342E]">Dossiers</p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="mt-9 grid gap-5 lg:grid-cols-2">
          {/* Create dossier */}
          <section className="rounded-2xl border border-[#E0E5E1] bg-white p-6 shadow-[0_8px_30px_rgba(23,35,29,0.04)] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3EF] text-[#536B5C]">
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

                <p className="mt-1.5 text-[13px] leading-5 text-[#7A847E]">
                  Créez un nouveau dossier fiscal pour un client.
                </p>
              </div>

              <span className="text-[11px] font-medium text-[#A0A9A3]">01</span>
            </div>

            <div className="mt-7 space-y-5">
              {/* Client ID */}
              <div>
                <label
                  htmlFor="clientId"
                  className="mb-2 block text-[12px] font-medium text-[#29342E]"
                >
                  Identifiant du client
                </label>

                <input
                  id="clientId"
                  type="text"
                  placeholder="Ex. cli_8f92..."
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="h-[48px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[14px] text-[#17231D] outline-none transition placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
                />
              </div>

              {/* Tax year */}
              <div>
                <label
                  htmlFor="taxYear"
                  className="mb-2 block text-[12px] font-medium text-[#29342E]"
                >
                  Année fiscale
                </label>

                <input
                  id="taxYear"
                  type="number"
                  min="2000"
                  max="2100"
                  placeholder="2026"
                  value={taxYear}
                  onChange={(e) => setTaxYear(e.target.value)}
                  className="h-[48px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[14px] text-[#17231D] outline-none transition placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
                />
              </div>

              {/* Create feedback */}
              {createError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F1C7C7] bg-[#FFF7F7] px-4 py-3 text-[12px] leading-5 text-[#A33A3A]"
                >
                  {createError}
                </div>
              )}

              {createMessage && (
                <div
                  role="status"
                  className="rounded-xl border border-[#D5E4D8] bg-[#F2F7F3] px-4 py-3 text-[12px] leading-5 text-[#536B5C]"
                >
                  {createMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleCreate}
                disabled={creating}
                className="flex h-[48px] w-full items-center justify-center rounded-xl bg-[#17231D] px-5 text-[13px] font-medium text-white transition hover:bg-[#293B31] focus:outline-none focus:ring-4 focus:ring-[#17231D]/15 disabled:cursor-not-allowed disabled:opacity-60"
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
          <section className="rounded-2xl border border-[#E0E5E1] bg-white p-6 shadow-[0_8px_30px_rgba(23,35,29,0.04)] sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EEF3EF] text-[#536B5C]">
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

                <p className="mt-1.5 text-[13px] leading-5 text-[#7A847E]">
                  Mettez à jour l&apos;état d&apos;avancement d&apos;un dossier.
                </p>
              </div>

              <span className="text-[11px] font-medium text-[#A0A9A3]">02</span>
            </div>

            <div className="mt-7 space-y-5">
              {/* Dossier ID */}
              <div>
                <label
                  htmlFor="statusDossierId"
                  className="mb-2 block text-[12px] font-medium text-[#29342E]"
                >
                  Identifiant du dossier
                </label>

                <input
                  id="statusDossierId"
                  type="text"
                  placeholder="Ex. dos_8f92..."
                  value={statusDossierId}
                  onChange={(e) => setStatusDossierId(e.target.value)}
                  className="h-[48px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[14px] text-[#17231D] outline-none transition placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
                />
              </div>

              {/* Status */}
              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-[12px] font-medium text-[#29342E]"
                >
                  Nouveau statut
                </label>

                <div className="relative">
                  <select
                    id="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="h-[48px] w-full appearance-none rounded-xl border border-[#D9DFDA] bg-white px-4 pr-10 text-[14px] text-[#17231D] outline-none transition hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
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
                    className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A847E]"
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
              <div className="flex items-center justify-between rounded-xl bg-[#F7F9F7] px-4 py-3">
                <span className="text-[11px] text-[#7A847E]">
                  Statut sélectionné
                </span>

                <span className="rounded-full bg-[#EAF1EB] px-2.5 py-1 text-[10px] font-medium text-[#536B5C]">
                  {selectedStatus}
                </span>
              </div>

              {/* Feedback */}
              {statusError && (
                <div
                  role="alert"
                  className="rounded-xl border border-[#F1C7C7] bg-[#FFF7F7] px-4 py-3 text-[12px] leading-5 text-[#A33A3A]"
                >
                  {statusError}
                </div>
              )}

              {statusMessage && (
                <div
                  role="status"
                  className="rounded-xl border border-[#D5E4D8] bg-[#F2F7F3] px-4 py-3 text-[12px] leading-5 text-[#536B5C]"
                >
                  {statusMessage}
                </div>
              )}

              <button
                type="button"
                onClick={handleSetStatus}
                disabled={updating}
                className="flex h-[48px] w-full items-center justify-center rounded-xl border border-[#D5DDD7] bg-white px-5 text-[13px] font-medium text-[#334139] transition hover:border-[#BFCAC2] hover:bg-[#F8FAF8] focus:outline-none focus:ring-4 focus:ring-[#65796C]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {updating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#D9DFDA] border-t-[#536B5C]" />
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
        <section className="mt-5 rounded-2xl border border-[#E0E5E1] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-[12px] font-semibold text-[#29342E]">
                Cycle de traitement
              </p>
              <p className="mt-1 text-[12px] text-[#7A847E]">
                Les statuts permettent de suivre la progression d&apos;un dossier.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {statusOptions.map((option) => (
                <span
                  key={option.value}
                  className="rounded-full border border-[#E0E5E1] bg-[#F7F9F7] px-3 py-1.5 text-[10px] font-medium text-[#68736D]"
                >
                  {option.label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-8 text-center text-[11px] text-[#929A95]">
          Fiduvia Administration · Gestion sécurisée des dossiers
        </p>
      </div>
    </main>
  );
}
