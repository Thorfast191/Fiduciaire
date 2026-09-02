import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import DossierList from "./DossierList";

export default async function PortalHomePage() {
  const user = await getCurrentUser();

  const firstName = user?.firstName || "Client";
  const lastName = user?.lastName || "";
  const email = user?.email || "";

  return (
    <main className="min-h-screen bg-surface text-strong">
      {/* Header */}
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-5 sm:px-7 lg:px-10">
          {/* Logo */}
          <Link
            href="/portal"
            className="text-[23px] font-semibold tracking-[-0.05em]"
          >
            fiduvia
          </Link>

          {/* Account */}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-[12px] font-medium text-strong">
                {firstName} {lastName}
              </p>

              <p className="mt-0.5 text-[10px] text-subtle">Espace client</p>
            </div>

            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-petrol-900 text-[10px] font-medium text-white">
              {firstName.charAt(0)}
              {lastName.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
        {/* Welcome */}
        <section>
          <p className="fx-eyebrow">Espace client</p>

          <div className="mt-2 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">
                Bonjour, {firstName}
              </h1>

              <p className="mt-2 max-w-[600px] text-[14px] leading-6 text-muted">
                Retrouvez ici vos dossiers fiscaux, vos documents et les
                prochaines actions à effectuer.
              </p>
            </div>

            {/* Account status */}
            <div className="flex w-fit items-center gap-2 rounded-xl border border-line bg-card px-3.5 py-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-brand">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z" />
                  <path
                    d="m9 12 2 2 4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>

              <div>
                <p className="text-[10px] uppercase tracking-[0.08em] text-subtle">
                  Compte
                </p>

                <p className="text-[11px] font-medium text-brand">Sécurisé</p>
              </div>
            </div>
          </div>
        </section>

        {/* Overview cards */}
        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <PortalInfoCard
            label="Mes dossiers"
            description="Dossiers fiscaux suivis par Fiduvia"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <path d="M5 4h10l4 4v12H5z" />
                <path d="M14 4v5h5" />
                <path d="M9 13h6M9 17h5" />
              </svg>
            }
          />

          <PortalInfoCard
            label="Documents"
            description="Déposez vos justificatifs directement en ligne"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <path d="M6 3h9l3 3v15H6z" />
                <path d="M14 3v4h4" />
                <path d="M9 12h6M9 16h6" />
              </svg>
            }
          />

          <PortalInfoCard
            label="Accompagnement"
            description="Fiduvia vous informe des prochaines étapes"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                <path d="M10 21h4" />
              </svg>
            }
          />
        </section>

        {/* Dossiers */}
        <section className="mt-8">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="fx-eyebrow">Suivi</p>

              <h2 className="mt-1.5 text-[21px] font-semibold tracking-[-0.03em]">
                Mes dossiers fiscaux
              </h2>

              <p className="mt-1 text-[12px] text-muted">
                Consultez l&apos;état d&apos;avancement de vos dossiers.
              </p>
            </div>
          </div>

          {/* Existing dossier component */}
          <div className="rounded-2xl border border-line bg-card p-5 shadow-sm sm:p-7">
            <DossierList />
          </div>
        </section>

        {/* Help / security */}
        <section className="mt-5 grid gap-5 md:grid-cols-2">
          {/* Security */}
          <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
            <div className="flex gap-3.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-brand">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-[17px] w-[17px]"
                >
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>

              <div>
                <p className="text-[13px] font-medium text-strong">
                  Vos données sont protégées
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted">
                  Votre espace est personnel et les documents sont accessibles
                  uniquement aux personnes autorisées.
                </p>
              </div>
            </div>
          </div>

          {/* Account */}
          <div className="rounded-2xl border border-line bg-card p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[13px] font-medium text-strong">{email}</p>

                <p className="mt-1 text-[11px] text-subtle">
                  Votre compte Fiduvia
                </p>
              </div>

              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  className="rounded-xl border border-line-default px-4 py-2.5 text-[11px] font-medium text-brand transition hover:border-line-strong hover:bg-sunken hover:text-strong focus:outline-none focus:ring-4 focus:ring-brand/10"
                >
                  Se déconnecter
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-[11px] text-subtle">
          © {new Date().getFullYear()} Fiduvia · Votre fiduciaire, entièrement
          en ligne.
        </footer>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function PortalInfoCard({
  label,
  description,
  icon,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 shadow-sm">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-brand">
        {icon}
      </div>

      <p className="mt-4 text-[13px] font-medium text-strong">{label}</p>

      <p className="mt-1.5 text-[11px] leading-5 text-subtle">{description}</p>
    </div>
  );
}
