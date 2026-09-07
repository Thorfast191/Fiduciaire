"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";

/**
 * The login card's body, shared by the modal on the marketing site and the
 * standalone `/login` route so the two can never drift apart. The mockup only
 * has the modal; `/login` still exists for deep links, for the redirect the
 * middleware issues on a protected route, and for anyone without JavaScript.
 */
export function LoginForm({
  t,
  onFieldRef,
}: {
  t: Messages;
  /** Lets the modal focus the first field when it opens. */
  onFieldRef?: (el: HTMLInputElement | null) => void;
}) {
  const router = useRouter();

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
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

      router.push(
        `/verify?email=${encodeURIComponent(form.email)}&purpose=login`,
      );
    } catch {
      setError(t.common.genericError);
      setLoading(false);
    }
  }

  return (
    <>
      {/* `globals.css` resets h2/p margins unlayered, which outranks Tailwind's
          layered `mt-*` utilities — so these two spacings are set inline. */}
      <h2
        id="login-title"
        className="disp text-[24px] font-extrabold"
        style={{ marginTop: "18px" }}
      >
        {t.auth.login.title}
      </h2>

      <p
        className="text-[14.5px] leading-[1.55] text-[var(--text-muted)]"
        style={{ marginTop: "7px" }}
      >
        {t.auth.login.sub}
      </p>

      <form onSubmit={onSubmit} className="mt-[18px] flex flex-col gap-[14px]">
        <div>
          <label htmlFor="login-email" className="fx-field-label">
            {t.auth.fields.email}
          </label>

          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            ref={onFieldRef}
            placeholder={t.auth.login.emailPlaceholder}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="fx-field-input"
          />
        </div>

        <div>
          <label htmlFor="login-password" className="fx-field-label">
            {t.auth.fields.password}
          </label>

          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            placeholder={t.auth.login.passwordPlaceholder}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="fx-field-input"
          />

          <div className="mt-[7px] text-right">
            <Link
              href="/forgot-password"
              className="text-[13px] text-[var(--text-muted)] hover:text-[var(--brand)]"
            >
              {t.auth.login.forgot}
            </Link>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-[10px] border border-[#ECC9C9] bg-[#FBE7E4] px-3 py-[10px] text-[13.5px] text-[#A2443A]"
          >
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="fx-btn-submit disabled:cursor-not-allowed"
        >
          {loading ? t.auth.login.loading : t.auth.login.submit}
        </button>
      </form>

      <div className="mt-[18px] text-center text-[14px] text-[var(--text-muted)]">
        {t.auth.login.noAccount}{" "}
        <Link
          href="/signup"
          className="font-semibold text-[var(--brand)]"
        >
          {t.auth.login.createAccount}
        </Link>
      </div>
    </>
  );
}
