import type { DossierStatus } from "@/db/schema";

export const STATUS_LABELS: Record<DossierStatus, string> = {
  not_started: "Non commencé",
  submitted: "Soumis",
  in_review: "En cours de traitement",
  completed: "Terminé",
};

const STATUS_CLASS: Record<DossierStatus, string> = {
  not_started: "bg-status-not-started-soft text-status-not-started",
  submitted: "bg-status-submitted-soft text-status-submitted",
  in_review: "bg-status-in-review-soft text-status-in-review",
  completed: "bg-status-completed-soft text-status-completed",
};

export function StatusBadge({ status }: { status: DossierStatus }) {
  const cls = STATUS_CLASS[status] ?? STATUS_CLASS.not_started;
  const label = STATUS_LABELS[status] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}
