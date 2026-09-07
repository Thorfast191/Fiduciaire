"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Messages } from "@/lib/i18n/messages/fr";
import { SITUATIONS, type Situation } from "@/lib/declaration";

const ICON: Record<Situation, string> = {
  standard: "M20 6 9 17l-5-5",
  arrivee: "M22 2 11 13M22 2l-7 20-4-9-9-4z",
  taxation_office: "M6 3h9l3 3v15H6zM14 3v4h4M9 12h6M9 16h4",
  deces: "M12 21s-7-4.5-7-9a4 4 0 0 1 7-2.6A4 4 0 0 1 19 12c0 4.5-7 9-7 9z",
  depart: "M2 12h14l-3-4m3 4-3 4M18 4v16",
};

/**
 * "Une de ces situations s'est-elle produite…" (`Fiduvia.dc.html:4042`), shown
 * over the questionnaire. Picking a situation changes which questions and which
 * supporting documents the declaration asks for, so it is asked up front rather
 * than buried in the form.
 */
export function SituationPicker({
  t,
  dossierId,
  taxYear,
  current,
}: {
  t: Messages;
  dossierId: string;
  taxYear: number;
  current: Situation;
}) {
  const router = useRouter();
  const s = t.declaration.situations;
  const [saving, setSaving] = useState(false);

  async function choose(situation: Situation) {
    setSaving(true);
    try {
      // Read-modify-write: the endpoint takes the whole answers object, and
      // only this one field is changing.
      const res = await fetch(`/api/dossiers/${dossierId}`);
      const body = await res.json();
      const answers = { ...(body.dossier?.answers ?? {}), situation };

      await fetch(`/api/dossiers/${dossierId}/answers`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      close();
    } finally {
      setSaving(false);
    }
  }

  function close() {
    router.replace(`/portal/dossiers/${dossierId}`);
    router.refresh();
  }

  // "Standard" is offered last, after the special cases, as in the mockup.
  const choices: Situation[] = [
    ...SITUATIONS.filter((k) => k !== "standard"),
    "standard",
  ];

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      className="fixed inset-0 z-[95] flex animate-[fadeBg_.18s_ease] items-start justify-center overflow-y-auto bg-[rgba(13,21,38,.55)] p-6 backdrop-blur-[3px]"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="situation-title"
        className="my-auto w-full max-w-[620px] animate-[popIn_.22s_ease] rounded-[var(--radius-xl)] bg-card px-8 py-[34px] shadow-[0_40px_90px_-30px_rgba(11,32,48,.6)]"
      >
        <h2
          id="situation-title"
          className="disp m-0 text-[24px] font-extrabold leading-[1.15]"
        >
          {s.title.replace("{year}", String(taxYear))}
        </h2>

        <p className="mt-2 text-[14.5px] leading-[1.5] text-muted">{s.sub}</p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {choices.map((key) => {
            const active = current === key;
            return (
              <button
                key={key}
                type="button"
                disabled={saving}
                onClick={() => choose(key)}
                className={`flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-4 text-left transition-colors disabled:opacity-60 ${
                  active
                    ? "border-brand bg-teal-100/60"
                    : "border-line bg-card hover:border-teal-300"
                }`}
              >
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[9px] bg-teal-100 text-brand">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-[17px] w-[17px]"
                    aria-hidden="true"
                  >
                    <path d={ICON[key]} />
                  </svg>
                </span>

                <span className="text-[15px] font-semibold text-strong">
                  {s[key]}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={close}
          className="fx-btn-send mt-5 w-full"
        >
          {s.none}
        </button>
      </div>
    </div>
  );
}
