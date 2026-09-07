"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { ServiceType } from "@/lib/serviceTypes";

/**
 * The mockup's "Nouvelle demande →" action. Creates the dossier for the chosen
 * period, then goes straight to it — there is nothing to fill in on this screen,
 * so a year picker plus a button is the whole flow.
 */
export function NewRequestForm({
  t,
  serviceType,
  years,
}: {
  t: Messages;
  serviceType: ServiceType;
  years: number[];
}) {
  const router = useRouter();

  const [year, setYear] = useState(() => years[0]?.toString() ?? "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (years.length === 0) {
    return (
      <p className="max-w-[280px] text-[13px] leading-[1.5] text-muted">
        {t.portal.prestation.noPeriod}
      </p>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taxYear: Number(year), serviceType }),
      });

      const body = await res.json();

      if (!body.ok) {
        setError(t.portal.prestation.requestFailed);
        setLoading(false);
        return;
      }

      router.push(`/portal/dossiers/${body.dossier.id}`);
    } catch {
      setError(t.portal.prestation.requestFailed);
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex flex-col gap-[7px]">
          <span className="fx-field-label m-0">
            {t.portal.prestation.yearLabel}
          </span>

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

        <button type="submit" disabled={loading} className="fx-btn-send h-[46px]">
          {loading
            ? t.portal.prestation.creating
            : `${t.portal.prestation.newRequest} →`}
        </button>
      </div>

      {error ? (
        <span role="alert" className="text-[13px] text-[#A2443A]">
          {error}
        </span>
      ) : null}
    </form>
  );
}
