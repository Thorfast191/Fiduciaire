import { getAdminDashboardStats, getPerAdminStats } from "@/lib/adminStats";
import {
  countDossiersByService,
  countFreeDossiersByService,
  listTaxYears,
} from "@/lib/dossiers";
import { StatCard } from "@/components/ui/StatCard";
import { STATUS_ORDER } from "@/lib/dossierStatus";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import {
  SERVICE_TYPES,
  serviceLabel,
  type ServiceType,
} from "@/lib/serviceTypes";
import type { DossierStatus } from "@/db/schema";
import { getCurrentUser, requireRole } from "@/lib/auth/guards";
import AdminStatCards from "./AdminStatCards";

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

/** The mockup's admin breakdown order and colours (see the home artboard). */
const STATS_PRESTATIONS: { type: ServiceType; color: string }[] = [
  { type: "declaration", color: "var(--brand)" },
  { type: "departure", color: "var(--petrol-800)" },
  { type: "capital", color: "var(--green-600)" },
  { type: "deces", color: "var(--teal-500)" },
  { type: "simulation", color: "var(--amber-600)" },
  { type: "acompte", color: "var(--petrol-600)" },
];

/**
 * Firm-wide statistics, matching the mockup's admin "Statistiques" artboard:
 * processed / in-progress counts and the period's revenue, the status strip,
 * and the per-prestation breakdown — all scoped to the chosen period and
 * spanning every dossier, as opposed to the per-agent admin home.
 */
export default async function AdminStatsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  // Both roles reach this screen, as the reference's sidebar shows. Only the
  // super admin sees the per-administrator breakdown below.
  await requireRole(["admin", "super_admin"]);
  const viewer = await getCurrentUser();
  const isSuperAdmin = viewer?.role === "super_admin";

  const [{ periode }, years, { t, locale }] = await Promise.all([
    searchParams,
    listTaxYears(),
    getT(),
  ]);

  const options = await listPeriodOptions(years);
  const selected = resolvePeriod(options, periode);

  const [stats, counts, perAdmin, free] = await Promise.all([
    getAdminDashboardStats(selected),
    countDossiersByService(selected),
    getPerAdminStats(selected),
    countFreeDossiersByService(selected),
  ]);

  const serviceLabels = Object.fromEntries(
    SERVICE_TYPES.map((svc) => [svc, serviceLabel(t, svc)]),
  );
  const statusTotal = STATUS_ORDER.reduce((a, s) => a + stats.byStatus[s], 0);

  const money = new Intl.NumberFormat(locale === "fr" ? "fr-CH" : "en-CH", {
    maximumFractionDigits: 0,
  });

  const prestations = STATS_PRESTATIONS.map((p) => ({
    label: serviceLabel(t, p.type),
    count: counts[p.type] ?? 0,
    color: p.color,
  }));
  const maxPrestation = Math.max(1, ...prestations.map((p) => p.count));

  return (
    <div className="max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.admin.stats.title}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">{t.admin.stats.sub}</p>
        </div>

        <PeriodPicker years={options} current={selected} />
      </div>

      <section className="mt-[22px] grid gap-3.5 sm:grid-cols-3">
        <StatCard
          label={t.admin.stats.processed}
          value={stats.completedDossiers}
          hint={t.admin.stats.processedSub}
        />
        <StatCard
          label={t.admin.stats.inProgress}
          value={stats.inProgressDossiers}
          hint={t.admin.stats.inProgressSub}
        />
        <StatCard
          label={t.admin.stats.revenue}
          value={`CHF ${money.format(stats.revenueChf)}`}
          hint={t.admin.stats.revenueSub}
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

      {isSuperAdmin ? (
        <AdminStatCards admins={perAdmin} labels={serviceLabels} free={free} />
      ) : null}
    </div>
  );
}
