"use client";

import { useEffect, useState } from "react";
import type { DossierStatus } from "@/db/schema";
import { useT } from "@/lib/i18n/I18nProvider";
import { SelectField } from "@/components/declaration/Field";
import { FormAlert } from "@/components/ui/Field";
import { CANTONS } from "@/lib/declaration";

/**
 * "Prestation en capital" — the reference's bespoke form (Fiduvia.dc.html):
 * year of withdrawal, canton, the insurance/bank certificate, the CHF 50 flat
 * fee, and a single "Transmettre ce dossier" action. Non-declaration
 * prestations are priced by the firm, so transmitting submits the dossier
 * directly (no online payment step).
 */

const DOC_CATEGORY = "attestationCapital";
const CAPITAL_FEE = 50;
const ALLOWED = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE = 20 * 1024 * 1024;

interface Doc {
  id: string;
  filename: string;
  category: string;
}

export function CapitalForm({
  dossierId,
  taxYear,
}: {
  dossierId: string;
  taxYear: number;
}) {
  const t = useT();
  const f = t.capitalForm;

  const [status, setStatus] = useState<DossierStatus>("not_started");
  const [canton, setCanton] = useState("");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch(`/api/dossiers/${dossierId}`);
    if (!res.ok) return;
    const body = await res.json();
    setStatus(body.dossier.status);
    setCanton(body.dossier.answers?.canton ?? "");
    setDocs(body.documents ?? []);
    setLoaded(true);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    load();
  }, []);

  const attestation = docs.find((d) => d.category === DOC_CATEGORY);
  const readOnly = status !== "not_started";

  /** Merge one field into the stored answers (the endpoint takes the whole object). */
  async function saveAnswers(patch: Record<string, unknown>) {
    const res = await fetch(`/api/dossiers/${dossierId}`);
    const body = await res.json();
    const answers = { ...(body.dossier?.answers ?? {}), ...patch };
    await fetch(`/api/dossiers/${dossierId}/answers`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answers }),
    });
  }

  async function onCanton(next: string) {
    setCanton(next);
    await saveAnswers({ canton: next });
  }

  async function upload(file: File) {
    setError("");
    if (!ALLOWED.includes(file.type)) {
      setError(t.documents.errType);
      return;
    }
    if (file.size > MAX_SIZE) {
      setError(t.documents.errTooLarge);
      return;
    }
    setBusy(true);
    try {
      const startRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          dossierId,
          filename: file.name,
          category: DOC_CATEGORY,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!startRes.ok) return setError(f.error);
      const { documentId, uploadUrl } = await startRes.json();
      const put = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!put.ok) return setError(f.error);
      const conf = await fetch(`/api/documents/${documentId}/confirm`, {
        method: "POST",
      });
      if (!conf.ok) return setError(f.error);
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function removeDoc(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function download(id: string) {
    const res = await fetch(`/api/documents/${id}/download-url`);
    if (!res.ok) return;
    const { downloadUrl } = await res.json();
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = downloadUrl;
  }

  async function transmit() {
    if (!attestation) {
      setError(f.needDoc);
      return;
    }
    setError("");
    setBusy(true);
    try {
      await saveAnswers({ canton });
      const sub = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "submitted" }),
      });
      if (!sub.ok) return setError(f.error);
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (!loaded) {
    return <p className="text-[13px] text-muted">{t.documents.loading}</p>;
  }

  if (readOnly) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
        <h2 className="disp m-0 text-[18px] font-bold">{f.transmittedTitle}</h2>
        <p className="mt-1.5 text-[14px] leading-[1.5] text-muted">
          {f.transmittedBody}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
      <div className="flex flex-col gap-5">
        <SelectField
          label={f.yearLabel}
          value={String(taxYear)}
          onChange={() => {}}
          options={[{ value: String(taxYear), label: String(taxYear) }]}
        />

        <SelectField
          label={f.cantonLabel}
          value={canton}
          onChange={onCanton}
          options={[
            { value: "", label: f.cantonPlaceholder },
            ...CANTONS.map((c) => ({ value: c, label: c })),
          ]}
        />

        {/* Attestation document */}
        <div>
          <p className="fx-field-label m-0">{f.docTitle}</p>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-sunken px-4 py-3.5">
            <span className="flex min-w-[180px] flex-1 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-brand">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-[17px] w-[17px]"
                  aria-hidden="true"
                >
                  <path d="M6 3h9l3 3v15H6z" />
                  <path d="M14 3v4h4" />
                </svg>
              </span>
              <span className="flex flex-col">
                <span className="text-[14px] font-semibold text-strong">
                  {f.docTitle}
                </span>
                <span className="text-[12.5px] text-muted">
                  {attestation ? attestation.filename : f.docHint}
                </span>
              </span>
            </span>

            {attestation ? (
              <span className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => download(attestation.id)}
                  className="rounded-lg border border-line-default px-3 py-1.5 text-[12px] font-medium text-brand transition hover:bg-card"
                >
                  {f.download}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeDoc(attestation.id)}
                  className="rounded-lg border border-line-default px-3 py-1.5 text-[12px] font-medium text-muted transition hover:bg-card disabled:opacity-60"
                >
                  {f.remove}
                </button>
              </span>
            ) : (
              <label className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-[12.5px] font-semibold text-white transition hover:bg-brand-hover">
                {busy ? f.transmitting : f.upload}
                <input
                  type="file"
                  accept="application/pdf,image/jpeg,image/png"
                  disabled={busy}
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(file);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Flat fee */}
        <div className="flex items-baseline justify-between gap-4 border-t border-line pt-4">
          <span className="text-[15px] font-semibold text-strong">
            {f.priceLabel}
          </span>
          <span
            className="fx-figure text-[22px] font-extrabold leading-none"
            style={{ color: "var(--brand)" }}
          >
            CHF {CAPITAL_FEE}
          </span>
        </div>

        {error ? <FormAlert variant="error">{error}</FormAlert> : null}

        <button
          type="button"
          disabled={busy || !attestation}
          onClick={transmit}
          className="flex h-[48px] w-full items-center justify-center rounded-xl bg-brand text-[15px] font-semibold transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
          style={{ color: "#fff" }}
        >
          {busy ? f.transmitting : `${f.transmit} →`}
        </button>
      </div>
    </div>
  );
}
