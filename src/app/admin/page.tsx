import { getCurrentUser } from "@/lib/auth/guards";
import { getAdminDashboardStats } from "@/lib/adminStats";
import { StatCard } from "@/components/ui/StatCard";
import { STATUS_LABELS } from "@/components/ui/StatusBadge";
import type { DossierStatus } from "@/db/schema";

const STATUS_ORDER: DossierStatus[] = [
  "not_started",
  "submitted",
  "in_review",
  "completed",
];

const STATUS_BAR: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started",
  submitted: "bg-status-submitted",
  in_review: "bg-status-in-review",
  completed: "bg-status-completed",
};

export default async function AdminHomePage() {
  const [user, stats] = await Promise.all([
    getCurrentUser(),
    getAdminDashboardStats(),
  ]);
  const firstName = user?.firstName || "Administrateur";
  const currentYear =
    stats.byTaxYear[0]?.taxYear ?? new Date().getFullYear() - 1;
  const statusTotal = STATUS_ORDER.reduce(
    (a, s) => a + stats.byStatus[s],
    0,
  );
  const maxYear = Math.max(1, ...stats.byTaxYear.map((r) => r.count));

  return (
    <main className="px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="fx-eyebrow">Tableau de bord</p>
            <h1 className="disp mt-2 text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
              Bonjour, {firstName}
            </h1>
            <p className="mt-1.5 text-[15px] text-muted">
              Voici un aperçu de votre activité Fiduvia.
            </p>
          </div>
          <span className="rounded-full border border-line-default bg-card px-4 py-2 font-mono text-[12px] text-strong">
            Période {currentYear}
          </span>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="DOSSIERS"
            value={stats.totalDossiers}
            hint="tous statuts confondus"
          />
          <StatCard
            label="DOSSIERS TERMINÉS"
            value={stats.completedDossiers}
            hint="clôturés"
          />
          <StatCard
            label="CLIENTS"
            value={stats.totalClients}
            hint="comptes actifs"
            accent
          />
        </section>

        <section className="mt-4 rounded-xl border border-line bg-card p-[18px] shadow-xs">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            Répartition par statut
          </span>
          <div className="mt-3 flex h-[18px] gap-1 overflow-hidden rounded-full">
            {statusTotal === 0 ? (
              <div className="h-full w-full rounded-full bg-sunken" />
            ) : (
              STATUS_ORDER.filter((s) => stats.byStatus[s] > 0).map((s) => (
                <div
                  key={s}
                  className={`h-full ${STATUS_BAR[s]}`}
                  style={{
                    width: `${(stats.byStatus[s] / statusTotal) * 100}%`,
                  }}
                />
              ))
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            {STATUS_ORDER.map((s) => (
              <span
                key={s}
                className="flex items-center gap-2 text-[12px] text-muted"
              >
                <span className={`h-2.5 w-2.5 rounded-full ${STATUS_BAR[s]}`} />
                {STATUS_LABELS[s]}
                <span className="fx-figure font-semibold text-strong">
                  {stats.byStatus[s]}
                </span>
              </span>
            ))}
          </div>
        </section>

        <section className="mt-4 rounded-xl border border-line bg-card p-5 shadow-xs">
          <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
            Dossiers par année fiscale
          </span>
          <div className="mt-3.5 flex flex-col gap-3">
            {stats.byTaxYear.length === 0 && (
              <p className="text-[13px] text-muted">Aucun dossier.</p>
            )}
            {stats.byTaxYear.map((r) => (
              <div key={r.taxYear} className="flex items-center gap-3">
                <span className="disp w-16 shrink-0 text-[15px] font-bold">
                  {r.taxYear}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(r.count / maxYear) * 100}%` }}
                  />
                </div>
                <span className="fx-figure w-7 text-right text-[16px] font-bold text-brand">
                  {r.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
