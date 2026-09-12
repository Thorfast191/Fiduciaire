import Link from "next/link";
import { notFound } from "next/navigation";
import { listAllDossiersWithClient, listTaxYears } from "@/lib/dossiers";
import { getCurrentUser } from "@/lib/auth/guards";
import { listAdminAccounts } from "@/lib/adminUsers";
import { PeriodPicker } from "@/components/shell/PeriodPicker";
import { getT } from "@/lib/i18n";
import { resolvePeriod } from "@/lib/adminPeriod";
import { listPeriodOptions } from "@/lib/taxPeriods";
import DossiersTable from "./DossiersTable";
import DossierAdminForms from "../DossierAdminForms";
import { SLUG_TO_SERVICE, serviceDescription } from "@/lib/serviceTypes";

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
  const [{ slug }, { periode }, years, user, { t }] = await Promise.all([
    params,
    searchParams,
    listTaxYears(),
    getCurrentUser(),
    getT(),
  ]);

  const serviceType = SLUG_TO_SERVICE[slug];
  if (!serviceType) notFound();

  const options = await listPeriodOptions(years);
  const selected = resolvePeriod(options, periode);

  const isSuper = user?.role === "super_admin";

  // The reference gives the four "module" prestations no period selector: they
  // list every year at once, filtered only by who reserved them. The
  // declaration, departure and décès lists stay scoped to one period.
  const isModule =
    serviceType === "simulation" ||
    serviceType === "acompte" ||
    serviceType === "relecture" ||
    serviceType === "capital";

  const rows = await listAllDossiersWithClient({
    taxYear: isModule ? undefined : selected,
    serviceType,
    // Ordinary admins only see dossiers assigned to them.
    reservedBy: isSuper ? undefined : user?.id,
  });

  // The super admin assigns dossiers to admins from the table, so it needs the
  // roster; ordinary admins get an empty list (they only self-claim).
  const assignableAdmins = isSuper
    ? (await listAdminAccounts()).map((a) => ({
        id: a.id,
        name: `${a.firstName} ${a.lastName}`.trim(),
      }))
    : [];

  return (
    <div className="max-w-[1040px]">
      <Link
        href={`/admin/dossiers?periode=${selected}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted transition-colors hover:text-strong"
      >
        ← {t.admin.backHome}
      </Link>

      <div className="mt-2.5 flex flex-wrap items-end justify-between gap-5">
        <div>
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {t.admin.dossiers.listTitles[serviceType]}
          </h1>

          {!isModule ? (
            <p className="mt-1.5 max-w-[560px] text-[15px] text-muted">
              {serviceType === "declaration"
                ? t.admin.dossiers.sub
                : serviceDescription(t, serviceType)}
            </p>
          ) : null}
        </div>

        {!isModule ? <PeriodPicker years={options} current={selected} /> : null}
      </div>

      <DossiersTable
        slug={slug}
        serviceType={serviceType}
        currentAdminId={user?.id ?? ""}
        isSuperAdmin={isSuper}
        assignableAdmins={assignableAdmins}
        rows={rows.map((r) => ({
          id: r.id,
          taxYear: r.taxYear,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          firstName: r.firstName,
          lastName: r.lastName,
          email: r.email,
          documentCount: r.documentCount,
          reservedBy: r.reservedBy,
          reservedByName: r.reservedByName,
          canton: r.canton,
          express: r.express,
          situation: r.situation,
        }))}
      />

      {serviceType === "declaration" ? <DossierAdminForms /> : null}
    </div>
  );
}
