"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
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
        `/verify?email=${encodeURIComponent(form.email)}&purpose=login`,
      );
    } catch {
      setError(
        "Une erreur est survenue. Veuillez réessayer dans quelques instants.",
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#F5F7F5] px-4 py-12 sm:px-6 lg:py-16">
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

        {/* Login card */}
        <section className="rounded-[20px] border border-[#E1E6E2] bg-white px-6 py-8 shadow-[0_20px_60px_rgba(23,35,29,0.07)] sm:px-10 sm:py-10">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-center text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] text-[#17231D] sm:text-[29px]">
              Bienvenue sur votre espace client
            </h1>

            <p className="mx-auto mt-3 max-w-[360px] text-center text-[14px] leading-6 text-[#68736D]">
              Connectez-vous pour accéder à vos documents, paiements et
              démarches.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-[#F1C7C7] bg-[#FFF7F7] px-4 py-3.5 text-sm leading-5 text-[#A33A3A]"
            >
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
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
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
                className="h-[50px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-[15px] text-[#17231D] outline-none transition-all placeholder:text-[#A5ADA8] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
              />

              <div className="mt-2.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-[#536B5C] transition-colors hover:text-[#17231D] hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[50px] w-full items-center justify-center rounded-xl bg-[#17231D] px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-[#26372D] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#17231D]/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Connexion...
                </span>
              ) : (
                "Se connecter"
              )}
            </button>
          </form>

          {/* Create account */}
          <div className="mt-6 text-center">
            <p className="text-[12px] text-[#7A847E]">
              Vous n&apos;avez pas encore de compte ?
            </p>

            <Link
              href="/signup"
              className="mt-1 inline-block text-[13px] font-medium text-[#536B5C] hover:text-[#17231D] hover:underline"
            >
              Créer mon compte
            </Link>
          </div>

          {/* Security */}
          <div className="mt-8 border-t border-[#ECEFEC] pt-6">
            <div className="flex gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F0F4F1]">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="text-[#536B5C]"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-medium text-[#29342E]">
                  Connexion sécurisée
                </p>

                <p className="mt-1 text-[12px] leading-5 text-[#7A847E]">
                  Une vérification supplémentaire sera demandée après votre
                  connexion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-7 text-center">
          <p className="text-[11px] leading-5 text-[#8A938D]">
            © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
            en ligne.
          </p>
        </footer>
      </div>
    </main>
  );
}
