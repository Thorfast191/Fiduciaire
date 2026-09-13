"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { STATUS_CLASS, STATUS_ORDER } from "@/lib/dossierStatus";
import { useT } from "@/lib/i18n/I18nProvider";
import type { DossierStatus } from "@/db/schema";

/**
 * "Statut du dossier" as the reference builds it: a pill button tinted with
 * the current status that opens a menu of the seven statuses, each with its
 * own colour dot and a check against the active one.
 *
 * A native `<select>` cannot carry the per-option dot, and the closed control
 * has to read as the status badge itself rather than as a form field, so this
 * is a button and a menu.
 */
export default function StatusMenu({
  dossierId,
  status,
}: {
  dossierId: string;
  status: DossierStatus;
}) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const wrap = useRef<HTMLSpanElement>(null);

  // A menu that only closed on mouse-leave stayed open behind the next click,
  // so it closes on any outside pointer press and on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function pick(next: DossierStatus) {
    setOpen(false);
    if (next === status) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
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
    <span ref={wrap} className="relative inline-flex">
      <button
        type="button"
        disabled={busy}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t.admin.detail.statusLabel}
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex max-w-full items-center gap-2 whitespace-nowrap rounded-[10px] border border-current px-3 py-2 text-[13.5px] font-bold transition disabled:opacity-60 ${STATUS_CLASS[status]}`}
      >
        <span>{t.status[status]}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`h-[18px] w-[18px] shrink-0 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[220px] rounded-xl border border-line-default bg-card p-1.5 shadow-[0_20px_44px_-18px_rgba(20,40,70,0.4)]"
        >
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              role="option"
              aria-selected={s === status}
              onClick={() => pick(s)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13.5px] font-medium text-body transition-colors hover:bg-sunken"
            >
              <span
                aria-hidden
                className={`h-2 w-2 shrink-0 rounded-full ${STATUS_CLASS[s]}`}
                style={{ backgroundColor: "currentColor" }}
              />
              <span className="flex-1">{t.status[s]}</span>
              {s === status ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-4 w-4 text-brand"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      {error ? (
        <span role="alert" className="sr-only">
          {error}
        </span>
      ) : null}
    </span>
  );
}
