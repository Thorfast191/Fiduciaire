"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface ClosureDoc {
  id: string;
  category: string;
  filename: string;
}

const SLOTS = [
  { category: "closureCopieDecl", labelKey: "closureCopieDecl" },
  { category: "closureQuittancement", labelKey: "closureQuittancement" },
  { category: "closureDossierSuivant", labelKey: "closureDossierSuivant" },
] as const;

/**
 * The mockup's "Documents de clôture": three slots the firm uploads at the end,
 * which the client sees once the dossier is closed. Each slot shows its file (if
 * any) with a download link, and a "Téléverser" control to replace/add.
 */
export default function ClosureDocuments({
  dossierId,
  documents,
}: {
  dossierId: string;
  documents: ClosureDoc[];
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const byCategory = new Map(documents.map((d) => [d.category, d]));

  async function upload(category: string, file: File) {
    setBusy(category);
    setError(null);
    try {
      const form = new FormData();
      form.append("category", category);
      form.append("file", file);
      const res = await fetch(`/api/admin/dossiers/${dossierId}/closure-docs`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      router.refresh();
    } catch {
      setError(t.admin.detail.errAction);
    } finally {
      setBusy(null);
    }
  }

  async function download(id: string) {
    const res = await fetch(`/api/documents/${id}/download-url`);
    if (!res.ok) {
      setError(t.admin.detail.errAction);
      return;
    }
    const { downloadUrl } = await res.json();
    // Same-tab navigation to the signed URL (see DossierDetail for the rationale).
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = downloadUrl;
  }

  return (
    <section className="rounded-2xl border border-line bg-card px-6 py-[22px]">
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="whitespace-nowrap text-[16px] font-bold text-strong">
          {t.admin.detail.closureTitle}
        </h2>
        <span className="text-[12.5px] text-muted">
          {t.admin.detail.closureHint}
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        {SLOTS.map((slot) => {
          const doc = byCategory.get(slot.category);
          return (
            <div
              key={slot.category}
              className="flex items-center gap-3.5 rounded-[12px] border border-line px-3.5 py-3"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-teal-100 text-brand">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-[19px] w-[19px]"
                  aria-hidden="true"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                </svg>
              </span>

              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-[14.5px] font-semibold text-strong">
                  {t.admin.detail[slot.labelKey]}
                </span>
                {doc ? (
                  <button
                    type="button"
                    onClick={() => download(doc.id)}
                    className="mt-0.5 truncate text-left text-[13px] text-brand underline"
                  >
                    {doc.filename}
                  </button>
                ) : null}
              </span>

              <label className="shrink-0 cursor-pointer rounded-[9px] bg-brand px-3.5 py-2 text-[13.5px] font-semibold text-white transition hover:bg-brand-hover">
                {busy === slot.category
                  ? t.admin.detail.uploading
                  : t.admin.detail.upload}
                <input
                  type="file"
                  className="hidden"
                  disabled={busy !== null}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) upload(slot.category, file);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}
    </section>
  );
}
