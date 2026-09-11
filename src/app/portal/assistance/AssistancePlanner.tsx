"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";
import {
  ASSISTANCE_OPTIONS,
  assistanceTotal,
  type AssistanceKey,
} from "@/lib/declaration";

interface ActivePlan {
  taxYear: number;
  services: string[];
  totalChf: number;
}

export function AssistancePlanner({
  t,
  years,
  subscriptions,
}: {
  t: Messages;
  years: number[];
  subscriptions: ActivePlan[];
}) {
  const router = useRouter();
  const a = t.assistance;

  // Default to the current year when it is offered, not the newest in the list.
  const defaultYear =
    (years.includes(new Date().getFullYear())
      ? new Date().getFullYear()
      : years[0]) ?? 0;
  const [year, setYear] = useState(() => defaultYear.toString());
  const [selected, setSelected] = useState<
    Partial<Record<AssistanceKey, boolean>>
  >(() => {
    const existing = subscriptions.find((s) => s.taxYear === defaultYear);
    return Object.fromEntries((existing?.services ?? []).map((s) => [s, true]));
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const total = assistanceTotal(selected);

  /**
   * Ticking the bundle clears the individual options, and ticking enough
   * individual options is the bundle — nobody should pay more for the parts
   * than for the whole.
   */
  function toggle(key: AssistanceKey) {
    setSelected((current) => {
      if (key === "ensemble") {
        return current.ensemble ? {} : { ensemble: true };
      }
      const next = { ...current, [key]: !current[key] };
      delete next.ensemble;
      return assistanceTotal(next) >= 75 ? { ensemble: true } : next;
    });
  }

  function switchYear(next: string) {
    setYear(next);
    const existing = subscriptions.find((s) => s.taxYear === Number(next));
    setSelected(
      Object.fromEntries((existing?.services ?? []).map((s) => [s, true])),
    );
  }

  async function subscribe() {
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/assistance", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          taxYear: Number(year),
          services: Object.keys(selected).filter(
            (k) => selected[k as AssistanceKey],
          ),
        }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(a.failed);
        setSaving(false);
        return;
      }
      router.refresh();
      setSaving(false);
    } catch {
      setError(a.failed);
      setSaving(false);
    }
  }

  if (years.length === 0) {
    return (
      <p className="mt-7 rounded-[var(--radius-md)] border border-line bg-card px-5 py-6 text-[14px] text-muted">
        {a.noPeriod}
      </p>
    );
  }

  return (
    <div className="mt-7 flex flex-wrap items-start gap-4">
      <section className="min-w-[320px] flex-[1.4] rounded-[var(--radius-lg)] border border-line bg-card p-7 shadow-[var(--shadow-sm)]">
        <span className="fx-eyebrow text-[var(--text-muted)]">
          {a.planLabel}
        </span>

        <h2 className="disp mt-1.5 text-[24px] font-extrabold">
          {a.planTitle}
        </h2>

        <p className="mt-1 text-[14px] text-muted">{a.planSub}</p>

        <div className="my-5 h-px bg-line" />

        <label className="flex flex-col gap-[7px]">
          <span className="fx-field-label m-0">{a.periodLabel}</span>
          <select
            value={year}
            onChange={(e) => switchYear(e.target.value)}
            className="fx-field-input h-[46px] max-w-[190px] py-0"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <p className="mt-5 text-[13.5px] text-muted">{a.chooseServices}</p>

        <div className="mt-2 flex flex-col">
          {ASSISTANCE_OPTIONS.map((option) => {
            const on = !!selected[option.key];
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => toggle(option.key)}
                aria-pressed={on}
                className={`flex items-center justify-between gap-4 border-t border-line py-3.5 text-left transition-colors ${
                  on ? "text-strong" : "text-body hover:text-strong"
                }`}
              >
                <span className="flex items-center gap-3">
                  <span
                    className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[5px] border text-[11px] font-bold ${
                      on
                        ? "border-brand bg-brand text-white"
                        : "border-line-strong bg-card text-transparent"
                    }`}
                  >
                    ✓
                  </span>
                  <span className="text-[15px]">
                    {a.options[option.key]}
                  </span>
                </span>

                <span className="fx-figure shrink-0 text-[13px] text-muted">
                  + CHF {option.price}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4 border-t border-line pt-5">
          <div>
            <span className="fx-eyebrow text-[var(--text-muted)]">
              {a.totalLabel} · {year}
            </span>
            <div
              className="fx-figure mt-1 text-[30px] font-extrabold leading-none"
              style={{ color: "var(--brand)" }}
            >
              CHF {total}
            </div>
          </div>

          <button
            type="button"
            onClick={subscribe}
            disabled={saving || total === 0}
            className="fx-btn-send"
          >
            {saving
              ? a.subscribing
              : a.subscribe.replace("{year}", year) + " →"}
          </button>
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-[13px] text-[#A2443A]">
            {error}
          </p>
        ) : null}
      </section>

      <div className="flex min-w-[260px] flex-1 flex-col gap-4">
        <section className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
          <span className="fx-eyebrow text-[var(--text-muted)]">
            {a.howTitle}
          </span>

          <ol className="mt-4 flex flex-col gap-3.5">
            {[a.how1, a.how2, a.how3].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span
                  className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-petrol-800 text-[12px] font-bold text-white"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {i + 1}
                </span>
                <span className="text-[13.5px] leading-[1.45] text-body">
                  {step}
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-line bg-card p-6 shadow-[var(--shadow-xs)]">
          <span className="fx-eyebrow text-[var(--text-muted)]">
            {a.activeTitle}
          </span>

          {subscriptions.length === 0 ? (
            <p className="mt-3 text-[13.5px] text-muted">{a.activeNone}</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-2.5">
              {subscriptions.map((s) => (
                <li
                  key={s.taxYear}
                  className="flex items-center justify-between gap-3 text-[13.5px]"
                >
                  <span className="text-body">
                    {a.activeFor.replace("{year}", String(s.taxYear))}
                  </span>
                  <span className="fx-figure font-semibold text-strong">
                    CHF {s.totalChf}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
