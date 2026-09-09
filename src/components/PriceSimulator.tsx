"use client";

import { useState } from "react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";

/**
 * Starting prices, taken verbatim from the client's own published tariff cards
 * in the mockup (`Fiduvia.dc.html`, `tarifsCards`): Personne seule CHF 80,
 * Marié·e / couple CHF 120, Indépendant·e CHF 250.
 *
 * Nothing here is invented — the simulator quotes the same figures the pricing
 * section already shows, and the result is labelled indicative because
 * supplements are settled when the dossier is opened.
 */
const BASE_SINGLE = 80;
const BASE_COUPLE = 120;
const BASE_SELF_EMPLOYED = 250;
const BASE_STUDENT = 25;

/** Indices into `t.sim.proOptions`: 0 is "Étudiant / apprenti", 4 is "Indépendant·e". */
const STUDENT_INDEX = 0;
const SELF_EMPLOYED_INDEX = 4;

export function PriceSimulator({ t }: { t: Messages }) {
  const [couple, setCouple] = useState<boolean | null>(null);
  const [proIndex, setProIndex] = useState<number | null>(null);
  const [expanded, setExpanded] = useState(false);

  const base = couple === null ? null : couple ? BASE_COUPLE : BASE_SINGLE;

  // Self-employment and student/apprentice are each priced on their own card
  // rather than as a supplement, so they replace the marital-status base.
  const total =
    proIndex === SELF_EMPLOYED_INDEX
      ? BASE_SELF_EMPLOYED
      : proIndex === STUDENT_INDEX
        ? BASE_STUDENT
        : base;

  return (
    <div className="mt-5">
      {/* ÉTAT CIVIL */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--petrol-800)]">
          {t.sim.maritalStatus}
        </p>

        {[
          [false, t.sim.single],
          [true, t.sim.couple],
        ].map(([value, label]) => (
          <label
            key={String(value)}
            className="flex cursor-pointer items-center gap-2 py-[5px] text-[13px] text-[var(--petrol-900)]"
          >
            <input
              type="radio"
              name="civil"
              checked={couple === value}
              onChange={() => setCouple(value as boolean)}
              className="h-[17px] w-[17px] accent-[var(--brand)]"
            />
            {label as string}
          </label>
        ))}
      </div>

      <div className="my-3 h-px bg-[var(--border-subtle)]" />

      {/* SITUATION PROFESSIONNELLE */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--petrol-800)]">
          {t.sim.proSituation}
        </p>

        {t.sim.proOptions.map((item, i) => (
          <label
            key={item}
            className="flex cursor-pointer items-center gap-2 py-[5px] text-[13px] text-[var(--petrol-900)]"
          >
            <input
              type="radio"
              name="professional"
              checked={proIndex === i}
              onChange={() => setProIndex(i)}
              className="h-[17px] w-[17px] accent-[var(--brand)]"
            />
            {item}
          </label>
        ))}
      </div>

      <div className="mt-4 border-t border-[var(--border-subtle)] pt-4 text-center">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="text-[12px] font-semibold text-[var(--brand)]"
        >
          {expanded ? `${t.sim.breakdown} ⌃` : `${t.sim.expand}⌄`}
        </button>

        {expanded ? (
          <div className="mt-3 rounded-[10px] bg-[var(--sand-100)] px-4 py-3 text-left">
            {total === null ? (
              <p className="text-[12px] text-[var(--text-muted)]">
                {t.sim.pickHint}
              </p>
            ) : (
              <p className="flex items-center justify-between text-[12.5px] text-[var(--text-body)]">
                <span>{t.sim.baseLabel}</span>
                <span className="fx-figure font-semibold">CHF {total}</span>
              </p>
            )}

            <p className="mt-2 text-[11px] leading-[1.5] text-[var(--text-muted)]">
              {t.sim.indicative}
            </p>
          </div>
        ) : null}
      </div>

      <div className="mt-4 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {t.sim.total}
            </p>

            <p className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[var(--petrol-900)]">
              {total === null ? (
                "CHF —"
              ) : (
                <>
                  <span className="text-[15px] font-medium text-[var(--text-muted)]">
                    {t.sim.fromPrefix}{" "}
                  </span>
                  CHF {total}
                </>
              )}
            </p>
          </div>

          <Link
            href="/signup"
            className="shrink-0 rounded-[10px] bg-[var(--brand)] px-5 py-3 text-[13px] font-semibold text-white transition hover:bg-[var(--brand-hover)]"
          >
            {t.sim.create}
          </Link>
        </div>
      </div>
    </div>
  );
}
