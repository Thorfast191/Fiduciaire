"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n/I18nProvider";
import type { NotificationKind } from "@/db/schema";

export interface ClientNotification {
  id: string;
  kind: NotificationKind;
  message: string | null;
  createdAt: string;
}

/**
 * The mockup's "demande" banner: what the firm has asked of the client on this
 * dossier, shown until they acknowledge it. Backed by rows rather than the
 * email alone, so the request survives a lost message.
 */
export default function NotificationBanner({
  dossierId,
  notifications,
}: {
  dossierId: string;
  notifications: ClientNotification[];
}) {
  const t = useT();
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function acknowledge(notificationId: string) {
    setBusy(notificationId);

    try {
      const res = await fetch(`/api/dossiers/${dossierId}/notifications`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(null);
    }
  }

  if (notifications.length === 0) return null;

  return (
    <div className="mt-6 flex flex-col gap-3">
      {notifications.map((n) => {
        // Each kind gets its own words and its own tone. Closing a dossier is
        // good news, so it must not arrive in the amber "something is wrong"
        // banner the other kinds use.
        const copy = {
          documents_requested: {
            title: t.portal.noticeDocumentsTitle,
            body: t.portal.noticeDocumentsBody,
            tone: "border-amber-600/30 bg-amber-100",
          },
          action_required: {
            title: t.portal.noticeActionTitle,
            body: t.portal.noticeActionBody,
            tone: "border-amber-600/30 bg-amber-100",
          },
          dossier_completed: {
            title: t.portal.noticeClosedTitle,
            body: t.portal.noticeClosedBody,
            tone: "border-[#1F8A5B]/30 bg-[#E6F6EE]",
          },
          dossier_reclamation: {
            title: t.portal.noticeReclamationTitle,
            body: t.portal.noticeReclamationBody,
            tone: "border-[#C0453B]/30 bg-[#FBE7E4]",
          },
        }[n.kind];

        return (
          <div
            key={n.id}
            className={`rounded-[var(--radius-md)] border p-[18px] ${copy.tone}`}
          >
            <p className="disp text-[16px] font-bold text-strong">
              {copy.title}
            </p>

            <p className="mt-1 text-[13.5px] leading-[1.5] text-body">
              {copy.body}
            </p>

            {n.message ? (
              <p className="mt-2.5 whitespace-pre-wrap rounded-lg bg-card px-3.5 py-2.5 text-[13.5px] leading-[1.5] text-strong">
                {n.message}
              </p>
            ) : null}

            <button
              type="button"
              onClick={() => acknowledge(n.id)}
              disabled={busy === n.id}
              className="mt-3 rounded-lg border border-amber-600/40 bg-card px-3.5 py-1.5 text-[13px] font-medium text-amber-600 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t.portal.noticeAck}
            </button>
          </div>
        );
      })}
    </div>
  );
}
