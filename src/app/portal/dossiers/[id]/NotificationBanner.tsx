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
        const isDocs = n.kind === "documents_requested";

        return (
          <div
            key={n.id}
            className="rounded-[var(--radius-md)] border border-amber-600/30 bg-amber-100 p-[18px]"
          >
            <p className="disp text-[16px] font-bold text-strong">
              {isDocs
                ? t.portal.noticeDocumentsTitle
                : t.portal.noticeActionTitle}
            </p>

            <p className="mt-1 text-[13.5px] leading-[1.5] text-body">
              {isDocs
                ? t.portal.noticeDocumentsBody
                : t.portal.noticeActionBody}
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
