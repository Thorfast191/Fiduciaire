import { and, desc, eq, gte, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  dossierNotifications,
  dossiers,
  users,
  type DossierNotification,
  type NotificationKind,
} from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import { notificationEmailTemplate } from "@/lib/email/templates/notificationEmail";

/** How long an identical notification is treated as a retry rather than a new send. */
const DUPLICATE_WINDOW_MS = 60 * 1000;

export type SendNotificationResult =
  | { ok: true; notification: DossierNotification }
  | { ok: false; error: "dossier_not_found" };

/**
 * Records an admin notification against a dossier and emails the client.
 *
 * The row is written first: if the mail provider is down the client still sees
 * the request in their space, which is the point of storing it rather than
 * relying on delivery.
 */
export async function sendDossierNotification(params: {
  dossierId: string;
  sentBy: string;
  kind: NotificationKind;
  message?: string | null;
}): Promise<SendNotificationResult> {
  const [row] = await db
    .select({
      taxYear: dossiers.taxYear,
      firstName: users.firstName,
      email: users.email,
      locale: users.locale,
    })
    .from(dossiers)
    .innerJoin(users, eq(users.id, dossiers.clientId))
    .where(eq(dossiers.id, params.dossierId));

  if (!row) return { ok: false, error: "dossier_not_found" };

  const message = params.message?.trim() || null;

  // A double-clicked "Notify" button, or a retried request, must not send the
  // client the same email twice. An identical notification on the same dossier
  // within the window resolves to the row already written rather than adding a
  // second one. The window is deliberately short: re-sending the same reminder
  // an hour later is a legitimate nudge, not a duplicate.
  const [duplicate] = await db
    .select()
    .from(dossierNotifications)
    .where(
      and(
        eq(dossierNotifications.dossierId, params.dossierId),
        eq(dossierNotifications.kind, params.kind),
        message === null
          ? isNull(dossierNotifications.message)
          : eq(dossierNotifications.message, message),
        gte(
          dossierNotifications.createdAt,
          new Date(Date.now() - DUPLICATE_WINDOW_MS),
        ),
      ),
    )
    .orderBy(desc(dossierNotifications.createdAt))
    .limit(1);

  if (duplicate) return { ok: true, notification: duplicate };

  const [notification] = await db
    .insert(dossierNotifications)
    .values({
      dossierId: params.dossierId,
      sentBy: params.sentBy,
      kind: params.kind,
      message,
    })
    .returning();

  const body = notificationEmailTemplate({
    kind: params.kind,
    firstName: row.firstName,
    taxYear: row.taxYear,
    message: notification.message,
    locale: row.locale,
  });

  await sendEmail({ to: row.email, ...body });

  return { ok: true, notification };
}

export async function listNotificationsForDossier(
  dossierId: string,
): Promise<DossierNotification[]> {
  return db
    .select()
    .from(dossierNotifications)
    .where(eq(dossierNotifications.dossierId, dossierId))
    .orderBy(desc(dossierNotifications.createdAt));
}

export async function countUnacknowledged(dossierId: string): Promise<number> {
  const rows = await db
    .select({ id: dossierNotifications.id })
    .from(dossierNotifications)
    .where(
      and(
        eq(dossierNotifications.dossierId, dossierId),
        isNull(dossierNotifications.acknowledgedAt),
      ),
    );
  return rows.length;
}

/**
 * Marks a notification read.
 *
 * Scoped by both the dossier in the request path and the acting client, so a
 * notification can only be acknowledged through its own dossier and only by
 * the client that dossier belongs to — guessing an id from elsewhere fails.
 */
export async function acknowledgeNotification(params: {
  notificationId: string;
  dossierId: string;
  clientId: string;
}): Promise<boolean> {
  const { notificationId, dossierId, clientId } = params;

  const [row] = await db
    .select({ id: dossierNotifications.id })
    .from(dossierNotifications)
    .innerJoin(dossiers, eq(dossiers.id, dossierNotifications.dossierId))
    .where(
      and(
        eq(dossierNotifications.id, notificationId),
        eq(dossierNotifications.dossierId, dossierId),
        eq(dossiers.clientId, clientId),
      ),
    );

  if (!row) return false;

  await db
    .update(dossierNotifications)
    .set({ acknowledgedAt: new Date() })
    .where(eq(dossierNotifications.id, notificationId));

  return true;
}
