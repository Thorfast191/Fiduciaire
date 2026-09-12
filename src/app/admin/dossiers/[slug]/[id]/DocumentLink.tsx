"use client";

import { useState } from "react";

/**
 * Fetches a short-lived presigned URL, then opens it.
 *
 * The URL is not rendered into the page: it grants direct read access to the
 * object for a few minutes, so it is requested at the moment of the click
 * rather than embedded in HTML that may be cached or screenshotted.
 */
export function DocumentLink({
  documentId,
  label,
  /** "solid" is the filled brand button the capital detail card uses. */
  variant = "outline",
}: {
  documentId: string;
  label: string;
  variant?: "outline" | "solid";
}) {
  const [busy, setBusy] = useState(false);

  async function open() {
    setBusy(true);
    try {
      const res = await fetch(`/api/documents/${documentId}/download-url`);
      if (!res.ok) return;
      const { downloadUrl } = await res.json();
      window.open(downloadUrl, "_blank", "noopener");
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={open}
      disabled={busy}
      className={
        variant === "solid"
          ? "inline-flex shrink-0 items-center gap-2 rounded-[10px] bg-brand px-[15px] py-[9px] text-[13.5px] font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          : "rounded-lg border border-line-default px-3 py-1.5 text-[12.5px] font-medium text-brand transition hover:border-line-strong hover:bg-sunken disabled:opacity-60"
      }
    >
      {variant === "solid" ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="h-[18px] w-[18px]"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ) : null}
      {label}
    </button>
  );
}
