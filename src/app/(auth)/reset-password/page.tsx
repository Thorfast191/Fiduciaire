"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, FormAlert } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/I18nProvider";

export default function ResetPasswordPage() {
  const t = useT();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    code: "",
    newPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const body = await res.json();

      if (!body.ok) {
        setError(body.error);
        setLoading(false);
        return;
      }

      router.push("/login");
    } catch {
      setError(t.common.genericError);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-surface px-4 py-12 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[480px] flex-col justify-center">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-[27px] font-semibold tracking-[-0.04em] text-strong"
          >
            {t.auth.brand}
          </Link>

          <p className="mt-1.5 text-[13px] text-muted">{t.auth.tagline}</p>
        </div>

        {/* Card */}
        <section className="rounded-[20px] border border-line bg-card px-6 py-8 shadow-md sm:px-10 sm:py-10">
          {/* Back */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-muted transition hover:text-strong"
          >
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M12.5 4.5 7 10l5.5 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.auth.reset.backToLogin}
          </Link>

          {/* Header */}
          <div className="mt-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-brand">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <path d="M17 8a5 5 0 1 0-9.9 1" strokeLinecap="round" />
                <path
                  d="M8 13v7h8v-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 16v1" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className="mt-5 text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] text-strong">
              {t.auth.reset.title}
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-muted">
              {t.auth.reset.sub}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6">
              <FormAlert variant="error">{error}</FormAlert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <Field
              id="email"
              label={t.auth.fields.email}
              type="email"
              placeholder={t.auth.fields.emailPlaceholder}
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            {/* Verification code */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="code"
                  className="block text-[13px] font-medium text-strong"
                >
                  {t.auth.fields.code}
                </label>

                <span className="text-[11px] text-subtle">
                  {t.auth.fields.codeShort}
                </span>
              </div>

              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder={t.auth.fields.codePlaceholder}
                required
                maxLength={6}
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="h-[50px] w-full rounded-xl border border-line-default bg-card px-4 text-[15px] tracking-[0.18em] text-strong outline-none transition-all placeholder:tracking-normal placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
              />

              <p className="mt-2 text-[11px] leading-5 text-subtle">
                {t.auth.reset.codeHint}
              </p>
            </div>

            {/* New password */}
            <div>
              <Field
                id="newPassword"
                label={t.auth.fields.newPassword}
                type="password"
                placeholder={t.auth.fields.resetPasswordPlaceholder}
                autoComplete="new-password"
                required
                minLength={10}
                value={form.newPassword}
                onChange={(e) =>
                  setForm({ ...form, newPassword: e.target.value })
                }
              />

              {/* Password requirements */}
              <div className="mt-3 rounded-xl bg-sunken px-4 py-3.5">
                <p className="text-[11px] font-medium text-brand">
                  {t.auth.reset.passwordTitle}
                </p>

                <div className="mt-2 space-y-1.5 text-[11px] text-muted">
                  <p className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-subtle" />
                    {t.auth.reset.rule1}
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-subtle" />
                    {t.auth.reset.rule2}
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[50px] w-full items-center justify-center rounded-xl bg-brand px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {t.auth.reset.loading}
                </span>
              ) : (
                t.auth.reset.submit
              )}
            </button>
          </form>

          {/* Security */}
          <div className="mt-8 border-t border-line pt-6">
            <div className="flex gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-[17px] w-[17px] text-brand"
                  aria-hidden="true"
                >
                  <path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z" />
                  <path
                    d="m9 12 2 2 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-medium text-strong">
                  {t.auth.reset.secureTitle}
                </p>

                <p className="mt-1 text-[12px] leading-5 text-muted">
                  {t.auth.reset.secureBody}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-7 text-center text-[11px] leading-5 text-subtle">
          © {new Date().getFullYear()} Fiduvia · {t.auth.rights}
        </p>
      </div>
    </main>
  );
}
