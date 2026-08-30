"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
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
      setError(
        "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
      );
      setLoading(false);
    }
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
                <path d="M17 8a5 5 0 1 0-9.9 1" strokeLinecap="round" />
                <path
                  d="M8 13v7h8v-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path d="M12 16v1" strokeLinecap="round" />
              </svg>
            </div>

            <h1 className="mt-5 text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#17231D]">
              Réinitialiser votre mot de passe
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-[#68736D]">
              Saisissez le code reçu par e-mail et choisissez un nouveau mot de
              passe pour sécuriser votre compte.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mt-6 rounded-xl border border-[#F1C7C7] bg-[#FFF7F7] px-4 py-3.5 text-sm leading-5 text-[#A33A3A]"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            {/* Email */}
            <div>
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
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
                className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] text-[#17231D] outline-none transition-all placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
              />
            </div>

            {/* Verification code */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="code"
                  className="block text-[13px] font-medium text-[#29342E]"
                >
                  Code de vérification
                </label>

                <span className="text-[11px] text-[#8A938D]">6 chiffres</span>
              </div>

              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="Entrez le code reçu par e-mail"
                required
                maxLength={6}
                value={form.code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    code: e.target.value.replace(/\D/g, ""),
                  })
                }
                className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] tracking-[0.18em] text-[#17231D] outline-none transition-all placeholder:tracking-normal placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
              />

              <p className="mt-2 text-[11px] leading-5 text-[#8A938D]">
                Consultez votre boîte de réception et votre dossier courrier
                indésirable.
              </p>
            </div>

            {/* New password */}
            <div>
              <label
                htmlFor="newPassword"
                className="mb-2 block text-[13px] font-medium text-[#29342E]"
              >
                Nouveau mot de passe
              </label>

              <input
                id="newPassword"
                name="newPassword"
                type="password"
                placeholder="Choisissez un nouveau mot de passe"
                autoComplete="new-password"
                required
                minLength={10}
                value={form.newPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    newPassword: e.target.value,
                  })
                }
                className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] text-[#17231D] outline-none transition-all placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
              />

              {/* Password requirements */}
              <div className="mt-3 rounded-xl bg-[#F7F9F7] px-4 py-3.5">
                <p className="text-[11px] font-medium text-[#53615A]">
                  Votre mot de passe doit contenir :
                </p>

                <div className="mt-2 space-y-1.5 text-[11px] text-[#7A847E]">
                  <p className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#8A938D]" />
                    Au moins 10 caractères
                  </p>

                  <p className="flex items-center gap-2">
                    <span className="h-1 w-1 rounded-full bg-[#8A938D]" />
                    Une combinaison difficile à deviner
                  </p>
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-[50px] w-full items-center justify-center rounded-xl bg-[#17231D] px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-[#293B31] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#17231D]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Réinitialisation...
                </span>
              ) : (
                "Réinitialiser le mot de passe"
              )}
            </button>
          </form>

          {/* Security */}
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
                  Réinitialisation sécurisée
                </p>

                <p className="mt-1 text-[12px] leading-5 text-[#7A847E]">
                  Votre code de vérification est nécessaire pour modifier votre
                  mot de passe.
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
