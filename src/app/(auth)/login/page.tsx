"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Field, FormAlert } from "@/components/ui/Field";

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
    <main className="min-h-screen bg-surface px-4 py-12 sm:px-6 lg:py-16">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] w-full max-w-[480px] flex-col justify-center">
        {/* Brand */}
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-block text-[27px] font-semibold tracking-[-0.04em] text-strong"
          >
            fiduvia
          </Link>

          <p className="mt-1.5 text-[13px] text-muted">
            Fiduciaire & comptabilité en ligne
          </p>
        </div>

        {/* Login card */}
        <section className="rounded-[20px] border border-line bg-card px-6 py-8 shadow-md sm:px-10 sm:py-10">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-center text-[26px] font-semibold leading-[1.2] tracking-[-0.035em] text-strong sm:text-[29px]">
              Bienvenue sur votre espace client
            </h1>

            <p className="mx-auto mt-3 max-w-[360px] text-center text-[14px] leading-6 text-muted">
              Connectez-vous pour accéder à vos documents, paiements et
              démarches.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6">
              <FormAlert variant="error">{error}</FormAlert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            <Field
              id="email"
              label="Adresse e-mail"
              type="email"
              placeholder="vous@exemple.ch"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <div>
              <Field
                id="password"
                label="Mot de passe"
                type="password"
                placeholder="Votre mot de passe"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <div className="mt-2.5 text-right">
                <Link
                  href="/forgot-password"
                  className="text-[13px] font-medium text-brand transition-colors hover:text-strong hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-[50px] w-full items-center justify-center rounded-xl bg-brand px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-60"
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
            <p className="text-[12px] text-muted">
              Vous n&apos;avez pas encore de compte ?
            </p>

            <Link
              href="/signup"
              className="mt-1 inline-block text-[13px] font-medium text-brand hover:text-strong hover:underline"
            >
              Créer mon compte
            </Link>
          </div>

          {/* Security */}
          <div className="mt-8 border-t border-line pt-6">
            <div className="flex gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="text-brand"
                  aria-hidden="true"
                >
                  <rect x="4" y="10" width="16" height="11" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-medium text-strong">
                  Connexion sécurisée
                </p>

                <p className="mt-1 text-[12px] leading-5 text-muted">
                  Une vérification supplémentaire sera demandée après votre
                  connexion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-7 text-center">
          <p className="text-[11px] leading-5 text-subtle">
            © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
            en ligne.
          </p>
        </footer>
      </div>
    </main>
  );
}
