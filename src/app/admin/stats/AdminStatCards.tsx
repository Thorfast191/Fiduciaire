"use client";

import { useMemo, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

interface AdminCard {
  id: string;
  name: string;
  initials: string;
  total: number;
  revenueChf: number;
  byService: Record<string, number>;
}

/** The prestations shown on each card, in the mockup's order. */
const CARD_SERVICES = [
  "declaration",
  "capital",
  "simulation",
  "acompte",
] as const;

/**
 * The mockup's Statistiques agent cards: one summary card per administrator
 * (reserved dossiers, revenue, per-prestation split). Clicking a card opens a
 * modal with that admin's full breakdown.
 */
export default function AdminStatCards({
  admins,
  labels,
}: {
  admins: AdminCard[];
  /** Service-type → display label, for every prestation. */
  labels: Record<string, string>;
}) {
  const { locale, t } = useI18n();
  const [open, setOpen] = useState<AdminCard | null>(null);

  const money = useMemo(
    () =>
      new Intl.NumberFormat(locale === "fr" ? "fr-CH" : "en-CH", {
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  return (
    <section className="mt-4">
      <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-muted">
        {t.admin.stats.perAdminTitle}
      </span>

      <div className="mt-3.5 grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
        {admins.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setOpen(a)}
            className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-line bg-card p-[18px] text-left shadow-[var(--shadow-xs)] transition-colors hover:border-teal-300 hover:shadow-[var(--shadow-sm)]"
          >
            <span className="flex items-center gap-[11px]">
              <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-petrol-900 text-[12.5px] font-bold text-white">
                {a.initials}
              </span>
              <span className="disp text-[17px] font-bold text-strong">
                {a.name}
              </span>
            </span>

            <span className="flex items-baseline gap-1.5">
              <span className="fx-figure text-[26px] font-extrabold text-brand">
                {a.total}
              </span>
              <span className="text-[12.5px] text-muted">
                {t.admin.stats.perAdminFiles} · CHF {money.format(a.revenueChf)}
              </span>
            </span>

            <span className="flex flex-col gap-1">
              {CARD_SERVICES.map((svc) => (
                <span
                  key={svc}
                  className="flex justify-between gap-2.5 text-[13px] text-body"
                >
                  <span>{labels[svc]}</span>
                  <span className="font-bold">{a.byService[svc] ?? 0}</span>
                </span>
              ))}
            </span>

            <span className="text-[12.5px] font-bold text-brand">
              {t.admin.stats.perAdminView} →
            </span>
          </button>
        ))}
      </div>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(13,21,38,0.5)] p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setOpen(null)}
        >
          <div
            className="w-full max-w-[460px] rounded-[20px] bg-card p-7 shadow-[0_40px_90px_-30px_rgba(13,21,38,0.6)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-petrol-900 text-[15px] font-bold text-white">
                {open.initials}
              </span>
              <div>
                <h2 className="disp text-[20px] font-bold text-strong">
                  {open.name}
                </h2>
                <p className="text-[13px] text-muted">
                  {open.total} {t.admin.stats.perAdminFiles} · CHF{" "}
                  {money.format(open.revenueChf)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {Object.keys(labels).map((svc) => (
                <div
                  key={svc}
                  className="flex justify-between gap-3 border-b border-line pb-2 text-[14px] text-body last:border-0 last:pb-0"
                >
                  <span>{labels[svc]}</span>
                  <span className="fx-figure font-bold">
                    {open.byService[svc] ?? 0}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setOpen(null)}
              className="mt-6 w-full rounded-[11px] bg-brand px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-hover"
            >
              {t.common.close}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
