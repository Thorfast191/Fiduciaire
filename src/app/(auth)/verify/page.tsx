"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FormAlert } from "@/components/ui/Field";

function VerifyContent() {
  const router = useRouter();
  const params = useSearchParams();

  const email = params.get("email") ?? "";
  const purpose = (params.get("purpose") as "login" | "signup") ?? "login";

  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          email,
          code,
          purpose,
        }),
      });

      const body = await res.json();

      if (!body.ok) {
        setError(body.error);
        setLoading(false);
        return;
      }

      router.push(body.role === "client" ? "/portal" : "/admin");
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
          {/* Security icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-brand">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              className="h-6 w-6"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>

          {/* Heading */}
          <div className="mt-6">
            <h1 className="text-[29px] font-semibold leading-[1.15] tracking-[-0.04em] text-strong">
              Vérification de sécurité
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-muted">
              Pour protéger votre compte, nous avons envoyé un code de
              vérification à l&apos;adresse suivante :
            </p>

            {/* Email */}
            <div className="mt-4 rounded-xl border border-line bg-sunken px-4 py-3">
              <p className="truncate text-[13px] font-medium text-strong">
                {email || "Votre adresse e-mail"}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-6">
              <FormAlert variant="error">{error}</FormAlert>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} className="mt-7">
            <label
              htmlFor="code"
              className="mb-3 block text-[13px] font-medium text-strong"
            >
              Code de vérification
            </label>

            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              pattern="[0-9]{6}"
              placeholder="000000"
              required
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              className="h-[62px] w-full rounded-xl border border-line-default bg-card px-4 text-center text-[25px] font-medium tracking-[0.35em] text-strong outline-none transition-all placeholder:font-normal placeholder:tracking-[0.35em] placeholder:text-subtle hover:border-line-strong focus:border-brand focus:ring-4 focus:ring-brand/10"
            />

            <p className="mt-2.5 text-center text-[11px] leading-5 text-subtle">
              Entrez les 6 chiffres reçus par e-mail.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-6 flex h-[50px] w-full items-center justify-center rounded-xl bg-brand px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-brand-hover hover:shadow-md focus:outline-none focus:ring-4 focus:ring-brand/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2.5">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Vérification...
                </span>
              ) : (
                "Vérifier le code"
              )}
            </button>
          </form>

          {/* Help */}
          <div className="mt-7 border-t border-line pt-6">
            <p className="text-center text-[12px] leading-5 text-muted">
              Vous n&apos;avez pas reçu le code ?
            </p>

            <p className="mt-1 text-center text-[12px] leading-5 text-subtle">
              Vérifiez votre dossier courrier indésirable ou revenez en arrière
              pour recommencer.
            </p>
          </div>

          {/* Security */}
          <div className="mt-6 rounded-xl bg-sunken px-4 py-3.5">
            <div className="flex gap-3">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="mt-0.5 h-[16px] w-[16px] shrink-0 text-brand"
                aria-hidden="true"
              >
                <path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z" />
                <path
                  d="m9 12 2 2 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="text-[11px] leading-5 text-muted">
                Ne partagez jamais votre code de vérification avec une autre
                personne.
              </p>
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

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-surface">
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line-default border-t-brand" />
            Chargement...
          </div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
