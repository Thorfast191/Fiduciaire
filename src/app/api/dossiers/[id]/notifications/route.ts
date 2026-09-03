import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import {
  acknowledgeNotification,
  sendDossierNotification,
} from "@/lib/notifications";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, readJsonBody } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

const sendSchema = z.object({
  kind: z.enum(["documents_requested", "action_required"]),
  message: z.string().trim().max(2000).optional(),
});

const ackSchema = z.object({ notificationId: z.string().uuid() });

/** An administrator notifies the dossier's client. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const e = apiErrors(request);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { ok: false, error: e.dossierNotFound },
      { status: 404 },
    );
  }

  const parsed = sendSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const result = await sendDossierNotification({
    dossierId: id,
    sentBy: user.id,
    kind: parsed.data.kind,
    message: parsed.data.message,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: e.dossierNotFound },
      { status: 404 },
    );
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "dossier_notification_sent",
    targetType: "dossier",
    targetId: id,
    metadata: { kind: parsed.data.kind },
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}

/** The client marks a notification read. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const e = apiErrors(request);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { ok: false, error: e.dossierNotFound },
      { status: 404 },
    );
  }

  const parsed = ackSchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const done = await acknowledgeNotification({
    notificationId: parsed.data.notificationId,
    dossierId: id,
    clientId: user.id,
  });
  if (!done) {
    return NextResponse.json(
      { ok: false, error: e.dossierNotFound },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true });
}
