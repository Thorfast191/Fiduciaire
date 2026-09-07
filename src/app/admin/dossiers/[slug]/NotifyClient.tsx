"use client";

import { useState } from "react";
import { useT } from "@/lib/i18n/I18nProvider";
import type { NotificationKind } from "@/db/schema";

/**
 * The mockup's "Demander des pièces" control, expanded to cover both
 * notification kinds the brief names: requesting supporting documents, and
 * flagging that action is required.
 */
export default function NotifyClient({
  dossierId,
  clientName,
}: {
  dossierId: string;
  clientName: string;
}) {
  const t = useT();

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<NotificationKind>("documents_requested");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    setSending(true);
    setError(null);

    try {
      const res = await fetch(`/api/dossiers/${dossierId}/notifications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, message: message.trim() || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? t.common.genericError);
        return;
      }

      setSent(true);
      setMessage("");
      setOpen(false);
    } catch {
      setError(t.common.genericError);
    } finally {
      setSending(false);
    }
  }

  if (sent && !open) {
    return (
      <span className="whitespace-nowrap text-[12px] font-medium text-green-600">
        ✓ {t.admin.notify.sent}
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="whitespace-nowrap rounded-lg border border-line-default px-3 py-1.5 text-[12.5px] font-medium text-brand transition-colors hover:border-line-strong hover:bg-sunken"
      >
        {t.admin.notify.button}
      </button>
    );
  }

  return (
    <div className="w-full rounded-xl border border-line bg-sunken/40 p-4">
      <p className="text-[13px] font-semibold text-strong">
        {t.admin.notify.title} · {clientName}
      </p>

      <p className="mt-1 text-[12px] text-muted">{t.admin.notify.sub}</p>

      <div className="mt-3 flex flex-col gap-2">
        {(
          [
            ["documents_requested", t.admin.notify.kindDocuments],
            ["action_required", t.admin.notify.kindAction],
          ] as [NotificationKind, string][]
        ).map(([value, label]) => (
          <label
            key={value}
            className="flex cursor-pointer items-center gap-2.5 text-[13.5px] text-body"
          >
            <input
              type="radio"
              name={`kind-${dossierId}`}
              value={value}
              checked={kind === value}
              onChange={() => setKind(value)}
              className="h-4 w-4 accent-[var(--brand)]"
            />
            {label}
          </label>
        ))}
      </div>

      <label
        htmlFor={`msg-${dossierId}`}
        className="mt-3 block text-[11px] font-semibold uppercase tracking-[0.12em] text-muted"
      >
        {t.admin.notify.messageLabel}
      </label>

      <textarea
        id={`msg-${dossierId}`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t.admin.notify.messagePlaceholder}
        rows={3}
        className="mt-1.5 w-full resize-y rounded-xl border border-line-default bg-card px-3 py-2 text-[14px] text-strong outline-none transition-colors placeholder:text-subtle focus:border-brand focus:ring-4 focus:ring-brand/10"
      />

      {error ? (
        <p role="alert" className="mt-2 text-[12.5px] text-red-600">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="rounded-xl bg-brand px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? t.admin.notify.sending : t.admin.notify.send}
        </button>

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-xl border border-line-default px-4 py-2 text-[13.5px] font-medium text-body transition-colors hover:bg-sunken"
        >
          {t.admin.notify.cancel}
        </button>
      </div>
    </div>
  );
}
