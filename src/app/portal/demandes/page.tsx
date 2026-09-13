import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { getT } from "@/lib/i18n";
import { listDossiersForClient } from "@/lib/dossiers";
import { listDocumentsForDossier } from "@/lib/documents";
import { listNotificationsForDossier } from "@/lib/notifications";
import { documentTitle } from "@/lib/documentTitle";
import { serviceLabel } from "@/lib/serviceTypes";
import RequestedDocuments, {
  type RequestedItem,
} from "../dossiers/[id]/RequestedDocuments";

/**
 * Everything the firm is waiting on, in one place.
 *
 * The upload slots already live on each dossier, but a client with a
 * declaration and two prestations had to open each one to find out whether
 * anything was outstanding. This gathers every open request across their
 * dossiers so the sidebar can answer "what do they still need from me?".
 */
export default async function RequestedDocumentsPage() {
  const [user, { t }] = await Promise.all([getCurrentUser(), getT()]);
  const dossiers = user ? await listDossiersForClient(user.id) : [];

  const groups = await Promise.all(
    dossiers.map(async (dossier) => {
      const [notifications, documents] = await Promise.all([
        listNotificationsForDossier(dossier.id),
        listDocumentsForDossier(dossier.id),
      ]);

      const deposited = new Map<string, { id: string; filename: string }>(
        documents.map((doc) => [
          doc.category,
          { id: doc.id, filename: doc.filename },
        ]),
      );

      const items: RequestedItem[] = [];
      const seen = new Set<string>();
      for (const n of notifications) {
        const req = n.requestedDocuments;
        if (!req) continue;
        for (const category of req.categories) {
          if (seen.has(category)) continue;
          seen.add(category);
          items.push({
            category,
            title: documentTitle(t, category),
            doc: deposited.get(category) ?? null,
            freeText: false,
          });
        }
        for (const label of req.custom) {
          if (seen.has(`custom:${label}`)) continue;
          seen.add(`custom:${label}`);
          items.push({
            category: "divers",
            title: label,
            doc: deposited.get("divers") ?? null,
            freeText: true,
          });
        }
      }

      return { dossier, items };
    }),
  );

  const withRequests = groups.filter((g) => g.items.length > 0);
  const outstanding = withRequests.reduce(
    (n, g) => n + g.items.filter((i) => !i.doc).length,
    0,
  );

  return (
    <div className="max-w-[1000px]">
      <h1 className="disp text-[clamp(28px,3.4vw,34px)] font-extrabold leading-[1.05]">
        {t.portal.requestsTitle}
      </h1>

      <p className="mt-1.5 max-w-[620px] text-[15px] text-muted">
        {outstanding > 0
          ? t.portal.requestsSub.replace("{count}", String(outstanding))
          : t.portal.requestsNoneSub}
      </p>

      {withRequests.length === 0 ? (
        <div className="mt-6 rounded-[var(--radius-md)] border border-line bg-card px-6 py-10 text-center">
          <p className="text-[15px] font-semibold text-strong">
            {t.portal.requestsEmptyTitle}
          </p>
          <p className="mx-auto mt-1.5 max-w-[46ch] text-[14px] leading-[1.55] text-muted">
            {t.portal.requestsEmptyBody}
          </p>
        </div>
      ) : (
        withRequests.map(({ dossier, items }) => (
          <div key={dossier.id} className="mt-2">
            <div className="mt-6 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="disp text-[18px] font-bold text-strong">
                {serviceLabel(t, dossier.serviceType)} {dossier.taxYear}
              </h2>
              <Link
                href={`/portal/dossiers/${dossier.id}`}
                className="text-[13px] font-semibold text-brand underline underline-offset-2 hover:text-brand-hover"
              >
                {t.portal.requestsOpenDossier}
              </Link>
            </div>

            <RequestedDocuments dossierId={dossier.id} items={items} />
          </div>
        ))
      )}
    </div>
  );
}
