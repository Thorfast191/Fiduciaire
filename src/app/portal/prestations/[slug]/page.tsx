import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/auth/guards";
import { listDossiersForClient, getAccessibleDossier } from "@/lib/dossiers";
import { listActiveTaxPeriodYears } from "@/lib/taxPeriods";
import { CapitalForm } from "../../dossiers/[id]/CapitalForm";
import {
  SimulationForm,
  AcomptesForm,
  RelectureForm,
} from "../../dossiers/[id]/PrestationForms";
import { getT } from "@/lib/i18n";
import type { DossierStatus } from "@/db/schema";
import type { Messages } from "@/lib/i18n/messages/fr";
import {
  CLIENT_CREATABLE,
  SLUG_TO_SERVICE,
  serviceDescription,
  serviceLabel,
  type ServiceType,
} from "@/lib/serviceTypes";
import { NewRequestForm } from "./NewRequestForm";
import { DeleteDossierButton } from "./DeleteDossierButton";

/**
 * One prestation's requests, transcribed from the mockup's "list mode"
 * (`Fiduvia.dc.html:2349` capital, `2560` simulation, `2680` acomptes, `2758`
 * relecture): a single hero card carrying the icon, a "N dossier" eyebrow, the
 * title, the blurb and the "nouvelle demande" action — then the client's
 * existing requests as compact rows below.
 *
 * Opening a request drops the client into the dossier detail screen, where the
 * documents are uploaded and the file submitted.
 */

// Each prestation carries its own accent in the mockup; the icon, its tint and
// the button colour all follow from it.
type Theme = { accent: string; accentHover: string; iconBg: string };
const THEME: Partial<Record<ServiceType, Theme>> = {
  capital: { accent: "#1B6E7E", accentHover: "#145863", iconBg: "#D9EFEC" },
  simulation: { accent: "#1F8A5B", accentHover: "#186F49", iconBg: "#E6F6EE" },
  acompte: { accent: "#B26A00", accentHover: "#8E5500", iconBg: "#FBEFE3" },
  relecture: { accent: "#1B6E7E", accentHover: "#145863", iconBg: "#D9EFEC" },
};

// The mockup's per-prestation glyphs (`ICONS.bag/chart/calendar/review`),
// drawn on a 24-box at 22px so they sit centred in the 46px tile.
function serviceIcon(type: ServiceType): ReactNode {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  switch (type) {
    case "simulation":
      return (
        <svg {...common}>
          <line x1="18" y1="20" x2="18" y2="10" />
          <line x1="12" y1="20" x2="12" y2="4" />
          <line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      );
    case "acompte":
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "relecture":
      return (
        <svg {...common}>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5" />
          <path d="M14 2v6h6" />
          <circle cx="16.5" cy="16.5" r="3.5" />
          <line x1="19.2" y1="19.2" x2="21.5" y2="21.5" />
        </svg>
      );
    default:
      // capital (and any fallback): the briefcase.
      return (
        <svg {...common}>
          <rect x="2" y="7" width="20" height="14" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      );
  }
}

// The mockup collapses six workflow states to three badges: a draft that has
// not been transmitted, a file in the firm's hands, and a closed one.
function statusBadge(status: DossierStatus, t: Messages) {
  const p = t.portal.prestation;
  if (status === "completed") {
    return { label: p.statusClosed, bg: "#D9EFEC", color: "#145863" };
  }
  if (status === "not_started") {
    return { label: p.statusDraft, bg: "#F0F2F6", color: "#8A93A1" };
  }
  return { label: p.statusTransmitted, bg: "#F0E9FB", color: "#7A4FC0" };
}

// The two-letter canton code the mockup rows show, from the full name we store.
const CANTON_CODE: Record<string, string> = {
  Vaud: "VD",
  Valais: "VS",
  Fribourg: "FR",
};

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

// Title and subtitle for one row, transcribed per prestation from the mockup's
// item builders (`Fiduvia.dc.html:6768` capital, `6791` simu, `6828` aco,
// `6842` rel): capital leads with the year, the others lead with the label and
// carry a "context · label" line.
function rowText(
  t: Messages,
  serviceType: ServiceType,
  taxYear: number,
  answers: unknown,
): { title: string; sub: string } {
  const p = t.portal.prestation;
  const a = (answers ?? {}) as Record<string, unknown>;
  const canton = CANTON_CODE[str(a.canton)] || "—";

  switch (serviceType) {
    case "simulation":
      return { title: p.itemSimulation, sub: `${canton} · ${p.itemSimulation}` };
    case "acompte":
      return { title: p.itemAcompte, sub: `${canton} · ${p.itemAcompte}` };
    case "relecture": {
      const situation =
        str(a.relSituation) === "couple"
          ? t.relectureForm.couple
          : t.relectureForm.seule;
      return { title: p.itemRelecture, sub: `${taxYear} · ${situation}` };
    }
    default:
      // capital: the year leads, the label sits beneath.
      return { title: String(taxYear), sub: p.itemCapital };
  }
}

// The bespoke form for an opened request, rendered in place on the prestation
// page (the declaration keeps its own home at /portal).
function PrestationForm({
  serviceType,
  dossierId,
  taxYear,
}: {
  serviceType: ServiceType;
  dossierId: string;
  taxYear: number;
}) {
  switch (serviceType) {
    case "simulation":
      return <SimulationForm dossierId={dossierId} taxYear={taxYear} />;
    case "acompte":
      return <AcomptesForm dossierId={dossierId} taxYear={taxYear} />;
    case "relecture":
      return <RelectureForm dossierId={dossierId} taxYear={taxYear} />;
    default:
      return <CapitalForm dossierId={dossierId} taxYear={taxYear} />;
  }
}

export default async function PrestationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ d?: string }>;
}) {
  const [{ slug }, { d }, user, { t }] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
    getT(),
  ]);

  const serviceType = SLUG_TO_SERVICE[slug];
  // `declaration` is client-creatable but has its own home at /portal, so it is
  // not addressable through the generic prestation list.
  if (
    !serviceType ||
    serviceType === "declaration" ||
    !CLIENT_CREATABLE.includes(serviceType)
  ) {
    notFound();
  }

  // A request is opened in place (?d=<id>), as in the mockup, so the URL — and
  // therefore the sidebar's active prestation — stays put. Only this client's
  // own request of this prestation renders; anything else falls back to the list.
  if (d && user) {
    const access = await getAccessibleDossier(d, {
      id: user.id,
      role: user.role,
    });
    if (access.ok && access.dossier.serviceType === serviceType) {
      return (
        <div className="max-w-[920px]">
          <Link
            href={`/portal/prestations/${slug}`}
            className="mb-3 inline-flex items-center gap-[7px] text-[14px] font-semibold text-body transition-colors hover:text-brand"
          >
            ← {serviceLabel(t, serviceType)}
          </Link>
          <PrestationForm
            serviceType={serviceType}
            dossierId={access.dossier.id}
            taxYear={access.dossier.taxYear}
          />
        </div>
      );
    }
  }

  const [dossiers, activeYears] = await Promise.all([
    user ? listDossiersForClient(user.id, serviceType) : Promise.resolve([]),
    listActiveTaxPeriodYears(),
  ]);

  // A year the client already has a request for cannot be requested twice —
  // `(client, year, service)` is unique, so offering it would be a dead option.
  const taken = new Set(dossiers.map((d) => d.taxYear));
  const openYears = activeYears.filter((y) => !taken.has(y));

  // Only the four creatable prestations reach here; capital is the fallback.
  const theme = THEME[serviceType] ?? THEME.capital!;
  const p = t.portal.prestation;
  const count = dossiers.length;
  const eyebrow =
    count === 0
      ? p.countNone
      : `${count} ${count > 1 ? p.countMany : p.countOne}`;

  return (
    <div className="max-w-[920px]">
      {/* Hero card — icon, count eyebrow, title, blurb and the new-request action */}
      <div
        className="flex flex-wrap items-center gap-6 rounded-[var(--radius-lg)] border border-line bg-card p-[24px_26px] shadow-[var(--shadow-md)]"
      >
        <span
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl"
          style={{ background: theme.iconBg, color: theme.accent }}
        >
          {serviceIcon(serviceType)}
        </span>

        <div className="min-w-[220px] flex-1">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.1em]"
            style={{ color: theme.accent }}
          >
            {eyebrow}
          </span>

          <div className="disp mt-[5px] text-[24px] font-bold">
            {serviceLabel(t, serviceType)}
          </div>

          <p className="mt-[3px] max-w-[52ch] text-[13.5px] text-muted">
            {serviceDescription(t, serviceType)}
          </p>
        </div>

        <NewRequestForm
          t={t}
          slug={slug}
          serviceType={serviceType}
          years={openYears}
          accent={theme.accent}
          accentHover={theme.accentHover}
        />
      </div>

      {/* Existing requests */}
      {count === 0 ? (
        <p className="mt-[18px] text-[14.5px] text-[#8B97A8]">{p.noItems}</p>
      ) : (
        <div className="mt-5 flex max-w-[520px] flex-col gap-3">
          {dossiers.map((dossier) => {
            const badge = statusBadge(dossier.status, t);
            const { title, sub } = rowText(
              t,
              serviceType,
              dossier.taxYear,
              dossier.answers,
            );
            const isCapital = serviceType === "capital";
            // A draft (never submitted) can be removed, as in the mockup —
            // the trash sits beside the open link so a click on it never
            // navigates.
            const deletable = dossier.status === "not_started";
            return (
              <div
                key={dossier.id}
                className="flex items-center gap-[10px] rounded-[14px] border border-[#E7EAEF] bg-card py-3 pl-5 pr-3.5 transition-[border-color,box-shadow] focus-within:border-[#79C5BD] hover:border-[#79C5BD] hover:shadow-[0_16px_36px_-26px_rgba(27,110,126,0.5)]"
              >
                <Link
                  href={`/portal/prestations/${slug}?d=${dossier.id}`}
                  className="flex min-w-0 flex-1 items-center gap-[14px]"
                >
                  <span
                    className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-xl"
                    style={{ background: theme.iconBg, color: theme.accent }}
                  >
                    {serviceIcon(serviceType)}
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span
                      className={`font-bold text-strong ${
                        isCapital ? "text-[17px]" : "text-[16px]"
                      }`}
                    >
                      {title}
                    </span>
                    <span className="text-[12.5px] text-[#8B97A8]">{sub}</span>
                  </span>

                  <span
                    className={`shrink-0 whitespace-nowrap rounded-full font-bold ${
                      isCapital
                        ? "px-[10px] py-[3px] text-[11.5px]"
                        : "px-2 py-[3px] text-[11px]"
                    }`}
                    style={{ background: badge.bg, color: badge.color }}
                  >
                    {badge.label}
                  </span>

                  <span className="shrink-0 text-[18px] text-[#9AA6B6]">→</span>
                </Link>

                {deletable ? (
                  <DeleteDossierButton
                    t={t}
                    dossierId={dossier.id}
                    title={p.deleteAction}
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
