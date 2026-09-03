import Link from "next/link";
import { getT } from "@/lib/i18n";
import DossierDetail from "./DossierDetail";
import NotificationBanner from "./NotificationBanner";
import { listNotificationsForDossier } from "@/lib/notifications";
import { getAccessibleDossier } from "@/lib/dossiers";
import { getCurrentUser } from "@/lib/auth/guards";

/**
 * Rendered inside the portal shell, so it carries no header or footer of its
 * own — it previously repeated the brand mark, an "Espace client" caption and
 * a hardcoded "FC" avatar, which showed a second header inside the sidebar
 * layout.
 */
export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [{ id }, user, { t }] = await Promise.all([
    params,
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

  return (
    <div className="max-w-[1000px]">
      <Link
        href="/portal"
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
          {t.portal.dossierTitle}
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
        <DossierDetail dossierId={id} />
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
