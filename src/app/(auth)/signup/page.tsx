"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
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

      router.push(
        `/verify?email=${encodeURIComponent(form.email)}&purpose=signup`,
      );
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
          {/* Header */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#65796C]">
              Bienvenue chez Fiduvia
            </p>

            <h1 className="mt-3 text-[29px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#17231D]">
              Créer mon compte
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-[#68736D]">
              Créez votre espace personnel pour gérer vos documents, démarches
              et échanges avec Fiduvia.
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
            {/* Name */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {/* First name */}
              <div>
                <label
                  htmlFor="firstName"
                  className="mb-2 block text-[13px] font-medium text-[#29342E]"
                >
                  Prénom
                </label>

                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="Votre prénom"
                  autoComplete="given-name"
                  required
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      firstName: e.target.value,
                    })
                  }
                  className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] text-[#17231D] outline-none transition-all placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
                />
              </div>

              {/* Last name */}
              <div>
                <label
                  htmlFor="lastName"
                  className="mb-2 block text-[13px] font-medium text-[#29342E]"
                >
                  Nom
                </label>

                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Votre nom"
                  autoComplete="family-name"
                  required
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lastName: e.target.value,
                    })
                  }
                  className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] text-[#17231D] outline-none transition-all placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
                />
              </div>
            </div>

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

              <p className="mt-2 text-[11px] leading-5 text-[#8A938D]">
                Cette adresse sera utilisée pour la vérification de votre
                compte.
              </p>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-[13px] font-medium text-[#29342E]"
              >
                Mot de passe
              </label>

              <input
                id="password"
                name="password"
                type="password"
                placeholder="Choisissez un mot de passe"
                autoComplete="new-password"
                required
                minLength={10}
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] text-[#17231D] outline-none transition-all placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
              />

              <div className="mt-3 rounded-xl bg-[#F7F9F7] px-4 py-3.5">
                <p className="text-[11px] font-medium text-[#53615A]">
                  Votre mot de passe doit contenir :
                </p>

                <p className="mt-1.5 flex items-center gap-2 text-[11px] text-[#7A847E]">
                  <span className="h-1 w-1 rounded-full bg-[#8A938D]" />
                  Au moins 10 caractères
                </p>
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
                  Création du compte...
                </span>
              ) : (
                <>
                  Créer mon compte
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
          <div className="mt-7 border-t border-[#ECEFEC] pt-6 text-center">
            <p className="text-[13px] text-[#7A847E]">
              Vous avez déjà un compte ?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block text-[13px] font-medium text-[#536B5C] transition hover:text-[#17231D] hover:underline"
            >
              Se connecter
            </Link>
          </div>

          {/* Security */}
          <div className="mt-6 border-t border-[#ECEFEC] pt-6">
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
                  Création de compte sécurisée
                </p>

                <p className="mt-1 text-[12px] leading-5 text-[#7A847E]">
                  Votre adresse e-mail sera vérifiée avant l&apos;accès à votre
                  espace client.
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
