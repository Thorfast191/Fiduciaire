"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";
import type { DossierStatus } from "@/db/schema";

/**
 * The reference's three-way status control for a module prestation:
 * "À traiter / En traitement / Traité", as a row of buttons rather than a
 * dropdown.
 *
 * Those three map onto our dossier statuses — a module dossier has no document
 * round-trip, so `submitted`, `in_review` and `completed` are the only states
 * it ever reaches. Any other status (a legacy `not_started`, say) leaves all
 * three unselected rather than mislabelling itself.
 */
const STEPS: { key: "todo" | "doing" | "done"; status: DossierStatus }[] = [
  { key: "todo", status: "submitted" },
  { key: "doing", status: "in_review" },
  { key: "done", status: "completed" },
];

export default function ModuleStatusButtons({
  dossierId,
  status,
}: {
  dossierId: string;
  status: DossierStatus;
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function set(next: DossierStatus) {
    if (next === status) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/dossiers/${dossierId}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) {
        setError(t.admin.detail.errAction);
        return;
      }
      router.refresh();
    } catch {
      setError(t.common.genericError);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((step) => {
          const active = step.status === status;
          return (
            <button
              key={step.key}
              type="button"
              disabled={busy}
              aria-pressed={active}
              onClick={() => set(step.status)}
              className={`inline-flex items-center gap-2 rounded-[9px] border-[1.5px] px-[13px] py-2 text-[13px] font-semibold transition disabled:opacity-60 ${
                active
                  ? "border-brand bg-teal-100 text-[#145863]"
                  : "border-line-default bg-card text-body hover:bg-sunken"
              }`}
            >
              <span
                aria-hidden
                className={`h-[7px] w-[7px] rounded-full ${
                  active ? "bg-brand" : "bg-[#CBD3DE]"
                }`}
              />
              {t.admin.detail.moduleStatus[step.key]}
            </button>
          );
        })}
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-red-600">
          {error}
        </p>
      ) : null}
    </>
  );
}
