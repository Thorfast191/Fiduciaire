import Link from "next/link";
import type { ReactNode } from "react";
import { countDossiersByService, listTaxYears } from "@/lib/dossiers";
import { getCurrentUser } from "@/lib/auth/guards";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import { SERVICE_SLUG, type ServiceType } from "@/lib/serviceTypes";
import type { Messages } from "@/lib/i18n/messages/fr";
import DistributeButton from "./DistributeButton";

type I18nHub = Messages["admin"]["hub"];

/**
 * The prestations the mockup's admin "Dossiers" artboard cards, in its order,
 * with its per-service icon and colour. Departure and death exist as dossier
 * types (and still have their own tables by URL) but the mockup does not card
 * them here, so neither do we.
 */
const CARDS: { type: ServiceType; color: string; icon: ReactNode }[] = [
  {
    type: "declaration",
    color: "var(--brand)",
    icon: (
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    ),
  },
  {
    type: "capital",
    color: "var(--petrol-800)",
    icon: (
      <>
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
      </>
    ),
  },
  {
    type: "simulation",
    color: "var(--green-600)",
    icon: (
      <>
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </>
    ),
  },
  {
    type: "acompte",
    color: "var(--teal-500)",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    type: "relecture",
    color: "var(--amber-600)",
    icon: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5" />
        <path d="M14 2v6h6" />
        <circle cx="16.5" cy="16.5" r="3.5" />
        <line x1="19.2" y1="19.2" x2="21.5" y2="21.5" />
      </>
    ),
  },
];

/** The title/description i18n key for each carded prestation. */
const COPY: Record<
  ServiceType,
  { title: keyof I18nHub; desc: keyof I18nHub } | undefined
> = {
  declaration: { title: "declarations", desc: "declarationsDesc" },
  capital: { title: "capital", desc: "capitalDesc" },
  simulation: { title: "simulations", desc: "simulationsDesc" },
  acompte: { title: "instalments", desc: "instalmentsDesc" },
  relecture: { title: "reviews", desc: "reviewsDesc" },
  departure: undefined,
  deces: undefined,
};

/**
 * Prestation hub, matching the mockup's admin "Dossiers" artboard: one card per
 * service, each showing its live count for the selected period and drilling into
 * its own table. The super admin also gets "Distribution automatique", which
 * spreads the unclaimed dossiers across the team.
 */
export default async function AdminDossiersHubPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const [{ periode }, years, user, { t }] = await Promise.all([
    searchParams,
    listTaxYears(),
    getCurrentUser(),
    getT(),
  ]);

  const options = await listPeriodOptions(years);
  const selected = resolvePeriod(options, periode);
  // An ordinary admin only sees the dossiers assigned to them; the super admin
  // sees the whole firm.
  const scope = user?.role === "super_admin" ? undefined : user?.id;
  const counts = await countDossiersByService(selected, scope);

  return (
    <div className="max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.admin.hub.title}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">{t.admin.hub.sub}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <PeriodPicker years={options} current={selected} />
          {user?.role === "super_admin" ? (
            <DistributeButton periode={selected} />
          ) : null}
        </div>
      </div>

      <div className="mt-[22px] grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => {
          const copy = COPY[card.type];
          if (!copy) return null;

          return (
            <Link
              key={card.type}
              href={`/admin/dossiers/${SERVICE_SLUG[card.type]}?periode=${selected}`}
              className="flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)] transition-colors hover:border-teal-300 hover:shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-center gap-[11px]">
                <span
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-white"
                  style={{ background: card.color }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[23px] w-[23px]"
                    aria-hidden="true"
                  >
                    {card.icon}
                  </svg>
                </span>

                <span className="disp text-[18px] font-bold leading-[1.05]">
                  {t.admin.hub[copy.title]}
                </span>
              </div>

              <p className="text-[12.5px] leading-[1.4] text-muted">
                {t.admin.hub[copy.desc]}
              </p>

              <p className="mt-0.5 flex items-baseline gap-1.5">
                <span className="fx-figure text-[24px] font-extrabold text-brand">
                  {counts[card.type] ?? 0}
                </span>
                <span className="text-[12px] text-muted">
                  {t.admin.hub.active}
                </span>
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
