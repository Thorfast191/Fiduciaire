import Link from "next/link";
import DossierDetail from "./DossierDetail";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-screen bg-[#F5F7F5] text-[#17231D]">
      {/* Header */}
      <header className="border-b border-[#E1E6E2] bg-white">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7 lg:px-10">
          <Link
            href="/portal"
            className="text-[23px] font-semibold tracking-[-0.05em]"
          >
            fiduvia
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden text-[12px] text-[#7A847E] sm:block">
              Espace client
            </span>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#17231D] text-[10px] font-medium text-white">
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
          className="inline-flex items-center gap-2 text-[12px] font-medium text-[#7A847E] transition hover:text-[#17231D]"
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
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#65796C]">
            Espace client
          </p>

          <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">
            Mon dossier fiscal
          </h1>

          <p className="mt-2 max-w-[600px] text-[14px] leading-6 text-[#737E77]">
            Consultez l&apos;avancement de votre dossier, transmettez vos
            documents et suivez les prochaines étapes.
          </p>
        </div>

        {/* Dossier */}
        <div className="mt-8">
          <DossierDetail dossierId={id} />
        </div>

        {/* Security reassurance */}
        <div className="mt-6 rounded-2xl border border-[#E0E6E1] bg-white p-5">
          <div className="flex gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EEF3EF] text-[#536B5C]">
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
              <p className="text-[12px] font-medium text-[#29342E]">
                Vos documents sont protégés
              </p>

              <p className="mt-1 text-[11px] leading-5 text-[#7A847E]">
                Les informations et documents transmis à Fiduvia sont
                accessibles uniquement aux personnes autorisées.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 text-center text-[11px] text-[#929A95]">
          © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
          en ligne.
        </footer>
      </div>
    </main>
  );
}
