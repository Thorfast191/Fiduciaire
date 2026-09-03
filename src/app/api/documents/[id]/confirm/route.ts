import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { confirmUpload } from "@/lib/documents";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

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

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json(
      { ok: false, error: e.documentNotFound },
      { status: 404 },
    );
  }
  const result = await confirmUpload(id, user.id);

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json(
        { ok: false, error: e.documentNotFound },
        { status: 404 },
      );
    }

    // A rejected upload means the bytes in storage disagreed with what the
    // client declared when it asked for the URL — worth an audit entry.
    if (result.error !== "not_uploaded") {
      await writeAuditLog({
        actorUserId: user.id,
        action: "document_rejected",
        targetType: "document",
        targetId: id,
        metadata: { reason: result.error },
        ip: getClientIp(request),
      });
    }

    const message =
      result.error === "invalid_type"
        ? e.uploadInvalidType
        : result.error === "too_large"
          ? e.uploadTooLarge
          : e.uploadNotReceived;

    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "document_confirmed",
    targetType: "document",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
