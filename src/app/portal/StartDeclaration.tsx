"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";

/**
 * "Commencer ma déclaration" — the mockup's self-serve start. When the client
 * has no declaration yet for the open period, this opens one for that year and
 * goes straight into the questionnaire, the same POST the other prestations use.
 */
export function StartDeclaration({
  t,
  year,
}: {
  t: Messages;
  year: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/dossiers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taxYear: year, serviceType: "declaration" }),
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
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={start}
        disabled={loading}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-xl bg-brand px-[22px] py-3 text-[15px] font-semibold text-white transition-colors hover:bg-brand-hover disabled:opacity-70"
      >
        {loading ? t.portal.declStarting : `${t.portal.declStart} →`}
      </button>

      {error ? (
        <span role="alert" className="text-[13px] text-[#A2443A]">
          {error}
        </span>
      ) : null}
    </div>
  );
}
