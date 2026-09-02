"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DossierStatus } from "@/db/schema";
import { StatusBadge } from "@/components/ui/StatusBadge";

interface DossierItem {
  id: string;
  taxYear: number;
  status: DossierStatus;
}

export default function DossierList() {
  const [dossiers, setDossiers] = useState<DossierItem[]>([]);

  useEffect(() => {
    async function loadDossiers() {
      const res = await fetch("/api/dossiers");
      if (!res.ok) return;
      const body = await res.json();
      setDossiers(body.dossiers ?? []);
    }
    loadDossiers();
  }, []);

  return (
    <section>
      {dossiers.length === 0 && (
        <p className="text-[13px] text-muted">Aucun dossier pour le moment.</p>
      )}

      <ul className="flex flex-col gap-2">
        {dossiers.map((dossier) => (
          <li key={dossier.id}>
            <Link
              href={`/portal/dossiers/${dossier.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-card px-4 py-3 transition hover:border-line-strong hover:bg-sunken"
            >
              <span className="text-[14px] font-medium text-strong">
                Dossier {dossier.taxYear}
              </span>
              <StatusBadge status={dossier.status} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
