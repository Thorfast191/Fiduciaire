import Link from "next/link";
import { countAllDossiers, listTaxYears } from "@/lib/dossiers";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import type { Messages } from "@/lib/i18n/messages/fr";

/** The mockup's `aPalette` (`Fiduvia.dc.html:2966`). */
const PALETTE = [
  "var(--brand)",
  "var(--petrol-800)",
  "var(--green-600)",
  "var(--teal-500)",
  "var(--amber-600)",
];

function cards(t: Messages, declarations: number) {
  const h = t.admin.hub;

  return [
    {
      label: h.declarations,
      desc: h.declarationsDesc,
      count: declarations,
      href: "/admin/dossiers/declarations",
      glyph: "M4 6h5l2 2h9v10H4z",
    },
    { label: h.capital, desc: h.capitalDesc, count: 0, glyph: "M4 8h16v11H4z" },
    {
      label: h.simulations,
      desc: h.simulationsDesc,
      count: 0,
      glyph: "M5 19V9m5 10V5m5 14v-7m5 7V8",
    },
    {
      label: h.instalments,
      desc: h.instalmentsDesc,
      count: 0,
      glyph: "M4 6h16v14H4zM4 10h16M9 3v4M15 3v4",
    },
    {
      label: h.reviews,
      desc: h.reviewsDesc,
      count: 0,
      glyph: "M6 4h9l4 4v12H6zM14 4v5h5M9 14h6",
    },
  ];
}

/**
 * Prestation hub, matching the mockup's admin "Dossiers" artboard
 * (`Fiduvia.dc.html:2933`): one card per service, each showing its live count
 * and drilling into its own table. Only tax returns exist on this platform, so
 * the other four are present but not clickable.
 */
export default async function AdminDossiersHubPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const [{ periode }, years, { t }] = await Promise.all([
    searchParams,
    listTaxYears(),
    getT(),
  ]);

  const options = await listPeriodOptions(years);
  const selected = resolvePeriod(options, periode);
  const declarations = await countAllDossiers(selected);

  return (
    <div className="max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.admin.hub.title}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">{t.admin.hub.sub}</p>
        </div>

        <PeriodPicker years={options} current={selected} />
      </div>

      <div className="mt-[22px] grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {cards(t, declarations).map((card, i) => {
          const body = (
            <>
              <div className="flex items-center gap-[11px]">
                <span
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-white"
                  style={{ background: PALETTE[i % PALETTE.length] }}
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[19px] w-[19px]"
                    aria-hidden="true"
                  >
                    <path d={card.glyph} />
                  </svg>
                </span>

                <span className="disp text-[18px] font-bold leading-[1.05]">
                  {card.label}
                </span>
              </div>

              <p className="text-[12.5px] leading-[1.4] text-muted">
                {card.desc}
              </p>

              <p className="mt-0.5 flex items-baseline gap-1.5">
                <span className="fx-figure text-[24px] font-extrabold text-brand">
                  {card.count}
                </span>
                <span className="text-[12px] text-muted">
                  {t.admin.hub.active}
                </span>
              </p>
            </>
          );

          const cls =
            "flex flex-col gap-2.5 rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]";

          return card.href ? (
            <Link
              key={card.label}
              href={`${card.href}?periode=${selected}`}
              className={`${cls} transition-colors hover:border-teal-300 hover:shadow-[var(--shadow-sm)]`}
            >
              {body}
            </Link>
          ) : (
            <div
              key={card.label}
              title={t.common.comingSoonTitle}
              className={`${cls} cursor-not-allowed opacity-55`}
            >
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}
