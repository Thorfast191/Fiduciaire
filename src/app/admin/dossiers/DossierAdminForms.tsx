"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormAlert } from "@/components/ui/Field";
import { STATUS_ORDER } from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n/I18nProvider";

export default function DossierAdminForms() {
  const t = useT();
  const router = useRouter();

  const statusOptions = STATUS_ORDER.map((value) => ({
    value,
    label: t.status[value],
  }));

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
      setCreateError(t.admin.dossiers.errClientId);
      return;
    }

    if (!taxYear || Number(taxYear) < 2000) {
      setCreateError(t.admin.dossiers.errTaxYear);
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
        setCreateError(t.admin.dossiers.errCreate);
        return;
      }

      const body = await res.json();

      setCreateMessage(`${t.admin.dossiers.created} ${body.dossier.id}`);
      setClientId("");
      setTaxYear("");
      router.refresh();
    } catch {
      setCreateError(t.common.genericError);
    } finally {
      setCreating(false);
    }
  }

  async function handleSetStatus() {
    setStatusMessage(null);
    setStatusError(null);

    if (!statusDossierId.trim()) {
      setStatusError(t.admin.dossiers.errDossierId);
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
        setStatusError(t.admin.dossiers.errStatus);
        return;
      }

      setStatusMessage(t.admin.dossiers.statusUpdated);
      router.refresh();
    } catch {
      setStatusError(t.common.genericError);
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="mt-4 grid gap-3.5 lg:grid-cols-2">
      {/* Create */}
      <section className="rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          {t.admin.dossiers.createTitle}
        </span>

        <p className="mt-2 text-[12.5px] leading-[1.4] text-muted">
          {t.admin.dossiers.createSub}
        </p>

        <div className="mt-4 space-y-4">
          <Field
            id="clientId"
            label={t.admin.dossiers.clientIdLabel}
            type="text"
            placeholder={t.admin.dossiers.clientIdPlaceholder}
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />

          <Field
            id="taxYear"
            label={t.admin.dossiers.taxYearLabel}
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
            {creating
              ? t.admin.dossiers.creating
              : t.admin.dossiers.createSubmit}
          </button>
        </div>
      </section>

      {/* Status */}
      <section className="rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          {t.admin.dossiers.statusTitle}
        </span>

        <p className="mt-2 text-[12.5px] leading-[1.4] text-muted">
          {t.admin.dossiers.statusSub}
        </p>

        <div className="mt-4 space-y-4">
          <Field
            id="statusDossierId"
            label={t.admin.dossiers.dossierIdLabel}
            type="text"
            placeholder={t.admin.dossiers.dossierIdPlaceholder}
            value={statusDossierId}
            onChange={(e) => setStatusDossierId(e.target.value)}
          />

          <div>
            <label
              htmlFor="status"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
            >
              {t.admin.dossiers.newStatusLabel}
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
            {updating
              ? t.admin.dossiers.updating
              : t.admin.dossiers.statusSubmit}
          </button>
        </div>
      </section>
    </div>
  );
}
