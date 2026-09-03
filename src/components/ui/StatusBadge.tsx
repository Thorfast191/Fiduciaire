"use client";

import type { DossierStatus } from "@/db/schema";
import { useT } from "@/lib/i18n/I18nProvider";

export const STATUS_ORDER: DossierStatus[] = [
  "not_started",
  "submitted",
  "in_review",
  "completed",
];

export const STATUS_CLASS: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started-soft text-status-not-started",
  submitted: "bg-status-submitted-soft text-status-submitted",
  in_review: "bg-status-in-review-soft text-status-in-review",
  completed: "bg-status-completed-soft text-status-completed",
};

export function StatusBadge({ status }: { status: DossierStatus }) {
  const t = useT();

  const cls = STATUS_CLASS[status] ?? STATUS_CLASS.not_started;
  const label = t.status[status] ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
