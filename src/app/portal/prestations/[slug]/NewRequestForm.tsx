"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { ServiceType } from "@/lib/serviceTypes";

/**
 * The mockup's "Nouvelle prestation →" action (`startNewCapital` et al.): a
 * single accented button in the hero card. There is nothing to fill in on this
 * screen, so the click creates the dossier and goes straight to it.
 *
 * The mockup picks the year on the draft screen that follows; here the dossier
 * carries its year, so when exactly one period is open the button creates it
 * outright, and only reveals a small year picker when several are open.
 */
export function NewRequestForm({
  t,
  serviceType,
  years,
  accent,
  accentHover,
}: {
  t: Messages;
  serviceType: ServiceType;
  years: number[];
  accent: string;
  accentHover: string;
}) {
  const router = useRouter();
  const p = t.portal.prestation;

  const [year, setYear] = useState(() => years[0]?.toString() ?? "");
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  async function create(taxYear: number) {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taxYear, serviceType }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(p.requestFailed);
        setLoading(false);
        return;
      }
      router.push(`/portal/dossiers/${body.dossier.id}`);
    } catch {
      setError(p.requestFailed);
      setLoading(false);
    }
  }

  function onClick() {
    if (loading) return;
    if (years.length === 0) {
      setError(p.noPeriod);
      return;
    }
    if (years.length === 1) {
      void create(years[0]);
      return;
    }
    setPicking((v) => !v);
  }

  return (
    <div className="relative flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={loading}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="cursor-pointer whitespace-nowrap rounded-xl px-[22px] py-3 text-[15px] font-semibold text-white transition-colors disabled:opacity-70"
        style={{ background: hover ? accentHover : accent }}
      >
        {loading ? p.creating : `${p.newRequest} →`}
      </button>

      {picking ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-10 flex items-end gap-2 rounded-[var(--radius-md)] border border-line bg-card p-3 shadow-[var(--shadow-md)]">
          <label className="flex flex-col gap-[7px]">
            <span className="fx-field-label m-0">{p.yearLabel}</span>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="fx-field-input h-[46px] py-0"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={() => void create(Number(year))}
            disabled={loading}
            className="h-[46px] whitespace-nowrap rounded-xl px-[18px] text-[15px] font-semibold text-white"
            style={{ background: accent }}
          >
            {loading ? p.creating : p.newRequest}
          </button>
        </div>
      ) : null}

      {error ? (
        <span role="alert" className="max-w-[240px] text-right text-[13px] text-[#A2443A]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
