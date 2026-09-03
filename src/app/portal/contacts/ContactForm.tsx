"use client";

import { useState } from "react";
import { Field, FormAlert } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/I18nProvider";

export default function ContactForm({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  const t = useT();

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setError(t.portal.contactsErrEmpty);
      return;
    }

    setSending(true);
    setError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? t.common.genericError);
        return;
      }

      setSent(true);
      setSubject("");
      setMessage("");
    } catch {
      setError(t.common.genericError);
    } finally {
      setSending(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="min-w-[300px] flex-[1.6] rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-md)]"
    >
      <h2 className="disp text-[20px] font-bold">
        {t.portal.contactsFormTitle}
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {/* Identity comes from the session; shown read-only so the sender is
            unambiguous and cannot be edited into someone else. */}
        <Field
          id="contactName"
          label={t.auth.fields.lastName}
          value={name}
          disabled
        />
        <Field
          id="contactEmail"
          label={t.auth.fields.email}
          value={email}
          disabled
        />
      </div>

      <div className="mt-4">
        <Field
          id="contactSubject"
          label={t.portal.contactsSubject}
          placeholder={t.portal.contactsSubjectPh}
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
      </div>

      <div className="mt-4">
        <label
          htmlFor="contactMessage"
          className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-muted"
        >
          {t.portal.contactsMessage}
        </label>

        <textarea
          id="contactMessage"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t.portal.contactsMessagePh}
          rows={5}
          className="w-full resize-y rounded-xl border border-line-default bg-card px-4 py-3 text-[15px] text-strong outline-none transition-colors placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
        />
      </div>

      {error ? (
        <div className="mt-4">
          <FormAlert variant="error">{error}</FormAlert>
        </div>
      ) : null}

      {sent ? (
        <div className="mt-4">
          <FormAlert variant="success">{t.portal.contactsSent}</FormAlert>
        </div>
      ) : null}

      <p className="mt-4 text-[12px] leading-[1.5] text-muted">
        {t.portal.contactsNote}
      </p>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-xl bg-brand px-[22px] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending ? t.portal.contactsSending : `${t.portal.contactsSend} →`}
        </button>
      </div>
    </form>
  );
}
