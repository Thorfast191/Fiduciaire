"use client";

import { useState } from "react";
import Link from "next/link";
import type { Messages } from "@/lib/i18n/messages/fr";
import {
  ASSISTANCE_OPTIONS,
  assistanceTotal,
  type AssistanceKey,
} from "@/lib/declaration";

/**
 * The hero tariff simulator, matching the mockup's estimator
 * (`Fiduvia.dc.html`): état civil and professional situation, then an
 * expandable list of supplements and Fiduvia-assistance options, with the total
 * updating live. The figures are the client's own — base 80 / 120 / 250,
 * student 25, and the supplement and assistance prices from the tariff.
 */

/** Indices into `t.sim.proOptions`: 0 = "Étudiant / apprenti", 4 = "Indépendant·e". */
const STUDENT_INDEX = 0;
const SELF_EMPLOYED_INDEX = 4;

/** Supplements, in the mockup's order; labels/notes come from `t.sim.supplements`. */
const SUPPLEMENTS = [
  { key: "proprietaire", amount: 75 },
  { key: "titres", amount: 30 },
  { key: "heritage", amount: 25 },
  { key: "express", amount: 50 },
  { key: "taxationOffice", amount: 75 },
] as const;
type SuppKey = (typeof SUPPLEMENTS)[number]["key"];

export function PriceSimulator({ t }: { t: Messages }) {
  const [couple, setCouple] = useState<boolean | null>(null);
  const [proIndex, setProIndex] = useState<number | null>(null);
  const [supp, setSupp] = useState<Record<SuppKey, boolean>>({
    proprietaire: false,
    titres: false,
    heritage: false,
    express: false,
    taxationOffice: false,
  });
  const [assist, setAssist] = useState<Partial<Record<AssistanceKey, boolean>>>(
    {},
  );
  const [expanded, setExpanded] = useState(false);

  // Base: student and self-employed have their own price and replace the
  // marital-status base; a bare marital status gives 80 / 120; nothing yet, 0.
  const base =
    proIndex === SELF_EMPLOYED_INDEX
      ? 250
      : proIndex === STUDENT_INDEX
        ? 25
        : couple === true
          ? 120
          : couple === false
            ? 80
            : 0;

  const suppTotal = SUPPLEMENTS.reduce(
    (s, x) => s + (supp[x.key] ? x.amount : 0),
    0,
  );
  const total = base + suppTotal + assistanceTotal(assist);
  const empty = total === 0;

  const s = t.sim;
  const civilNote = couple ? "CHF 120" : "CHF 80";
  const proNote = (i: number) =>
    i === STUDENT_INDEX ? "CHF 25" : i === SELF_EMPLOYED_INDEX ? "CHF 250" : "";

  return (
    <div className="mt-5">
      {/* État civil */}
      <Section title={s.maritalStatus}>
        <Radio
          name="civil"
          checked={couple === false}
          label={s.single}
          note={couple === false ? "CHF 80" : ""}
          onChange={() => setCouple(false)}
        />
        <Radio
          name="civil"
          checked={couple === true}
          label={s.couple}
          note={couple === true ? "CHF 120" : ""}
          onChange={() => setCouple(true)}
        />
      </Section>

      <Divider />

      {/* Situation professionnelle */}
      <Section title={s.proSituation}>
        {s.proOptions.map((label, i) => (
          <Radio
            key={label}
            name="pro"
            checked={proIndex === i}
            label={label}
            note={proIndex === i ? proNote(i) : ""}
            onChange={() => setProIndex(i)}
          />
        ))}
      </Section>

      {expanded ? (
        <>
          <Divider />
          <Section title={s.supplementsTitle}>
            {SUPPLEMENTS.map((sup, i) => (
              <Check
                key={sup.key}
                checked={supp[sup.key]}
                label={s.supplements[i].label}
                note={s.supplements[i].note}
                onChange={() =>
                  setSupp((v) => ({ ...v, [sup.key]: !v[sup.key] }))
                }
              />
            ))}
          </Section>

          <Divider />

          <Section title={s.assistanceTitle}>
            {ASSISTANCE_OPTIONS.map((o) => (
              <Check
                key={o.key}
                checked={!!assist[o.key]}
                label={t.assistance.options[o.key]}
                note={`+ CHF ${o.price}`}
                onChange={() =>
                  setAssist((a) => ({ ...a, [o.key]: !a[o.key] }))
                }
              />
            ))}
          </Section>
        </>
      ) : null}

      {/* Expand / collapse */}
      <div className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-center">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="text-[13px] font-semibold"
          style={{ color: "var(--brand)" }}
        >
          {expanded ? `${s.collapse} ▲` : `${s.expand} ▾`}
        </button>
      </div>

      {/* Total + CTA */}
      <div className="mt-2 border-t border-[var(--border-subtle)] pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="font-[var(--font-mono)] text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--text-muted)]">
              {s.total}
            </p>
            <p className="mt-1 text-[30px] font-semibold tracking-[-0.03em] text-[var(--petrol-900)]">
              {empty ? "CHF —" : `CHF ${total}`}
            </p>
          </div>

          <Link
            href="/signup"
            className="shrink-0 rounded-[10px] bg-[var(--brand)] px-5 py-3 text-[13px] font-semibold transition hover:bg-[var(--brand-hover)]"
            style={{ color: "#fff" }}
          >
            {s.create}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-[15px] font-bold text-[var(--petrol-900)]">
        {title}
      </p>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="my-3 h-px bg-[var(--border-subtle)]" />;
}

function Radio({
  name,
  checked,
  label,
  note,
  onChange,
}: {
  name: string;
  checked: boolean;
  label: string;
  note: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[11px] py-[6px]">
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border-2 transition-colors"
        style={{ borderColor: checked ? "var(--brand)" : "var(--border-default)" }}
      >
        {checked ? (
          <span
            className="h-[8px] w-[8px] rounded-full"
            style={{ background: "var(--brand)" }}
          />
        ) : null}
      </span>
      <span
        className="text-[14.5px] leading-[1.2]"
        style={{
          color: checked ? "var(--text-strong)" : "var(--text-body)",
          fontWeight: checked ? 600 : 400,
        }}
      >
        {label}
      </span>
      {note ? (
        <span
          className="ml-auto whitespace-nowrap font-[var(--font-mono)] text-[11px] font-bold"
          style={{ color: "var(--text-strong)" }}
        >
          {note}
        </span>
      ) : null}
    </label>
  );
}

function Check({
  checked,
  label,
  note,
  onChange,
}: {
  checked: boolean;
  label: string;
  note: string;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-[11px] py-[6px]">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="sr-only"
      />
      <span
        className="flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[5px] border-2 transition-colors"
        style={{
          borderColor: checked ? "var(--brand)" : "var(--border-default)",
          background: checked ? "var(--brand)" : "transparent",
        }}
      >
        {checked ? (
          <span className="text-[11px] font-bold leading-none text-white">✓</span>
        ) : null}
      </span>
      <span
        className="text-[14.5px] leading-[1.2]"
        style={{
          color: checked ? "var(--text-strong)" : "var(--text-body)",
          fontWeight: checked ? 600 : 400,
        }}
      >
        {label}
      </span>
      <span
        className="ml-auto whitespace-nowrap font-[var(--font-mono)] text-[11px]"
        style={{
          color: checked ? "var(--text-strong)" : "var(--text-muted)",
          fontWeight: checked ? 700 : 400,
        }}
      >
        {note}
      </span>
    </label>
  );
}
