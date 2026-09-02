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

/** The mockup's `aPalette` (`Fiduvia.dc.html:2966`), cycled across the bars. */
const BAR_PALETTE = [
  "var(--brand)",
  "var(--petrol-800)",
  "var(--green-600)",
  "var(--teal-500)",
  "var(--amber-600)",
  "var(--petrol-600)",
];

/**
 * Admin dashboard, matching the mockup's "ADMIN ACCUEIL" artboard
 * (`Fiduvia.dc.html:2884`). The mockup's third KPI is personal revenue; this
 * shows active clients instead, since payments are not implemented.
 */
export default async function AdminHomePage() {
  const stats = await getAdminDashboardStats();

  // The période pill tracks the calendar, not the data: a stray dossier filed
  // under a far-future year must not become the headline period.
  const currentYear = new Date().getFullYear() - 1;
  const statusTotal = STATUS_ORDER.reduce((a, s) => a + stats.byStatus[s], 0);

  // The mockup's equivalent block shows six bars; keep the most recent six
  // periods so the chart stays readable as years accumulate.
  const years = stats.byTaxYear.slice(0, 6);
  const maxYear = Math.max(1, ...years.map((r) => r.count));

  return (
    <div className="max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            Espace administrateur
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">
            Vos dossiers pour la période fiscale en cours.
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-line-default bg-card px-4 py-2.5 text-[14px] font-semibold text-strong">
          Période {currentYear}
        </span>
      </div>

      <section className="mt-[22px] grid gap-3.5 sm:grid-cols-3">
        <StatCard
          label="DOSSIERS"
          value={stats.totalDossiers}
          hint="toutes prestations confondues"
        />
        <StatCard
          label="DOSSIERS TRAITÉS"
          value={stats.completedDossiers}
          hint="clôturés cette période"
        />
        <StatCard
          label="CLIENTS"
          value={stats.totalClients}
          hint="comptes actifs"
          accent
        />
      </section>

      <section className="mt-4 rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          Répartition par statut
        </span>

        <div className="mt-3 flex h-[18px] gap-[5px] overflow-hidden rounded-full">
          {statusTotal === 0 ? (
            <div className="h-full w-full rounded-full bg-sunken" />
          ) : (
            STATUS_ORDER.filter((s) => stats.byStatus[s] > 0).map((s) => (
              <div
                key={s}
                className={`h-full ${STATUS_BAR[s]}`}
                style={{ width: `${(stats.byStatus[s] / statusTotal) * 100}%` }}
              />
            ))
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {STATUS_ORDER.map((s) => (
            <span
              key={s}
              className="flex items-center gap-[7px] text-[13px] text-body"
            >
              <span
                className={`h-[9px] w-[9px] shrink-0 rounded-full ${STATUS_BAR[s]}`}
              />
              {STATUS_LABELS[s]} · {stats.byStatus[s]}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          Dossiers par année fiscale
        </span>

        <div className="mt-3.5 flex flex-col gap-3">
          {years.length === 0 && (
            <p className="text-[13px] text-muted">Aucun dossier.</p>
          )}

          {years.map((r, i) => (
            <div key={r.taxYear} className="flex items-center gap-3">
              <span className="disp w-[110px] shrink-0 text-[15px] font-bold sm:w-[170px]">
                {r.taxYear}
              </span>

              <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(r.count / maxYear) * 100}%`,
                    background: BAR_PALETTE[i % BAR_PALETTE.length],
                  }}
                />
              </div>

              <span className="fx-figure w-12 shrink-0 text-right text-[16px] font-bold text-brand">
                {r.count}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
