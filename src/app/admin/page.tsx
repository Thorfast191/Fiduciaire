import { getAdminDashboardStats } from "@/lib/adminStats";
import { listTaxYears } from "@/lib/dossiers";
import { StatCard } from "@/components/ui/StatCard";
import { STATUS_ORDER } from "@/lib/dossierStatus";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import type { DossierStatus } from "@/db/schema";

const STATUS_BAR: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started",
  submitted: "bg-status-submitted",
  in_review: "bg-status-in-review",
  // Waiting on the client is a hold, not progress, so it takes the amber bar.
  documents_requested: "bg-[#B26A00]",
  documents_received: "bg-status-submitted",
  completed: "bg-status-completed",
};

/** The mockup's `aPalette` (`Fiduvia.dc.html:2966`). */
const PALETTE = [
  "var(--brand)",
  "var(--petrol-800)",
  "var(--green-600)",
  "var(--teal-500)",
  "var(--amber-600)",
];

/**
 * Admin dashboard, matching the mockup's "ADMIN ACCUEIL" artboard
 * (`Fiduvia.dc.html:2884`): KPIs, a status distribution strip and per-prestation
 * bars, all scoped to the période picker.
 *
 * Two deliberate departures, both for want of a backend: the mockup's third KPI
 * is the signed-in admin's personal revenue, shown here as active clients; and
 * its figures cover only the dossiers that admin has reserved, which this
 * platform has no concept of, so they are global.
 */
export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const [{ periode }, periods, { t }] = await Promise.all([
    searchParams,
    listTaxYears(),
    getT(),
  ]);

  const options = await listPeriodOptions(periods);
  const selected = resolvePeriod(options, periode);

  const stats = await getAdminDashboardStats(selected);
  const statusTotal = STATUS_ORDER.reduce((a, s) => a + stats.byStatus[s], 0);

  // Only tax returns exist; the mockup lists every prestation, so the others
  // appear at zero rather than being hidden.
  const h = t.admin.hub;
  const prestations = [
    { label: h.declarations, count: stats.totalDossiers },
    { label: h.capital, count: 0 },
    { label: h.simulations, count: 0 },
    { label: h.instalments, count: 0 },
    { label: h.reviews, count: 0 },
  ];
  const maxPrestation = Math.max(1, ...prestations.map((p) => p.count));

  return (
    <div className="max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.admin.dashTitle}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">{t.admin.dashSub}</p>
        </div>

        <PeriodPicker years={options} current={selected} />
      </div>

      <section className="mt-[22px] grid gap-3.5 sm:grid-cols-3">
        <StatCard
          label={t.admin.kpiDossiers}
          value={stats.totalDossiers}
          hint={t.admin.kpiDossiersSub}
        />
        <StatCard
          label={t.admin.kpiCompleted}
          value={stats.completedDossiers}
          hint={t.admin.kpiCompletedSub}
        />
        <StatCard
          label={t.admin.kpiClients}
          value={stats.totalClients}
          hint={t.admin.kpiClientsSub}
          accent
        />
      </section>

      <section className="mt-4 rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          {t.admin.distTitle}
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
          {STATUS_ORDER.filter((s) => stats.byStatus[s] > 0).map((s) => (
            <span
              key={s}
              className="flex items-center gap-[7px] text-[13px] text-body"
            >
              <span
                className={`h-[9px] w-[9px] shrink-0 rounded-full ${STATUS_BAR[s]}`}
              />
              {t.status[s]} · {stats.byStatus[s]}
            </span>
          ))}
        </div>
      </section>

      <section className="mt-4 rounded-[var(--radius-md)] border border-line bg-card p-5 shadow-[var(--shadow-xs)]">
        <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
          {t.admin.byPrestationTitle}
        </span>

        <div className="mt-3.5 flex flex-col gap-3">
          {prestations.map((p, i) => (
            <div key={p.label} className="flex items-center gap-3">
              <span className="disp w-[120px] shrink-0 text-[15px] font-bold sm:w-[190px]">
                {p.label}
              </span>

              <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(p.count / maxPrestation) * 100}%`,
                    background: PALETTE[i % PALETTE.length],
                  }}
                />
              </div>

              <span className="fx-figure w-12 shrink-0 text-right text-[16px] font-bold text-brand">
                {p.count}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
