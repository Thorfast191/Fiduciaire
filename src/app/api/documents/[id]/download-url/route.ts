import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDocument } from "@/lib/documents";
import { getDownloadUrl } from "@/lib/storage/client";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const GENERIC_NOT_FOUND = "Document introuvable.";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }
  const result = await getAccessibleDocument(id, { id: user.id, role: user.role });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }

  const downloadUrl = await getDownloadUrl(result.document.storageKey, result.document.filename);

  await writeAuditLog({
    actorUserId: user.id,
    action: "document_downloaded",
    targetType: "document",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true, downloadUrl });
}
