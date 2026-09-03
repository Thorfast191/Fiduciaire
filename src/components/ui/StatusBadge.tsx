"use client";

import type { DossierStatus } from "@/db/schema";
import { STATUS_CLASS } from "@/lib/dossierStatus";
import { useT } from "@/lib/i18n/I18nProvider";

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
