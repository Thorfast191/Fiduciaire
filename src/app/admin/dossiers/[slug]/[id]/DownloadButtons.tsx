"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/I18nProvider";

const DownloadIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <path d="M7 10l5 5 5-5" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/**
 * The two PDF downloads the reference stacks above "Documents reçus".
 *
 * Both routes stream a file rather than JSON, so the response cannot simply be
 * navigated to — a failure would replace the page with an error body. The
 * bytes are fetched, turned into an object URL and clicked, which also lets a
 * 409 ("no documents yet") surface as a message instead of a blank tab.
 */
export default function DownloadButtons({
  dossierId,
  clientName,
  isDeclaration,
}: {
  dossierId: string;
  clientName: string;
  isDeclaration: boolean;
}) {
  const t = useT();
  const d = t.admin.detail;
  const [busy, setBusy] = useState<"form" | "docs" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const slugName =
    clientName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase() || "client";

  async function download(kind: "form" | "docs") {
    setBusy(kind);
    setError(null);
    try {
      const path = kind === "form" ? "form-pdf" : "documents-pdf";
      const res = await fetch(`/api/dossiers/${dossierId}/${path}`);
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(
          body?.error === "no_documents" ? d.downloadNoDocs : d.downloadFailed,
        );
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${kind === "form" ? "formulaire" : "pieces"}-${slugName}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(d.downloadFailed);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-4 flex flex-col gap-2.5">
      {isDeclaration ? (
        <button
          type="button"
          onClick={() => download("form")}
          disabled={busy !== null}
          className="fx-btn-submit inline-flex w-full items-center justify-center gap-2.5 rounded-[12px] border-0 bg-brand px-[18px] py-[13px] text-[14.5px] font-semibold text-white transition hover:brightness-105 disabled:opacity-60"
        >
          <DownloadIcon />
          {busy === "form" ? d.downloadPreparing : d.downloadForm}
        </button>
      ) : null}

      <button
        type="button"
        onClick={() => download("docs")}
        disabled={busy !== null}
        className="inline-flex w-full items-center justify-center gap-2.5 rounded-[12px] border border-[#BFD8DC] bg-card px-[18px] py-[13px] text-[14.5px] font-semibold text-[#145863] transition hover:bg-sunken disabled:opacity-60"
      >
        <DownloadIcon />
        {busy === "docs" ? d.downloadPreparing : d.downloadDocs}
      </button>

      {error ? (
        <p className="text-[13px] text-[var(--danger)]">{error}</p>
      ) : null}
    </div>
  );
}
