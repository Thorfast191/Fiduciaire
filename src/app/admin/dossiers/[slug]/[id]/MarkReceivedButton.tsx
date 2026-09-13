"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * "Marquer les pièces reçues" — the reference's one-click shortcut beside the
 * document count, for the common step of acknowledging that everything asked
 * for has arrived. The same status is reachable from the status control; this
 * saves opening it for the move an administrator makes most often.
 */
export default function MarkReceivedButton({ dossierId }: { dossierId: string }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function mark() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: "documents_received" }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.ok) {
        setError(body?.error ?? t.common.genericError);
        return;
      }
      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      {error ? (
        <span role="alert" className="text-[12.5px] text-red-600">
          {error}
        </span>
      ) : null}
      <button
        type="button"
        onClick={mark}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-[10px] bg-[#DDF3F4] px-[15px] py-[9px] text-[14px] font-semibold text-[#0E7C86] transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? t.admin.detail.marking : t.admin.detail.markReceived}
      </button>
    </span>
  );
}
