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
}: {
  documentId: string;
  label: string;
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
      className="rounded-lg border border-line-default px-3 py-1.5 text-[12.5px] font-medium text-brand transition hover:border-line-strong hover:bg-sunken disabled:opacity-60"
    >
      {label}
    </button>
  );
}
