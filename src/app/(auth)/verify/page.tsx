"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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
          {/* Security icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EEF3EF] text-[#536B5C]">
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
            <h1 className="text-[29px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#17231D]">
              Vérification de sécurité
            </h1>

            <p className="mt-3 text-[14px] leading-6 text-[#68736D]">
              Pour protéger votre compte, nous avons envoyé un code de
              vérification à l&apos;adresse suivante :
            </p>

            {/* Email */}
            <div className="mt-4 rounded-xl border border-[#E2E7E3] bg-[#F7F9F7] px-4 py-3">
              <p className="truncate text-[13px] font-medium text-[#29342E]">
                {email || "Votre adresse e-mail"}
              </p>
            </div>
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
          <form onSubmit={onSubmit} className="mt-7">
            <label
              htmlFor="code"
              className="mb-3 block text-[13px] font-medium text-[#29342E]"
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
              className="h-[62px] w-full rounded-xl border border-[#D9DFDA] bg-white px-4 text-center text-[25px] font-medium tracking-[0.35em] text-[#17231D] outline-none transition-all placeholder:font-normal placeholder:tracking-[0.35em] placeholder:text-[#C0C7C2] hover:border-[#C6CEC8] focus:border-[#65796C] focus:ring-4 focus:ring-[#65796C]/10"
            />

            <p className="mt-2.5 text-center text-[11px] leading-5 text-[#8A938D]">
              Entrez les 6 chiffres reçus par e-mail.
            </p>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="mt-6 flex h-[50px] w-full items-center justify-center rounded-xl bg-[#17231D] px-4 text-[14px] font-medium text-white shadow-sm transition-all hover:bg-[#293B31] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#17231D]/15 disabled:cursor-not-allowed disabled:opacity-50"
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
          <div className="mt-7 border-t border-[#ECEFEC] pt-6">
            <p className="text-center text-[12px] leading-5 text-[#7A847E]">
              Vous n&apos;avez pas reçu le code ?
            </p>

            <p className="mt-1 text-center text-[12px] leading-5 text-[#8A938D]">
              Vérifiez votre dossier courrier indésirable ou revenez en arrière
              pour recommencer.
            </p>
          </div>

          {/* Security */}
          <div className="mt-6 rounded-xl bg-[#F7F9F7] px-4 py-3.5">
            <div className="flex gap-3">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="mt-0.5 h-[16px] w-[16px] shrink-0 text-[#536B5C]"
                aria-hidden="true"
              >
                <path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z" />
                <path
                  d="m9 12 2 2 4-4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <p className="text-[11px] leading-5 text-[#68736D]">
                Ne partagez jamais votre code de vérification avec une autre
                personne.
              </p>
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

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F5F7F5]">
          <div className="flex items-center gap-2 text-sm text-[#68736D]">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#D9DFDA] border-t-[#536B5C]" />
            Chargement...
          </div>
        </main>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
