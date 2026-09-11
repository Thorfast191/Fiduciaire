"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * The mockup's "Distribution automatique" control: spreads every unreserved
 * dossier of the selected period across the administrators. Super-admin only —
 * the hub renders it for no one else.
 */
export default function DistributeButton({ periode }: { periode: number }) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function distribute() {
    setBusy(true);
    setNote(null);

    try {
      const res = await fetch("/api/dossiers/distribute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taxYear: periode }),
      });
      const payload = await res.json().catch(() => null);

      if (!res.ok) {
        setNote({ ok: false, text: t.admin.hub.distributeError });
        return;
      }

      const assigned = Number(payload?.assigned ?? 0);
      setNote({
        ok: true,
        text:
          assigned === 0
            ? t.admin.hub.distributeNone
            : t.admin.hub.distributed.replace("{n}", String(assigned)),
      });
      router.refresh();
    } catch {
      setNote({ ok: false, text: t.admin.hub.distributeError });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={distribute}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-[11px] bg-petrol-800 px-[18px] py-[11px] text-[14px] font-semibold text-white transition hover:bg-petrol-900 focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? t.admin.hub.distributing : t.admin.hub.distribute}
      </button>

      {note ? (
        <span
          role="status"
          className={`absolute right-0 top-[calc(100%+8px)] whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-medium shadow-sm ${
            note.ok
              ? "bg-teal-100 text-brand"
              : "border border-red-600/25 bg-red-100 text-red-600"
          }`}
        >
          {note.text}
        </span>
      ) : null}
    </div>
  );
}
