import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { listDossiersForClient } from "@/lib/dossiers";
import { listActiveTaxPeriodYears } from "@/lib/taxPeriods";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { getT } from "@/lib/i18n";
import {
  CLIENT_CREATABLE,
  SLUG_TO_SERVICE,
  serviceDescription,
  serviceLabel,
} from "@/lib/serviceTypes";
import { NewRequestForm } from "./NewRequestForm";

/**
 * One prestation's requests, matching the mockup's list mode for capital,
 * simulation, acomptes and relecture (`Fiduvia.dc.html:2349`): a header with a
 * "nouvelle demande" action, then the client's existing requests for that
 * prestation.
 *
 * Opening a request creates the dossier and drops the client into the ordinary
 * dossier detail screen, where documents are uploaded and the file submitted.
 */
export default async function PrestationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [{ slug }, user, { t }] = await Promise.all([
    params,
    getCurrentUser(),
    getT(),
  ]);

  const serviceType = SLUG_TO_SERVICE[slug];
  // `declaration` has its own home at /portal, so it is not addressable here.
  if (!serviceType || !CLIENT_CREATABLE.includes(serviceType)) notFound();

  const [dossiers, activeYears] = await Promise.all([
    user ? listDossiersForClient(user.id, serviceType) : Promise.resolve([]),
    listActiveTaxPeriodYears(),
  ]);

  // A year the client already has a request for cannot be requested twice —
  // `(client, year, service)` is unique, so offering it would be a dead option.
  const taken = new Set(dossiers.map((d) => d.taxYear));
  const openYears = activeYears.filter((y) => !taken.has(y));

  return (
    <div className="max-w-[1000px]">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-[560px]">
          <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
            {serviceLabel(t, serviceType)}
          </h1>

          <p className="mt-1.5 text-[15px] leading-[1.55] text-muted">
            {serviceDescription(t, serviceType)}
          </p>
        </div>

        <NewRequestForm
          t={t}
          serviceType={serviceType}
          years={openYears}
        />
      </div>

      <div className="mt-7 flex flex-col gap-2">
        {dossiers.length === 0 ? (
          <p className="rounded-[var(--radius-md)] border border-line bg-card px-5 py-6 text-[14px] text-muted">
            {t.portal.prestation.noItems}
          </p>
        ) : (
          dossiers.map((dossier) => (
            <Link
              key={dossier.id}
              href={`/portal/dossiers/${dossier.id}`}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-line bg-card px-5 py-4 transition hover:border-line-strong"
            >
              <span className="flex flex-col">
                <span className="disp text-[17px] font-bold">
                  {t.portal.prestation.itemLabel} {dossier.taxYear}
                </span>

                <span className="mt-0.5 text-[13px] text-muted">
                  {serviceLabel(t, serviceType)}
                </span>
              </span>

              <span className="flex items-center gap-4">
                <StatusBadge status={dossier.status} />

                <span className="text-[14px] font-semibold text-brand">
                  {t.portal.prestation.open} →
                </span>
              </span>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
