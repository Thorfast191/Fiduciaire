"use client";

import Link from "next/link";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <main className="min-h-screen bg-surface text-strong antialiased">
      <div className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-6">
        <div className="w-full max-w-[520px]">
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

          {/* Error card */}
          <section className="rounded-[20px] border border-line bg-card px-6 py-10 text-center shadow-md sm:px-10">
            {/* Error icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-50 text-brand">
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
            <h1 className="mt-6 text-[28px] font-semibold leading-[1.15] tracking-[-0.04em] text-strong">
              Une erreur est survenue
            </h1>

            <p className="mx-auto mt-3 max-w-[390px] text-[14px] leading-6 text-muted">
              Nous n&apos;avons pas pu charger cette page correctement. Veuillez
              réessayer ou revenir à l&apos;accueil.
            </p>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex h-[48px] items-center justify-center rounded-xl bg-brand px-7 text-[13px] font-medium text-white transition hover:bg-brand-hover focus:outline-none focus:ring-4 focus:ring-brand/15"
              >
                Réessayer
              </button>

              <Link
                href="/"
                className="inline-flex h-[48px] items-center justify-center rounded-xl border border-line-default bg-card px-7 text-[13px] font-medium text-strong transition hover:border-line-strong hover:bg-sunken focus:outline-none focus:ring-4 focus:ring-brand/10"
              >
                Retour à l&apos;accueil
              </Link>
            </div>

            {/* Support */}
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-[12px] leading-5 text-subtle">
                Le problème persiste ?
              </p>

              <a
                href="mailto:contact@fiduvia.ch"
                className="mt-1 inline-block text-[12px] font-medium text-brand transition hover:text-strong hover:underline"
              >
                Contacter Fiduvia
              </a>
            </div>

            {/* Security note */}
            <div className="mt-6 rounded-xl bg-sunken px-4 py-3">
              <p className="text-[11px] leading-5 text-subtle">
                Vos données et documents restent protégés. Notre équipe peut
                intervenir si le problème persiste.
              </p>
            </div>
          </section>

          {/* Footer */}
          <p className="mt-7 text-center text-[11px] leading-5 text-subtle">
            © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
            en ligne.
          </p>
        </div>
      </div>
    </main>
  );
}
