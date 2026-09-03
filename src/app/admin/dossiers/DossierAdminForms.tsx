"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, FormAlert } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/I18nProvider";

export default function DossierAdminForms() {
  const t = useT();
  const router = useRouter();

  const [clientId, setClientId] = useState("");
  const [taxYear, setTaxYear] = useState("");

  const [createMessage, setCreateMessage] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

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

  return (
    <div className="mt-4 max-w-[520px]">
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
    </div>
  );
}
