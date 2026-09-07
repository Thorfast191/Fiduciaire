import Link from "next/link";
import { notFound } from "next/navigation";
import { listAllDossiersWithClient, listTaxYears } from "@/lib/dossiers";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import DossiersTable from "./DossiersTable";
import DossierAdminForms from "../DossierAdminForms";
import {
  SLUG_TO_SERVICE,
  serviceDescription,
  serviceLabel,
} from "@/lib/serviceTypes";

/**
 * One prestation's dossiers for one period, reached from the hub — the mockup's
 * "Déclarations d'impôts" table (`Fiduvia.dc.html:3049`), now serving every
 * service type rather than declarations alone.
 */
export default async function AdminPrestationPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ periode?: string }>;
}) {
  const [{ slug }, { periode }, years, { t }] = await Promise.all([
    params,
    searchParams,
    listTaxYears(),
    getT(),
  ]);

  const serviceType = SLUG_TO_SERVICE[slug];
  if (!serviceType) notFound();

  const options = await listPeriodOptions(years);
  const selected = resolvePeriod(options, periode);

  const rows = await listAllDossiersWithClient({
    taxYear: selected,
    serviceType,
  });

  return (
    <div className="max-w-[1040px]">
      <Link
        href={`/admin/dossiers?periode=${selected}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-strong"
      >
        ← {t.admin.hub.title}
      </Link>

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {serviceLabel(t, serviceType)}
          </h1>

          <p className="mt-1.5 max-w-[560px] text-[15px] text-muted">
            {serviceType === "declaration"
              ? t.admin.dossiers.sub
              : serviceDescription(t, serviceType)}
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

      {serviceType === "declaration" ? <DossierAdminForms /> : null}
    </div>
  );
}
