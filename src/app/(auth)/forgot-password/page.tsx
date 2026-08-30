"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      setSent(true);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen bg-[#F5F7F5] px-4 py-12 sm:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[480px] flex-col justify-center">
          {/* Brand */}
          <div className="mb-8 text-center">
            <Link
              href="/"
              className="inline-block text-[27px] font-semibold tracking-[-0.04em] text-[#17231D]"
            >
              fiduvia
            </Link>

            <p className="mt-1.5 text-[13px] text-[#7A847E]">
              Fiduciaire & comptabilité en ligne
            </p>
          </div>

          {/* Success Card */}
          <section className="rounded-[20px] border border-[#E1E6E2] bg-white px-6 py-10 text-center shadow-[0_20px_60px_rgba(23,35,29,0.07)] sm:px-10">
            {/* Success icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EAF1EB] text-[#536B5C]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path
                  d="M5 12.5 9.2 17 19 7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="mt-6 text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] text-[#17231D]">
              Vérifiez votre e-mail
            </h1>

            <p className="mx-auto mt-3 max-w-[360px] text-[14px] leading-6 text-[#68736D]">
              Si un compte existe avec cette adresse, un code de
              réinitialisation a été envoyé.
            </p>

            <div className="mt-8">
              <Link
                href="/login"
                className="inline-flex h-[48px] items-center justify-center rounded-xl bg-[#17231D] px-7 text-[14px] font-medium text-white transition hover:bg-[#293B31] focus:outline-none focus:ring-4 focus:ring-[#17231D]/15"
              >
                Retour à la connexion
              </Link>
            </div>
          </section>

          {/* Footer */}
          <p className="mt-7 text-center text-[11px] leading-5 text-[#8A938D]">
            © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
            en ligne.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F5F7F5] px-4 py-12 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[480px] flex-col justify-center">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-[27px] font-semibold tracking-[-0.04em] text-[#17231D]"
          >
            fiduvia
          </Link>

          <p className="mt-1.5 text-[13px] text-[#7A847E]">
            Fiduciaire & comptabilité en ligne
          </p>
        </div>

        {/* Card */}
        <section className="rounded-[20px] border border-[#E1E6E2] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(23,35,29,0.07)] sm:px-10 sm:py-10">
          {/* Back */}
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-[13px] font-medium text-[#68736D] transition hover:text-[#17231D]"
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
            Retour à la connexion
          </Link>

          {/* Header */}
          <div className="mt-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#EEF3EF] text-[#536B5C]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>

            <h1 className="mt-5 text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#17231D]">
              Mot de passe oublié ?
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-[#68736D]">
              Entrez l'adresse e-mail associée à votre compte. Si elle
              correspond à un compte Fiduvia, nous vous enverrons un code
              permettant de réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-8">
            <label
              htmlFor="email"
              className="mb-2 block text-[13px] font-medium text-[#29342E]"
            >
              Adresse e-mail
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="vous@exemple.ch"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] text-[#17231D] outline-none transition-all placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
            />

            <button
              type="submit"
              disabled={loading}
              className="mt-5 flex h-[50px] w-full items-center justify-center rounded-xl bg-[#17231D] px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-[#293B31] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#17231D]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Envoi en cours...
                </span>
              ) : (
                "Envoyer le code"
              )}
            </button>
          </form>

          {/* Security note */}
          <div className="mt-8 border-t border-[#ECEFEC] pt-6">
            <div className="flex gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F4F1]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-[17px] w-[17px] text-[#536B5C]"
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
                <p className="text-[13px] font-medium text-[#29342E]">
                  Vos informations restent protégées
                </p>

                <p className="mt-1 text-[12px] leading-5 text-[#7A847E]">
                  Pour votre sécurité, nous ne vous indiquons pas si une adresse
                  e-mail possède un compte Fiduvia.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-7 text-center text-[11px] leading-5 text-[#8A938D]">
          © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
          en ligne.
        </p>
      </div>
    </main>
  );
}
