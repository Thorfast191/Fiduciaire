import Link from "next/link";
import { getT } from "@/lib/i18n";
import DossierDetail from "./DossierDetail";
import { CapitalForm } from "./CapitalForm";
import {
  SimulationForm,
  AcomptesForm,
  RelectureForm,
} from "./PrestationForms";
import NotificationBanner from "./NotificationBanner";
import { listNotificationsForDossier } from "@/lib/notifications";
import { getAccessibleDossier } from "@/lib/dossiers";
import { getCurrentUser } from "@/lib/auth/guards";
import { SERVICE_SLUG, serviceLabel } from "@/lib/serviceTypes";
import { normaliseAnswers } from "@/lib/declaration";
import { listDocumentsForDossier } from "@/lib/documents";
import { listDossiersForClient } from "@/lib/dossiers";
import { Questionnaire } from "@/components/declaration/Questionnaire";
import { SituationPicker } from "@/components/declaration/SituationPicker";

/**
 * Rendered inside the portal shell, so it carries no header or footer of its
 * own — it previously repeated the brand mark, an "Espace client" caption and
 * a hardcoded "FC" avatar, which showed a second header inside the sidebar
 * layout.
 */
export default async function DossierDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ situation?: string }>;
}) {
  const [{ id }, { situation: showSituation }, user, { t }] = await Promise.all([
    params,
    searchParams,
    getCurrentUser(),
    getT(),
  ]);

  // Only surface notifications once the dossier is confirmed to be this
  // client's, so an id from elsewhere reveals nothing.
  const access = user
    ? await getAccessibleDossier(id, { id: user.id, role: user.role })
    : { ok: false as const };

  const notifications = access.ok
    ? (await listNotificationsForDossier(id)).filter((n) => !n.acknowledgedAt)
    : [];

  // Name the prestation this dossier belongs to, and send "back" to the list it
  // was opened from rather than always to the declarations home.
  const serviceType = access.ok ? access.dossier.serviceType : "declaration";
  const backHref =
    serviceType === "declaration"
      ? "/portal"
      : `/portal/prestations/${SERVICE_SLUG[serviceType]}`;

  // A tax declaration is the seven-page questionnaire; every other prestation
  // keeps the simpler upload-and-submit screen.
  if (access.ok && serviceType === "declaration") {
    const [documents, siblings] = await Promise.all([
      listDocumentsForDossier(id),
      user ? listDossiersForClient(user.id, "declaration") : Promise.resolve([]),
    ]);

    const answers = normaliseAnswers(access.dossier.answers);
    const previous = siblings
      .map((row) => row.taxYear)
      .filter((year) => year < access.dossier.taxYear)
      .sort((a, b) => b - a)[0];

    return (
      <>
        {showSituation ? (
          <SituationPicker
            t={t}
            dossierId={id}
            taxYear={access.dossier.taxYear}
            current={answers.situation}
          />
        ) : null}

        <Questionnaire
          t={t}
          dossierId={id}
          taxYear={access.dossier.taxYear}
          status={access.dossier.status}
          initialAnswers={answers}
          initialStep={access.dossier.currentStep}
          uploadedDocs={documents.map((doc) => ({
            id: doc.id,
            category: doc.category,
            filename: doc.filename,
          }))}
          previousYear={previous}
        />
      </>
    );
  }

  return (
    <div className="max-w-[1000px]">
      <Link
        href={backHref}
        className="inline-flex items-center gap-2 text-[12px] font-medium text-muted transition hover:text-strong"
      >
        <svg
          viewBox="0 0 20 20"
          fill="none"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path
            d="M12.5 4.5 7 10l5.5 5.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {t.portal.dossierBack}
      </Link>

      <div className="mt-5">
        <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
          {serviceType === "declaration"
            ? t.portal.dossierTitle
            : serviceLabel(t, serviceType)}
        </h1>

        <p className="mt-1.5 max-w-[600px] text-[15px] text-muted">
          {t.portal.dossierSub}
        </p>
      </div>

      <NotificationBanner
        dossierId={id}
        notifications={notifications.map((n) => ({
          id: n.id,
          kind: n.kind,
          message: n.message,
          createdAt: n.createdAt.toISOString(),
        }))}
      />

      <div className="mt-6">
        {access.ok && serviceType === "capital" ? (
          <CapitalForm dossierId={id} taxYear={access.dossier.taxYear} />
        ) : access.ok && serviceType === "simulation" ? (
          <SimulationForm dossierId={id} taxYear={access.dossier.taxYear} />
        ) : access.ok && serviceType === "acompte" ? (
          <AcomptesForm dossierId={id} taxYear={access.dossier.taxYear} />
        ) : access.ok && serviceType === "relecture" ? (
          <RelectureForm dossierId={id} taxYear={access.dossier.taxYear} />
        ) : (
          <DossierDetail dossierId={id} />
        )}
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] border border-line bg-card p-[18px] shadow-[var(--shadow-xs)]">
        <div className="flex gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-brand">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-[17px] w-[17px]"
              aria-hidden="true"
            >
              <rect x="4" y="10" width="16" height="10" rx="2" />
              <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
          </div>

          <div>
            <p className="text-[13px] font-medium text-strong">
              {t.portal.dossierSecureTitle}
            </p>

            <p className="mt-1 text-[12.5px] leading-[1.4] text-muted">
              {t.portal.dossierSecureBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
