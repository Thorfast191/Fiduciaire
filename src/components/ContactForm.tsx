"use client";

import { useState } from "react";
import type { Messages } from "@/lib/i18n/messages/fr";

const EMPTY = {
  lastName: "",
  firstName: "",
  email: "",
  phone: "",
  message: "",
};

/**
 * The marketing site's contact form (`Fiduvia.dc.html:421`). The mockup's
 * version sends nothing; this one posts to `/api/contact/public`, which mails a
 * fixed address and is capped per IP.
 */
export function ContactForm({ t }: { t: Messages }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  function field(name: keyof typeof EMPTY) {
    return {
      id: `contact-${name}`,
      value: form[name],
      onChange: (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      ) => setForm({ ...form, [name]: e.target.value }),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/contact/public", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });

      const body = await res.json();

      if (!body.ok) {
        setError(body.error);
        setLoading(false);
        return;
      }

      setForm(EMPTY);
      setSent(true);
      setLoading(false);
    } catch {
      setError(t.common.genericError);
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-w-[320px] flex-[1.35] flex-col gap-[16px] max-[700px]:min-w-0"
    >
      <div className="flex flex-wrap gap-[16px]">
        <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
          <span className="fx-field-label m-0">{t.contact.lastName}</span>
          <input {...field("lastName")} required className="fx-field-input" />
        </label>

        <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
          <span className="fx-field-label m-0">{t.contact.firstName}</span>
          <input {...field("firstName")} required className="fx-field-input" />
        </label>
      </div>

      <div className="flex flex-wrap gap-[16px]">
        <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
          <span className="fx-field-label m-0">{t.contact.email}</span>
          <input
            {...field("email")}
            type="email"
            required
            autoComplete="email"
            className="fx-field-input"
          />
        </label>

        <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
          <span className="fx-field-label m-0">{t.contact.phone}</span>
          <input
            {...field("phone")}
            type="tel"
            autoComplete="tel"
            className="fx-field-input"
          />
        </label>
      </div>

      <label className="flex flex-col gap-[7px]">
        <span className="fx-field-label m-0">{t.contact.message}</span>
        <textarea
          {...field("message")}
          required
          rows={5}
          className="fx-field-input resize-y leading-[1.6]"
        />
      </label>

      {error ? (
        <div
          role="alert"
          className="rounded-[10px] border border-[#ECC9C9] bg-[#FBE7E4] px-3 py-[10px] text-[13.5px] text-[#A2443A]"
        >
          {error}
        </div>
      ) : null}

      {sent ? (
        <div
          role="status"
          className="rounded-[10px] border border-[var(--brand)]/25 bg-[var(--teal-100)] px-3 py-[10px] text-[13.5px] text-[var(--brand)]"
        >
          {t.contact.sent}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-[14px]">
        <span className="max-w-[44ch] text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
          {t.contact.note}
        </span>

        <button type="submit" disabled={loading} className="fx-btn-send">
          {loading ? t.contact.sending : t.contact.send}
        </button>
      </div>
    </form>
  );
}
