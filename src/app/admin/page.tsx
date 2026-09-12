import { getAdminHomeStats } from "@/lib/adminStats";
import { listTaxYears } from "@/lib/dossiers";
import { getCurrentUser } from "@/lib/auth/guards";
import { StatCard } from "@/components/ui/StatCard";
import { STATUS_ORDER } from "@/lib/dossierStatus";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import { serviceLabel, type ServiceType } from "@/lib/serviceTypes";
import type { DossierStatus } from "@/db/schema";

const STATUS_BAR: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started",
  submitted: "bg-status-submitted",
  in_review: "bg-status-in-review",
  // Waiting on the client is a hold, not progress, so it takes the amber bar.
  documents_requested: "bg-[#B26A00]",
  documents_received: "bg-status-submitted",
  completed: "bg-status-completed",
  reclamation: "bg-[#C0453B]",
};

/**
 * The prestations the mockup's admin home charts, in its order and colours
 * (`Fiduvia.dc.html`): declaration, departure, capital, death, simulation,
 * instalments — relectures are absent from this breakdown in the mockup.
 */
const HOME_PRESTATIONS: { type: ServiceType; color: string }[] = [
  { type: "declaration", color: "var(--brand)" },
  { type: "departure", color: "var(--petrol-800)" },
  { type: "capital", color: "var(--green-600)" },
  { type: "deces", color: "var(--teal-500)" },
  { type: "simulation", color: "var(--amber-600)" },
  { type: "acompte", color: "var(--petrol-600)" },
];

/**
 * Admin home, matching the mockup's "Espace administrateur" artboard. Per-agent
 * by design: the signed-in administrator's reserved dossiers, how many they have
 * closed, and the revenue those bring in — the firm-wide view lives under
 * Statistiques. Every figure is scoped to the période picker.
 */
export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const [{ periode }, periods, user, { t, locale }] = await Promise.all([
    searchParams,
    listTaxYears(),
    getCurrentUser(),
    getT(),
  ]);

  const options = await listPeriodOptions(periods);
  const selected = resolvePeriod(options, periode);

  const stats = await getAdminHomeStats(user?.id ?? "", selected);
  const statusTotal = STATUS_ORDER.reduce((a, s) => a + stats.byStatus[s], 0);

  const money = new Intl.NumberFormat(locale === "fr" ? "fr-CH" : "en-CH", {
    maximumFractionDigits: 0,
  });

  const prestations = HOME_PRESTATIONS.map((p) => ({
    label: serviceLabel(t, p.type),
    count: stats.byService[p.type] ?? 0,
    color: p.color,
  }));
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
          label={t.admin.kpiReserved}
          value={stats.reservedTotal}
          hint={t.admin.kpiReservedSub}
        />
        <StatCard
          label={t.admin.kpiCompleted}
          value={stats.reservedCompleted}
          hint={t.admin.kpiCompletedSub}
        />
        <StatCard
          label={t.admin.kpiRevenue}
          value={`CHF ${money.format(stats.personalRevenueChf)}`}
          hint={t.admin.kpiRevenueSub}
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
          {prestations.map((p) => (
            <div key={p.label} className="flex items-center gap-3">
              <span className="disp w-[120px] shrink-0 text-[15px] font-bold sm:w-[170px]">
                {p.label}
              </span>

              <div className="h-3 flex-1 overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${(p.count / maxPrestation) * 100}%`,
                    background: p.color,
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
