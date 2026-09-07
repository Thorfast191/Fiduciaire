"use client";

import { useEffect, useState } from "react";
import type { DossierStatus } from "@/db/schema";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useT } from "@/lib/i18n/I18nProvider";
import { serviceLabel, type ServiceType } from "@/lib/serviceTypes";
import { FormAlert } from "@/components/ui/Field";

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
  serviceType: ServiceType;
  status: DossierStatus;
}

const CATEGORY_KEYS = [
  "salaire",
  "releves_bancaires",
  "assurance",
  "pilier3",
  "justificatifs",
  "autre",
] as const;

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export default function DossierDetail({ dossierId }: { dossierId: string }) {
  const t = useT();
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
    // Initial data fetch on mount, once. `loadDossier` is defined at
    // component scope (reused by handleUpload/handleDelete/handleSubmit
    // below), so it can't be nested inside this effect the way a
    // single-use fetch helper could be. That's what triggers
    // set-state-in-effect below (it transitively calls
    // setDossier/setDocuments) and exhaustive-deps on the dependency
    // array (it's used here but intentionally omitted — including it
    // would need wrapping it in useCallback for no real benefit here).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDossier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUpload(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(t.documents.errType);
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(t.documents.errTooLarge);
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
        setError(t.documents.errStart);
        return;
      }
      const { documentId, uploadUrl } = await startRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        setError(t.documents.errUpload);
        return;
      }

      const confirmRes = await fetch(`/api/documents/${documentId}/confirm`, {
        method: "POST",
      });
      if (!confirmRes.ok) {
        setError(t.documents.errConfirm);
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
      setError(t.documents.errDownload);
      return;
    }
    const { downloadUrl } = await res.json();
    // Same-tab navigation (not window.open) so it works regardless of
    // popup-blocker state — window.open needs a fresh user gesture that
    // the two awaits above have already consumed.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = downloadUrl;
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError(t.documents.errDelete);
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
      setError(t.documents.errSubmit);
      return;
    }
    await loadDossier();
  }

  if (!dossier) {
    return <p className="text-[13px] text-muted">{t.documents.loading}</p>;
  }

  const inputCls =
    "rounded-xl border border-line-default bg-card px-3 py-2 text-[13px] text-strong outline-none transition-colors hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:cursor-not-allowed disabled:opacity-60";
  const btnGhost =
    "rounded-lg border border-line-default px-3 py-1.5 text-[12px] font-medium text-brand transition hover:border-line-strong hover:bg-sunken";

  return (
    <section className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[20px] font-semibold tracking-[-0.03em] text-strong">
          {dossier.serviceType === "declaration"
            ? t.documents.fiscalDossier
            : serviceLabel(t, dossier.serviceType)}{" "}
          {dossier.taxYear}
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted">
            {t.documents.statusLabel}
          </span>
          <StatusBadge status={dossier.status} />
        </div>
      </div>

      {dossier.status === "not_started" && (
        <button
          type="button"
          onClick={handleSubmit}
          className="mt-4 inline-flex h-[42px] items-center justify-center rounded-xl bg-brand px-5 text-[13px] font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/15"
        >
          {t.documents.markSubmitted}
        </button>
      )}

      <h2 className="mt-8 text-[15px] font-semibold text-strong">
        {t.documents.addTitle}
      </h2>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputCls}
        >
          {CATEGORY_KEYS.map((key) => (
            <option key={key} value={key}>
              {t.documents.categories[key]}
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
          className="text-[13px] text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-sunken file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-brand"
        />
      </div>
      {uploading && (
        <p className="mt-3 text-[13px] text-muted">{t.documents.uploading}</p>
      )}
      {error && (
        <div className="mt-3">
          <FormAlert variant="error">{error}</FormAlert>
        </div>
      )}

      <h2 className="mt-8 text-[15px] font-semibold text-strong">
        {t.documents.title}
      </h2>
      {documents.length === 0 && (
        <p className="mt-3 text-[13px] text-muted">{t.documents.empty}</p>
      )}
      <ul className="mt-4 flex flex-col gap-2">
        {documents.map((doc) => (
          <li
            key={doc.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card px-4 py-3"
          >
            <span className="text-[13px] text-strong">
              [
              {t.documents.categories[
                doc.category as keyof typeof t.documents.categories
              ] ?? doc.category}
              ] {doc.filename}
            </span>{" "}
            <button
              type="button"
              onClick={() => handleDownload(doc.id)}
              className={btnGhost}
            >
              {t.documents.download}
            </button>{" "}
            <button
              type="button"
              onClick={() => handleDelete(doc.id)}
              className={btnGhost}
            >
              {t.documents.remove}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
