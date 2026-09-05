"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, FormAlert } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/I18nProvider";

export default function SignupPage() {
  const t = useT();
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    // Checked here so the mismatch is caught before a round trip; the server
    // never sees the confirmation field, and enforces acceptTerms itself.
    if (form.password !== form.confirmPassword) {
      setError(t.auth.signup.passwordMismatch);
      return;
    }
    if (!acceptTerms) {
      setError(t.auth.signup.termsRequired);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          acceptTerms,
        }),
      });

      const body = await res.json();

      if (!body.ok) {
        setError(body.error);
        setLoading(false);
        return;
      }

      router.push(
        `/verify?email=${encodeURIComponent(form.email)}&purpose=signup`,
      );
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
          {/* Header */}
          <div>
            <p className="fx-eyebrow">{t.auth.signup.eyebrow}</p>

            <h1 className="mt-3 text-[29px] font-semibold leading-[1.15] tracking-[-0.04em] text-strong">
              {t.auth.signup.title}
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-muted">
              {t.auth.signup.sub}
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
            {/* Name */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="firstName"
                label={t.auth.fields.firstName}
                type="text"
                placeholder={t.auth.fields.firstNamePlaceholder}
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />

              <Field
                id="lastName"
                label={t.auth.fields.lastName}
                type="text"
                placeholder={t.auth.fields.lastNamePlaceholder}
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>

            {/* Email */}
            <div>
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

              <p className="mt-2 text-[11px] leading-5 text-subtle">
                {t.auth.signup.emailHint}
              </p>
            </div>

            {/* Password */}
            <div>
              <Field
                id="password"
                label={t.auth.fields.password}
                type="password"
                placeholder={t.auth.fields.newPasswordPlaceholder}
                autoComplete="new-password"
                required
                minLength={10}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <div className="mt-3 rounded-xl bg-sunken px-4 py-3.5">
                <p className="text-[11px] font-medium text-brand">
                  {t.auth.signup.passwordTitle}
                </p>

                <p className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                  <span className="h-1 w-1 rounded-full bg-subtle" />
                  {t.auth.signup.passwordRule}
                </p>
              </div>
            </div>

            {/* Confirm password */}
            <Field
              id="confirmPassword"
              label={t.auth.fields.confirmPassword}
              type="password"
              placeholder={t.auth.fields.confirmPasswordPlaceholder}
              autoComplete="new-password"
              required
              minLength={10}
              value={form.confirmPassword}
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />

            {/* Terms acceptance */}
            <div className="flex items-start gap-3">
              <input
                id="acceptTerms"
                name="acceptTerms"
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[6px] border border-line-strong accent-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
              />

              <label
                htmlFor="acceptTerms"
                className="cursor-pointer text-[12px] leading-5 text-muted"
              >
                {t.auth.signup.termsLabel}
              </label>
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
                  {t.auth.signup.loading}
                </span>
              ) : (
                <>
                  {t.auth.signup.submit}
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="ml-2 h-4 w-4"
                    aria-hidden="true"
                  >
                    <path
                      d="M4 10h11M11 6l4 4-4 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Existing account */}
          <div className="mt-7 border-t border-line pt-6 text-center">
            <p className="text-[13px] text-muted">{t.auth.signup.hasAccount}</p>

            <Link
              href="/login"
              className="mt-2 inline-block text-[13px] font-medium text-brand transition hover:text-strong hover:underline"
            >
              {t.auth.signup.login}
            </Link>
          </div>

          {/* Security */}
          <div className="mt-6 border-t border-line pt-6">
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
                  {t.auth.signup.secureTitle}
                </p>

                <p className="mt-1 text-[12px] leading-5 text-muted">
                  {t.auth.signup.secureBody}
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
