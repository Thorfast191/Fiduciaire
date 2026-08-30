"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DossierItem {
  id: string;
  taxYear: number;
  status: "not_started" | "submitted" | "in_review" | "completed";
}

const STATUS_LABELS: Record<DossierItem["status"], string> = {
  not_started: "Non commencé",
  submitted: "Soumis",
  in_review: "En cours de traitement",
  completed: "Terminé",
};

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
    <section style={{ marginTop: 40 }}>
      <h2>Mes dossiers fiscaux</h2>
      {dossiers.length === 0 && <p>Aucun dossier pour le moment.</p>}
      <ul>
        {dossiers.map((dossier) => (
          <li key={dossier.id}>
            <Link href={`/portal/dossiers/${dossier.id}`}>
              Dossier {dossier.taxYear} — {STATUS_LABELS[dossier.status]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
