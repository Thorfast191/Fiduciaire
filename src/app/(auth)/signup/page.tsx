"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, FormAlert } from "@/components/ui/Field";
import { useT } from "@/lib/i18n/I18nProvider";

/**
 * "Créez votre espace Fiduvia" — the mockup's account-creation screen
 * (`Fiduvia.dc.html`): a minimal logo header, then two columns — the pitch and
 * its three perks on the left, the form on the right (name, email, phone,
 * password ×2, terms). Reached from "Créer mon dossier" and "Remplir ma
 * déclaration".
 */
export default function SignupPage() {
  const t = useT();
  const s = t.auth.signup;
  const router = useRouter();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError(s.passwordMismatch);
      return;
    }
    if (!acceptTerms) {
      setError(s.termsRequired);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || undefined,
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

  const legalLink = "font-semibold hover:underline";

  return (
    <main className="min-h-screen bg-[var(--surface-page)]">
      {/* Logo header */}
      <header className="border-b border-[var(--border-subtle)]">
        <div
          className="mx-auto flex items-center px-6 py-[15px] sm:px-8 lg:px-[56px]"
          style={{ maxWidth: "1380px" }}
        >
          <Link href="/" className="flex items-center gap-[11px] no-underline">
            <span className="flex items-center gap-[16px] leading-none">
              <span className="h-[34px] w-[3px] shrink-0 rounded-[1px] bg-[var(--gold)]" />
              <span
                className="whitespace-nowrap text-[30px] font-medium tracking-[0.1em] text-[var(--text-strong)]"
                style={{ fontFamily: "var(--font-mark)" }}
              >
                F<span className="text-[0.76em] tracking-[0.13em]">IDUVIA</span>
              </span>
            </span>
          </Link>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto grid max-w-[1080px] grid-cols-1 items-start gap-[48px] px-6 py-[52px] lg:grid-cols-2 lg:gap-[64px] lg:py-[76px]">
        {/* Left — pitch */}
        <div className="max-w-[440px]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium"
            style={{ color: "var(--text-muted)" }}
          >
            ← {s.backHome}
          </Link>

          <p className="fx-eyebrow mt-6 text-[var(--text-muted)]">{s.eyebrow}</p>

          <h1 className="disp mt-3 text-[clamp(30px,3.4vw,42px)] font-extrabold leading-[1.06] text-[var(--text-strong)]">
            {s.title}
          </h1>

          <p className="mt-4 text-[15px] leading-[1.6] text-[var(--text-muted)]">
            {s.sub}
          </p>

          <ul className="mt-7 flex flex-col gap-3">
            {s.perks.map((perk) => (
              <li
                key={perk}
                className="flex items-start gap-3 text-[14.5px] text-[var(--text-body)]"
              >
                <span
                  aria-hidden
                  className="mt-[1px] font-bold"
                  style={{ color: "var(--brand)" }}
                >
                  ✓
                </span>
                <span>{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right — form */}
        <div className="rounded-[20px] border border-[var(--border-subtle)] bg-white p-6 shadow-[var(--shadow-md)] sm:p-8">
          {error ? (
            <div className="mb-5">
              <FormAlert variant="error">{error}</FormAlert>
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="flex flex-col gap-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="firstName"
                label={t.auth.fields.firstName}
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              />
              <Field
                id="lastName"
                label={t.auth.fields.lastName}
                autoComplete="family-name"
                required
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              />
            </div>

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

            <Field
              id="phone"
              label={t.auth.fields.phone}
              type="tel"
              placeholder={t.auth.fields.phonePlaceholder}
              autoComplete="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field
                id="password"
                label={t.auth.fields.password}
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <Field
                id="confirmPassword"
                label={t.auth.fields.confirmPassword}
                type="password"
                autoComplete="new-password"
                required
                minLength={10}
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({ ...form, confirmPassword: e.target.value })
                }
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                id="acceptTerms"
                type="checkbox"
                required
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-[18px] w-[18px] shrink-0 cursor-pointer rounded-[6px] border border-line-strong accent-brand"
              />
              <label
                htmlFor="acceptTerms"
                className="cursor-pointer text-[12.5px] leading-5 text-[var(--text-muted)]"
              >
                {s.termsIntro}
                <Link
                  href="/confidentialite"
                  className={legalLink}
                  style={{ color: "var(--brand)" }}
                >
                  {s.termsPrivacy}
                </Link>
                {s.termsSep}
                <Link
                  href="/mentions-legales"
                  className={legalLink}
                  style={{ color: "var(--brand)" }}
                >
                  {s.termsMentions}
                </Link>
                {s.termsSep}
                <Link
                  href="/cgvu"
                  className={legalLink}
                  style={{ color: "var(--brand)" }}
                >
                  {s.termsData}
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex h-[50px] w-full items-center justify-center rounded-xl bg-brand px-4 text-[14px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? s.loading : s.submit}
            </button>
          </form>

          <p className="mt-4 text-center text-[12px] leading-5 text-[var(--text-subtle)]">
            {s.legal}
          </p>

          <div className="mt-5 border-t border-[var(--border-subtle)] pt-5 text-center text-[13px] text-[var(--text-muted)]">
            {s.hasAccount}{" "}
            <Link
              href="/login"
              className="font-semibold hover:underline"
              style={{ color: "var(--brand)" }}
            >
              {s.login}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
