import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function AdminHomePage() {
  const user = await getCurrentUser();

  const firstName = user?.firstName || "Administrateur";
  const lastName = user?.lastName || "";
  const role = user?.role || "admin";

  return (
    <main className="px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
      <div className="mx-auto max-w-7xl">
        {/* Welcome */}
        <section>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#65796C]">
            Tableau de bord
          </p>

          <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.04em] sm:text-[36px]">
                Bonjour, {firstName}
              </h1>

              <p className="mt-2 text-[14px] text-[#737E77]">
                Voici un aperçu de votre activité Fiduvia.
              </p>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[#DDE3DE] bg-white px-3.5 py-2.5">
              <span className="h-2 w-2 rounded-full bg-[#6D9278]" />

              <span className="text-[11px] font-medium text-[#53615A]">
                Système opérationnel
              </span>
            </div>
          </div>
        </section>

        {/* Statistics */}
        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Clients"
            value="—"
            description="Clients enregistrés"
            icon={
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                className="h-5 w-5"
              >
                <circle cx="9" cy="8" r="3" />
                <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                <path d="M16 11a3 3 0 0 1 4 2.8" />
                <path d="M16.5 19a4.5 4.5 0 0 1 4-2.4" />
              </svg>
            }
          />

          <StatCard
            label="Dossiers"
            value="—"
            description="Dossiers fiscaux"
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

          <StatCard
            label="Documents"
            value="—"
            description="Documents reçus"
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

          <StatCard
            label="Actions"
            value="—"
            description="Demandes en attente"
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

        {/* Main workspace */}
        <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
          {/* Main actions */}
          <div className="rounded-2xl border border-[#E0E5E1] bg-white p-6 shadow-[0_8px_30px_rgba(23,35,29,0.04)] sm:p-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#65796C]">
                Gestion
              </p>

              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.025em]">
                Actions rapides
              </h2>

              <p className="mt-1.5 text-[13px] leading-5 text-[#7A847E]">
                Accédez rapidement aux principales fonctions administratives.
              </p>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <DashboardAction
                href="/admin/dossiers"
                title="Dossiers fiscaux"
                description="Créer et suivre les dossiers"
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

              <DashboardAction
                href="/admin/clients"
                title="Clients"
                description="Consulter les comptes clients"
                icon={
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    className="h-5 w-5"
                  >
                    <circle cx="9" cy="8" r="3" />
                    <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
                    <path d="M16 11a3 3 0 0 1 4 2.8" />
                    <path d="M16.5 19a4.5 4.5 0 0 1 4-2.4" />
                  </svg>
                }
              />

              <DashboardAction
                href="/admin/documents"
                title="Documents"
                description="Gérer les fichiers reçus"
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

              <DashboardAction
                href="/admin/notifications"
                title="Notifications"
                description="Envoyer une demande à un client"
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
            </div>
          </div>

          {/* Account */}
          <div className="rounded-2xl border border-[#E0E5E1] bg-white p-6 shadow-[0_8px_30px_rgba(23,35,29,0.04)] sm:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#65796C]">
              Compte
            </p>

            <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.025em]">
              Votre session
            </h2>

            <div className="mt-6 rounded-xl bg-[#F7F9F7] p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#17231D] text-[12px] font-medium text-white">
                  {firstName.charAt(0)}
                  {lastName.charAt(0)}
                </div>

                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-[#29342E]">
                    {firstName} {lastName}
                  </p>

                  <p className="mt-0.5 text-[11px] text-[#8A938D]">
                    {role === "super_admin"
                      ? "Super administrateur"
                      : "Administrateur"}
                  </p>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="mt-5 flex gap-3 rounded-xl border border-[#E1E7E2] bg-white p-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF3EF] text-[#536B5C]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  className="h-4 w-4"
                >
                  <rect x="4" y="10" width="16" height="10" rx="2" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>
              </div>

              <div>
                <p className="text-[12px] font-medium text-[#29342E]">
                  Espace sécurisé
                </p>

                <p className="mt-0.5 text-[11px] leading-5 text-[#8A938D]">
                  Votre accès administrateur est protégé.
                </p>
              </div>
            </div>

            {/* Logout */}
            <form action="/api/auth/logout" method="post" className="mt-5">
              <button
                type="submit"
                className="flex h-[46px] w-full items-center justify-center rounded-xl border border-[#D7DED9] bg-white px-4 text-[13px] font-medium text-[#53615A] transition hover:border-[#C3CCC5] hover:bg-[#F8FAF8] hover:text-[#17231D] focus:outline-none focus:ring-4 focus:ring-[#65796C]/10"
              >
                Se déconnecter
              </button>
            </form>
          </div>
        </section>

        {/* Activity placeholder */}
        <section className="mt-5 rounded-2xl border border-[#E0E5E1] bg-white p-6 shadow-[0_8px_30px_rgba(23,35,29,0.04)] sm:p-7">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-[#65796C]">
                Activité
              </p>

              <h2 className="mt-2 text-[19px] font-semibold tracking-[-0.025em]">
                Activité récente
              </h2>
            </div>

            <span className="text-[11px] text-[#9AA29D]">
              Dernières actions
            </span>
          </div>

          <div className="mt-6 flex min-h-[120px] items-center justify-center rounded-xl border border-dashed border-[#DDE3DE] bg-[#FAFBFA]">
            <div className="text-center">
              <p className="text-[13px] font-medium text-[#68736D]">
                Aucune activité récente
              </p>

              <p className="mt-1 text-[11px] text-[#9AA29D]">
                Les nouvelles actions apparaîtront ici.
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 text-center text-[11px] text-[#929A95]">
          Fiduvia Administration · Gestion sécurisée de votre activité
        </footer>
      </div>
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Components                                                                 */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  description,
  icon,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-[#E0E5E1] bg-white p-5 shadow-[0_8px_30px_rgba(23,35,29,0.035)]">
      <div className="flex items-start justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EEF3EF] text-[#536B5C]">
          {icon}
        </div>

        <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[#A0A9A3]">
          Fiduvia
        </span>
      </div>

      <p className="mt-5 text-[28px] font-semibold tracking-[-0.04em] text-[#17231D]">
        {value}
      </p>

      <p className="mt-1 text-[12px] font-medium text-[#29342E]">{label}</p>

      <p className="mt-1 text-[11px] text-[#8A938D]">{description}</p>
    </div>
  );
}

function DashboardAction({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3.5 rounded-xl border border-[#E2E7E3] bg-white p-4 transition hover:-translate-y-[1px] hover:border-[#CBD5CE] hover:bg-[#FAFBFA] hover:shadow-[0_8px_25px_rgba(23,35,29,0.05)]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F0F4F1] text-[#536B5C] transition group-hover:bg-[#E8EFEA]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#29342E]">{title}</p>

        <p className="mt-0.5 text-[11px] leading-5 text-[#8A938D]">
          {description}
        </p>
      </div>

      <span className="text-[16px] text-[#A0A9A3] transition group-hover:translate-x-0.5 group-hover:text-[#536B5C]">
        →
      </span>
    </Link>
  );
}
