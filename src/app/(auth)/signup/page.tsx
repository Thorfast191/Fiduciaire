"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Field, FormAlert } from "@/components/ui/Field";

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
    <main className="min-h-screen bg-surface px-4 py-12 sm:px-6">
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

        {/* Card */}
        <section className="rounded-[20px] border border-line bg-card px-6 py-8 shadow-md sm:px-10 sm:py-10">
          {/* Header */}
          <div>
            <p className="fx-eyebrow">Bienvenue chez Fiduvia</p>

            <h1 className="mt-3 text-[29px] font-semibold leading-[1.15] tracking-[-0.04em] text-strong">
              Créer mon compte
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-muted">
              Créez votre espace personnel pour gérer vos documents, démarches
              et échanges avec Fiduvia.
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
                label="Prénom"
                type="text"
                placeholder="Votre prénom"
                autoComplete="given-name"
                required
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
              />

              <Field
                id="lastName"
                label="Nom"
                type="text"
                placeholder="Votre nom"
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
                label="Adresse e-mail"
                type="email"
                placeholder="vous@exemple.ch"
                autoComplete="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />

              <p className="mt-2 text-[11px] leading-5 text-subtle">
                Cette adresse sera utilisée pour la vérification de votre
                compte.
              </p>
            </div>

            {/* Password */}
            <div>
              <Field
                id="password"
                label="Mot de passe"
                type="password"
                placeholder="Choisissez un mot de passe"
                autoComplete="new-password"
                required
                minLength={10}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />

              <div className="mt-3 rounded-xl bg-sunken px-4 py-3.5">
                <p className="text-[11px] font-medium text-brand">
                  Votre mot de passe doit contenir :
                </p>

                <p className="mt-1.5 flex items-center gap-2 text-[11px] text-muted">
                  <span className="h-1 w-1 rounded-full bg-subtle" />
                  Au moins 10 caractères
                </p>
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
          <div className="mt-7 border-t border-line pt-6 text-center">
            <p className="text-[13px] text-muted">
              Vous avez déjà un compte ?
            </p>

            <Link
              href="/login"
              className="mt-2 inline-block text-[13px] font-medium text-brand transition hover:text-strong hover:underline"
            >
              Se connecter
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
                  Création de compte sécurisée
                </p>

                <p className="mt-1 text-[12px] leading-5 text-muted">
                  Votre adresse e-mail sera vérifiée avant l&apos;accès à votre
                  espace client.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <p className="mt-7 text-center text-[11px] leading-5 text-subtle">
          © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
          en ligne.
        </p>
      </div>
    </main>
  );
}
