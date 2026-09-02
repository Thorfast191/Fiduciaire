import Link from "next/link";
import DossierDetail from "./DossierDetail";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-surface text-strong">
      {/* Header */}
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7 lg:px-10">
          <Link
            href="/portal"
            className="text-[23px] font-semibold tracking-[-0.05em]"
          >
            fiduvia
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-muted sm:block">
              Espace client
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-petrol-900 text-[10px] font-medium text-white">
              FC
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        {/* Back navigation */}
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 text-[12px] font-medium text-muted transition hover:text-strong"
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
          Retour à mes dossiers
        </Link>

        {/* Page heading */}
        <div className="mt-6">
          <p className="fx-eyebrow">Espace client</p>

          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">
            Mon dossier fiscal
          </h1>

          <p className="mt-2 max-w-[600px] text-[14px] leading-6 text-muted">
            Consultez l&apos;avancement de votre dossier, transmettez vos
            documents et suivez les prochaines étapes.
          </p>
        </div>

        {/* Dossier */}
        <div className="mt-8">
          <DossierDetail dossierId={id} />
        </div>

        {/* Security reassurance */}
        <div className="mt-6 rounded-2xl border border-line bg-card p-5">
          <div className="flex gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-brand">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                className="h-[17px] w-[17px]"
                aria-hidden="true"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
              </svg>
            </div>

            <div>
              <p className="text-[12px] font-medium text-strong">
                Vos documents sont protégés
              </p>

              <p className="mt-1 text-[11px] leading-5 text-muted">
                Les informations et documents transmis à Fiduvia sont
                accessibles uniquement aux personnes autorisées.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 text-center text-[11px] text-subtle">
          © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
          en ligne.
        </footer>
      </div>
    </main>
  );
}
