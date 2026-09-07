"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";

export interface ProfileFields {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  initials: string;
}

/**
 * "Mon profil" (`Fiduvia.dc.html:3930`). Same dialog for a client and an
 * administrator — the fields are the account's own, not the role's.
 *
 * Email is shown but not editable: it is the login identity and the address
 * every verification code goes to, so moving it needs a re-verification round
 * trip rather than a save button.
 */
export function ProfileModal({
  t,
  fields,
  onClose,
}: {
  t: Messages;
  fields: ProfileFields;
  onClose: () => void;
}) {
  const router = useRouter();
  const firstRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    firstName: fields.firstName,
    lastName: fields.lastName,
    phone: fields.phone,
    password: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);

    try {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = await res.json();

      if (!body.ok) {
        setError(body.error ?? t.common.genericError);
        setSaving(false);
        return;
      }

      // The name shows in the sidebar and the portal greeting, both rendered
      // on the server, so the tree has to be refetched for the change to show.
      router.refresh();
      onClose();
    } catch {
      setError(t.common.genericError);
      setSaving(false);
    }
  }

  const p = t.portal.profile;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[95] flex animate-[fadeBg_.18s_ease] items-start justify-center overflow-y-auto bg-[rgba(13,21,38,.55)] p-6 backdrop-blur-[3px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-title"
        className="my-auto w-full max-w-[520px] animate-[popIn_.22s_ease] rounded-[var(--radius-xl)] bg-card px-8 py-[30px] shadow-[0_40px_90px_-30px_rgba(11,32,48,.6)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span
              className="flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-teal-100 text-[17px] font-bold text-brand"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {fields.initials}
            </span>

            <div>
              <h2 id="profile-title" className="disp m-0 text-[22px] font-extrabold">
                {p.title}
              </h2>
              <p className="m-0 mt-0.5 text-[13.5px] text-muted">{p.sub}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={t.common.close}
            className="fx-modal-close"
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-[14px]">
          <div className="flex flex-wrap gap-[14px]">
            <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
              <span className="fx-field-label m-0">{p.firstName}</span>
              <input
                ref={firstRef}
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="fx-field-input"
              />
            </label>

            <label className="flex min-w-[180px] flex-1 flex-col gap-[7px]">
              <span className="fx-field-label m-0">{p.lastName}</span>
              <input
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="fx-field-input"
              />
            </label>
          </div>

          <label className="flex flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.email}</span>
            <input
              value={fields.email}
              readOnly
              disabled
              className="fx-field-input cursor-not-allowed opacity-70"
            />
            <span className="text-[12px] leading-[1.45] text-muted">
              {p.emailLocked}
            </span>
          </label>

          <label className="flex flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.phone}</span>
            <input
              type="tel"
              placeholder="+41 79 000 00 00"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="fx-field-input"
            />
          </label>

          <label className="flex flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.newPassword}</span>
            <input
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="fx-field-input"
            />
            <span className="text-[12px] leading-[1.45] text-muted">
              {p.passwordHint}
            </span>
          </label>

          {error ? (
            <div
              role="alert"
              className="rounded-[10px] border border-[#ECC9C9] bg-[#FBE7E4] px-3 py-[10px] text-[13.5px] text-[#A2443A]"
            >
              {error}
            </div>
          ) : null}

          <div className="mt-1 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[var(--radius-md)] border border-line-default px-5 py-3 text-[15px] font-semibold text-body transition-colors hover:border-teal-300"
            >
              {p.cancel}
            </button>

            <button type="submit" disabled={saving} className="fx-btn-send">
              {saving ? p.saving : p.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
