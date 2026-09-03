import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { confirmUpload } from "@/lib/documents";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const GENERIC_NOT_FOUND = "Document introuvable.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
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
      { ok: false, error: GENERIC_NOT_FOUND },
      { status: 404 },
    );
  }
  const result = await confirmUpload(id, user.id);

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json(
        { ok: false, error: GENERIC_NOT_FOUND },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { ok: false, error: "Le fichier n'a pas été reçu par le stockage." },
      { status: 400 },
    );
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
