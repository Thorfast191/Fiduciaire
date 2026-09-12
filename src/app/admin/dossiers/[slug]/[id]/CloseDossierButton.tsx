"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * "Clôturer le dossier" on its own, for the prestation detail screens that do
 * not carry the declaration's full action bar.
 *
 * It keeps the same confirmation step as `DossierAdminActions`: closing tells
 * the client the work is finished, so it is not a one-click move. An already
 * closed dossier shows the button disabled, as the reference does.
 */
export default function CloseDossierButton({
  dossierId,
  closed,
}: {
  dossierId: string;
  closed: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function close() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={closed || busy}
        onClick={() => setConfirming(true)}
        className="rounded-[11px] bg-brand px-[18px] py-[11px] text-[14.5px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-[#EDF1F6] disabled:text-[#AEB7C4]"
      >
        {closed ? t.admin.detail.closed : t.admin.detail.close}
      </button>

      {error ? (
        <p role="alert" className="text-[13px] text-red-600">
          {error}
        </p>
      ) : null}

      {confirming ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,21,38,0.5)] p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-[420px] rounded-[20px] bg-card p-7 text-center shadow-[0_40px_90px_-30px_rgba(13,21,38,0.6)]">
            <h2 className="text-[19px] font-bold text-strong">
              {t.admin.detail.closeConfirmTitle}
            </h2>
            <p className="mt-2 text-[14.5px] leading-[1.55] text-muted">
              {t.admin.detail.closeConfirmBody}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirming(false)}
                className="flex-1 rounded-[11px] border border-line-default bg-card px-3 py-3 text-[15px] font-semibold text-body transition hover:bg-sunken disabled:opacity-60"
              >
                {t.admin.detail.closeNo}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={close}
                className="flex-1 rounded-[11px] bg-brand px-3 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
              >
                {busy ? t.admin.detail.closing : t.admin.detail.closeYes}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
