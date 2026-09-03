import Link from "next/link";
import { listAllDossiersWithClient, listTaxYears } from "@/lib/dossiers";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import DossiersTable from "./DossiersTable";
import DossierAdminForms from "../DossierAdminForms";

/**
 * Tax-return dossiers for one period, reached from the prestation hub — the
 * mockup's "Déclarations d'impôts" table (`Fiduvia.dc.html:3049`).
 */
export default async function AdminDeclarationsPage({
  searchParams,
}: {
  searchParams: Promise<{ periode?: string }>;
}) {
  const [{ periode }, years, { t }] = await Promise.all([
    searchParams,
    listTaxYears(),
    getT(),
  ]);

  const options = await listPeriodOptions(years);
  const selected = resolvePeriod(options, periode);

  const rows = await listAllDossiersWithClient({ taxYear: selected });

  return (
    <div className="max-w-[1040px]">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-strong"
      >
        ← {t.admin.backHome}
      </Link>

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.admin.hub.declarations}
          </h1>

          <p className="mt-1.5 text-[15px] text-muted">
            {t.admin.dossiers.sub}
          </p>
        </div>

        <PeriodPicker years={options} current={selected} />
      </div>

      <DossiersTable
        rows={rows.map((r) => ({
          id: r.id,
          taxYear: r.taxYear,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
        }))}
      />

      <DossierAdminForms />
    </div>
  );
}
