import { countAllDossiers, listAllDossiersWithClient } from "@/lib/dossiers";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getT } from "@/lib/i18n";
import DossierAdminForms from "./DossierAdminForms";

/**
 * Admin dossiers, matching the mockup's dossier table (`Fiduvia.dc.html:3049`):
 * a bordered card with an uppercase header row and one row per dossier carrying
 * an initials avatar above the client's name and email. The mockup's "Réservé
 * par" and "Canton" columns are dropped — this platform has neither.
 */
export default async function AdminDossiersPage() {
  const [rows, total, { locale, t }] = await Promise.all([
    listAllDossiersWithClient(),
    countAllDossiers(),
    getT(),
  ]);

  const dateFmt = new Intl.DateTimeFormat(locale === "fr" ? "fr-CH" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="max-w-[1040px]">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.admin.dossiers.title}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">
            {t.admin.dossiers.sub}
          </p>
        </div>

        <span className="inline-flex items-center gap-2 rounded-full border border-line-default bg-card px-4 py-2.5 text-[14px] font-semibold text-strong">
          {total}{" "}
          {total > 1 ? t.admin.dossiers.countPlural : t.admin.dossiers.count}
        </span>
      </div>

      {/* Table */}
      <div className="mt-[22px] overflow-x-auto">
        <div className="min-w-[720px] rounded-2xl border border-line bg-card">
          <div className="flex items-center gap-3.5 border-b border-line px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.05em] text-muted">
            <span className="min-w-0 flex-1">{t.admin.dossiers.thClient}</span>
            <span className="w-[190px] shrink-0">
              {t.admin.dossiers.thStatus}
            </span>
            <span className="w-[110px] shrink-0">
              {t.admin.dossiers.thYear}
            </span>
            <span className="w-[110px] shrink-0">
              {t.admin.dossiers.thCreated}
            </span>
          </div>

          {rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-muted">
              {t.admin.dossiers.empty}
            </p>
          ) : (
            rows.map((r) => (
              <div
                key={r.id}
                className="flex items-center gap-3.5 border-b border-line px-5 py-3.5 last:border-b-0 hover:bg-sunken/50"
              >
                <span className="flex min-w-0 flex-1 items-center gap-[11px]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[12px] font-bold text-brand">
                    {(r.firstName[0] ?? "") + (r.lastName[0] ?? "")}
                  </span>

                  <span className="flex min-w-0 flex-col">
                    <span className="truncate text-[14.5px] font-semibold text-strong">
                      {r.firstName} {r.lastName}
                    </span>
                    <span className="truncate text-[12.5px] text-muted">
                      {r.email}
                    </span>
                  </span>
                </span>

                <span className="w-[190px] shrink-0">
                  <StatusBadge status={r.status} />
                </span>

                <span className="fx-figure w-[110px] shrink-0 text-[14px] text-body">
                  {r.taxYear}
                </span>

                <span className="fx-figure w-[110px] shrink-0 text-[13px] text-muted">
                  {dateFmt.format(r.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {total > rows.length && (
        <p className="mt-3 text-[12.5px] text-muted">
          {t.admin.dossiers.recentOf
            .replace("{n}", String(rows.length))
            .replace("{total}", String(total))}
        </p>
      )}

      <DossierAdminForms />
    </div>
  );
}
