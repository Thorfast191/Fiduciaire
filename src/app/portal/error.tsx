"use client";

import Link from "next/link";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="min-h-screen bg-[#F5F7F5] text-[#17231D] antialiased">
      <div className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-[520px]">
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

          {/* Error card */}
          <section className="rounded-[20px] border border-[#E1E6E2] bg-white px-6 py-10 text-center shadow-[0_20px_60px_rgba(23,35,29,0.07)] sm:px-10">
            {/* Error icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#F1F4F1] text-[#536B5C]">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-6 w-6"
                aria-hidden="true"
              >
                <path d="M12 8v4" strokeLinecap="round" />

                <path d="M12 16h.01" strokeLinecap="round" />

                <path
                  d="M10.3 4.5 3.7 16a2 2 0 0 0 1.75 3h13.1a2 2 0 0 0 1.75-3L13.7 4.5a2 2 0 0 0-3.4 0Z"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            {/* Heading */}
            <h1 className="mt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] text-[#17231D]">
              Une erreur est survenue
            </h1>

            <p className="mx-auto mt-3 max-w-[390px] text-[14px] leading-6 text-[#68736D]">
              Nous n&apos;avons pas pu charger cette page correctement. Veuillez
              réessayer ou revenir à l&apos;accueil.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-[48px] items-center justify-center rounded-xl bg-[#17231D] px-7 text-[13px] font-medium text-white transition hover:bg-[#293B31] focus:outline-none focus:ring-4 focus:ring-[#17231D]/15"
              >
                Réessayer
              </button>

              <Link
                href="/"
                className="inline-flex h-[48px] items-center justify-center rounded-xl border border-[#D5DDD7] bg-white px-7 text-[13px] font-medium text-[#334139] transition hover:border-[#BFCAC2] hover:bg-[#F8FAF8] focus:outline-none focus:ring-4 focus:ring-[#65796C]/10"
              >
                Retour à l&apos;accueil
              </Link>
            </div>

            {/* Support */}
            <div className="mt-8 border-t border-[#ECEFEC] pt-6">
              <p className="text-[12px] leading-5 text-[#8A938D]">
                Le problème persiste ?
              </p>

              <a
                href="mailto:contact@fiduvia.ch"
                className="mt-1 inline-block text-[12px] font-medium text-[#536B5C] transition hover:text-[#17231D] hover:underline"
              >
                Contacter Fiduvia
              </a>
            </div>

            {/* Security note */}
            <div className="mt-6 rounded-xl bg-[#F7F9F7] px-4 py-3">
              <p className="text-[11px] leading-5 text-[#8A938D]">
                Vos données et documents restent protégés. Notre équipe peut
                intervenir si le problème persiste.
              </p>
            </div>
          </section>

          {/* Footer */}
          <p className="mt-7 text-center text-[11px] leading-5 text-[#8A938D]">
            © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
            en ligne.
          </p>
        </div>
      </div>
    </main>
  );
}
