"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/I18nProvider";
import { DOCUMENT_CATALOGUE } from "@/lib/declaration";

/**
 * The reference's "Demander des pièces" modal.
 *
 * An administrator ticks the pieces they need from the questionnaire's
 * catalogue, optionally types one that is not in it, adds a comment and sends.
 * The client gets an e-mail and the request in their space.
 *
 * The request travels as the notification's free-text `message`: the selected
 * titles as a list, then the comment. That is what the client's portal already
 * renders, so no schema change was needed to make the picker real — but it
 * does mean the selection is not queryable afterwards, only readable.
 */

/** The catalogue up to "Dette hypothécaire", which is where the reference's
 *  grid ends: the three that follow are the firm's own paperwork, not pieces
 *  it would ask a client for. */
const REQUESTABLE = Object.entries(DOCUMENT_CATALOGUE)
  .map(([key, meta]) => ({ key, title: meta.title }))
  .slice(
    0,
    Object.keys(DOCUMENT_CATALOGUE).indexOf("detteHypothecaire") + 1,
  );

const MailIcon = ({ size = 22 }: { size?: number }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    style={{ width: size, height: size }}
  >
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M22 6l-10 7L2 6" />
  </svg>
);

export default function NotifyClient({
  dossierId,
  clientName,
  disabled = false,
}: {
  dossierId: string;
  clientName: string;
  /** A closed dossier cannot be chased for more pieces. */
  disabled?: boolean;
}) {
  const t = useT();
  const n = t.admin.notify;

  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [extras, setExtras] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [comment, setComment] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(key: string) {
    setPicked((keys) =>
      keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key],
    );
  }

  function addExtra() {
    const value = draft.trim();
    if (!value || extras.includes(value)) return;
    setExtras((rows) => [...rows, value]);
    setDraft("");
  }

  function reset() {
    setPicked([]);
    setExtras([]);
    setDraft("");
    setComment("");
    setError(null);
  }

  async function send() {
    const titles = [
      ...REQUESTABLE.filter((d) => picked.includes(d.key)).map((d) => d.title),
      ...extras,
    ];
    if (titles.length === 0) {
      setError(n.errNoneSelected);
      return;
    }

    setSending(true);
    setError(null);
    try {
      const message = [
        titles.map((title) => `• ${title}`).join("\n"),
        comment.trim(),
      ]
        .filter(Boolean)
        .join("\n\n");

      const res = await fetch(`/api/dossiers/${dossierId}/notifications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind: "documents_requested", message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? t.common.genericError);
        return;
      }

      setSent(true);
      setOpen(false);
      reset();
    } catch {
      setError(t.common.genericError);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-[10px] bg-brand px-[15px] py-[9px] text-[14px] font-semibold text-white transition hover:bg-brand-hover disabled:cursor-not-allowed disabled:bg-[#EDF1F6] disabled:text-[#AEB7C4]"
      >
        <MailIcon />
        {n.button}
      </button>

      {sent && !open ? (
        <span className="whitespace-nowrap self-center text-[12px] font-medium text-green-600">
          ✓ {n.sent}
        </span>
      ) : null}

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,21,38,0.5)] p-4"
          role="dialog"
          aria-modal="true"
          aria-label={n.title}
        >
          <div className="max-h-[88vh] w-full max-w-[540px] overflow-auto rounded-[20px] bg-card p-[30px] shadow-[0_40px_90px_-30px_rgba(13,21,38,0.6)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-[13px] bg-teal-100 text-brand">
                  <MailIcon />
                </span>
                <div>
                  <h2 className="text-[21px] font-bold text-strong">
                    {n.title}
                  </h2>
                  <p className="mt-[3px] max-w-[40ch] text-[13px] text-muted">
                    {n.sub}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={n.cancel}
                className="p-1 text-[22px] leading-none text-subtle transition hover:text-strong"
              >
                ×
              </button>
            </div>

            <div className="mb-2.5 mt-[22px] text-[12px] font-bold uppercase tracking-[0.06em] text-subtle">
              {n.presetTitle}
            </div>

            <div className="grid grid-cols-1 gap-[7px] sm:grid-cols-2">
              {REQUESTABLE.map((doc) => {
                const on = picked.includes(doc.key);
                return (
                  <button
                    key={doc.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggle(doc.key)}
                    className={`flex w-full items-center gap-2.5 rounded-[10px] border px-[11px] py-[9px] text-left text-[14px] transition ${
                      on
                        ? "border-brand bg-teal-100/60 text-strong"
                        : "border-line bg-card text-strong hover:bg-sunken"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border-[1.5px] text-white ${
                        on
                          ? "border-brand bg-brand"
                          : "border-[#CBD3DE] bg-card"
                      }`}
                    >
                      {on ? (
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-3 w-3"
                        >
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      ) : null}
                    </span>
                    {doc.title}
                  </button>
                );
              })}
            </div>

            <div className="mb-2.5 mt-5 text-[12px] font-bold uppercase tracking-[0.06em] text-subtle">
              {n.addTitle}
            </div>

            <div className="flex gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExtra();
                  }
                }}
                placeholder={n.addPlaceholder}
                aria-label={n.addTitle}
                className="flex-1 rounded-[11px] border-[1.5px] border-line-default bg-card px-3.5 py-[11px] text-[14.5px] text-strong outline-none transition placeholder:text-subtle focus:border-brand"
              />
              <button
                type="button"
                onClick={addExtra}
                className="rounded-[11px] bg-teal-100 px-[18px] text-[14px] font-semibold text-[#145863] transition hover:brightness-95"
              >
                {n.add}
              </button>
            </div>

            {extras.length > 0 ? (
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {extras.map((title) => (
                  <li key={title}>
                    <button
                      type="button"
                      onClick={() =>
                        setExtras((rows) => rows.filter((r) => r !== title))
                      }
                      className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3 py-1 text-[13px] font-semibold text-[#145863] transition hover:brightness-95"
                    >
                      {title}
                      <span aria-hidden>×</span>
                      <span className="sr-only">{n.removeExtra}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mb-2.5 mt-5 text-[12px] font-bold uppercase tracking-[0.06em] text-subtle">
              {n.messageLabel}
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={n.messagePlaceholder}
              aria-label={n.messageLabel}
              rows={3}
              className="w-full resize-y rounded-[12px] border-[1.5px] border-line-default bg-card px-[15px] py-3 text-[14.5px] text-strong outline-none transition placeholder:text-subtle focus:border-brand"
            />

            {error ? (
              <p role="alert" className="mt-2 text-[13px] text-red-600">
                {error}
              </p>
            ) : null}

            <p className="sr-only">{clientName}</p>

            <div className="mt-[22px] flex gap-3">
              <button
                type="button"
                disabled={sending}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-[11px] border border-line-default bg-card p-[13px] text-[15px] font-semibold text-body transition hover:bg-sunken disabled:opacity-60"
              >
                {n.cancel}
              </button>
              <button
                type="button"
                disabled={sending}
                onClick={send}
                className="inline-flex flex-[1.5] items-center justify-center gap-2.5 rounded-[11px] bg-brand p-[13px] text-[15px] font-semibold text-white transition hover:bg-brand-hover disabled:opacity-60"
              >
                <MailIcon />
                {sending ? n.sending : n.send}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
