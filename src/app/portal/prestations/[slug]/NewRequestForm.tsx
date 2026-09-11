"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";
import type { ServiceType } from "@/lib/serviceTypes";

/**
 * The mockup's "Nouvelle prestation →" action (`startNewCapital` et al.): a
 * single accented button that opens a fresh request straight away — no year
 * pop-up. The dossier is created for the open period and then shown in place on
 * the same prestation URL (`?d=<id>`), so the sidebar stays on this prestation.
 */
export function NewRequestForm({
  t,
  slug,
  serviceType,
  years,
  accent,
  accentHover,
}: {
  t: Messages;
  slug: string;
  serviceType: ServiceType;
  years: number[];
  accent: string;
  accentHover: string;
}) {
  const router = useRouter();
  const p = t.portal.prestation;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  async function onClick() {
    if (loading) return;
    if (years.length === 0) {
      setError(p.noPeriod);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Newest open period; the request's details are filled on the form that
        // opens next.
        body: JSON.stringify({ taxYear: years[0], serviceType }),
      });
      const body = await res.json();
      if (!body.ok) {
        setError(p.requestFailed);
        setLoading(false);
        return;
      }
      router.push(`/portal/prestations/${slug}?d=${body.dossier.id}`);
    } catch {
      setError(p.requestFailed);
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
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

      {error ? (
        <span
          role="alert"
          className="max-w-[240px] text-right text-[13px] text-[#A2443A]"
        >
          {error}
        </span>
      ) : null}
    </div>
  );
}
