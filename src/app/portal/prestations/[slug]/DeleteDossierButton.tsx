"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";

/**
 * The mockup's per-row trash button (`class="scpd"`). Only rendered for a draft
 * (never-submitted) request, since that is all the API will delete. A draft can
 * hold uploaded documents, so a click asks to confirm before removing it.
 */
export function DeleteDossierButton({
  t,
  dossierId,
  title,
}: {
  t: Messages;
  dossierId: string;
  title: string;
}) {
  const router = useRouter();
  const p = t.portal.prestation;
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  async function remove() {
    setBusy(true);
    setError(false);
    try {
      const res = await fetch(`/api/dossiers/${dossierId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setConfirming(false);
        router.refresh();
        return;
      }
      setError(true);
    } catch {
      setError(true);
    }
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        title={title}
        aria-label={title}
        onClick={() => setConfirming(true)}
        className="flex h-[38px] w-[38px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] border bg-card transition hover:bg-[#FBE7E4]"
        style={{ borderColor: "#ECC9C9", color: "#C0584A" }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
      </button>

      {confirming ? (
        <div
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setConfirming(false);
          }}
          className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto bg-[rgba(13,21,38,.55)] p-6 backdrop-blur-[3px]"
        >
          <div
            role="dialog"
            aria-modal="true"
            className="my-auto w-full max-w-[440px] rounded-[var(--radius-xl)] bg-card px-8 py-[30px] shadow-[0_40px_90px_-30px_rgba(11,32,48,.6)]"
          >
            <h2 className="disp m-0 text-[21px] font-extrabold leading-[1.2]">
              {p.deleteTitle}
            </h2>
            <p className="mt-2.5 text-[14.5px] leading-[1.55] text-muted">
              {p.deleteBody}
            </p>

            {error ? (
              <p role="alert" className="mt-3 text-[13px] text-[#A2443A]">
                {p.deleteFailed}
              </p>
            ) : null}

            <div className="mt-6 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="rounded-[var(--radius-md)] border border-line-default px-5 py-3 text-[15px] font-semibold text-body transition-colors hover:border-teal-300"
              >
                {p.deleteCancel}
              </button>
              <button
                type="button"
                onClick={remove}
                disabled={busy}
                className="rounded-[var(--radius-md)] px-5 py-3 text-[15px] font-semibold text-white transition-colors disabled:opacity-60"
                style={{ background: "#C0584A" }}
              >
                {busy ? p.deleting : p.deleteConfirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
