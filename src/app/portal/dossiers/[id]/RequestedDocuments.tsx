"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";
import { MAX_UPLOAD_BYTES } from "@/lib/documentCategories";

export interface RequestedItem {
  /** Document category to file the upload under. */
  category: string;
  /** What to call it on screen. */
  title: string;
  /** The document already deposited for this request, if any. */
  doc: { id: string; filename: string } | null;
  /** True for a piece the administrator typed rather than picked. */
  freeText: boolean;
}

/**
 * "Demande de pièce" — the pieces the firm asked for, each with its own slot.
 *
 * The request used to arrive only as a paragraph in an e-mail and a banner:
 * the client had to read it, work out which of the generic upload categories
 * each line meant, and hope. Now every requested piece is a row that takes a
 * file and files it under the right category by itself.
 *
 * Pieces the administrator typed freehand have no category of their own, so
 * they land under "Divers documents" — the row still names what was asked for.
 */
export default function RequestedDocuments({
  dossierId,
  items,
}: {
  dossierId: string;
  items: RequestedItem[];
}) {
  const t = useT();
  const r = t.portal.requested;

  if (items.length === 0) return null;

  const outstanding = items.filter((i) => !i.doc).length;

  return (
    <section className="mt-6 rounded-[var(--radius-md)] border border-[#B26A00]/30 bg-[#FBF0DD] p-[18px]">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="disp text-[16px] font-bold text-strong">{r.title}</h2>
        <span className="text-[12.5px] font-semibold text-[#B26A00]">
          {outstanding === 0
            ? r.allDone
            : r.remaining.replace("{count}", String(outstanding))}
        </span>
      </div>

      <p className="mt-1 text-[13.5px] leading-[1.5] text-body">{r.sub}</p>

      <div className="mt-3.5 flex flex-col gap-2.5">
        {items.map((item) => (
          <RequestedRow
            key={`${item.category}-${item.title}`}
            dossierId={dossierId}
            item={item}
          />
        ))}
      </div>
    </section>
  );
}

function RequestedRow({
  dossierId,
  item,
}: {
  dossierId: string;
  item: RequestedItem;
}) {
  const t = useT();
  const r = t.portal.requested;
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function pick(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(t.documents.errTooLarge);
      return;
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("dossierId", dossierId);
      form.append("category", item.category);
      form.append("file", file);
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? t.documents.errUpload);
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
    <div className="rounded-[12px] border border-line bg-card px-3.5 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-teal-100 text-brand">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className="h-[18px] w-[18px]"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <path d="M14 2v6h6" />
          </svg>
        </span>

        <span className="min-w-[140px] flex-1">
          <span className="block text-[14px] font-semibold text-strong">
            {item.title}
          </span>
          {item.doc ? (
            <span className="mt-0.5 block truncate text-[12.5px] text-muted">
              {item.doc.filename}
            </span>
          ) : (
            <span className="mt-0.5 block text-[12.5px] text-[#B26A00]">
              {r.awaiting}
            </span>
          )}
        </span>

        {item.doc ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E6F6EE] px-2.5 py-1 text-[11.5px] font-bold text-[#1F8A5B]">
            ✓ {r.received}
          </span>
        ) : null}

        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          className="shrink-0 rounded-[9px] bg-brand px-3.5 py-2 text-[13px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? r.sending : item.doc ? r.replace : r.send}
        </button>

        <input
          ref={input}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
