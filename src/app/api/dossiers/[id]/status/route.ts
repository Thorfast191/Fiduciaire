import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { setDossierStatus } from "@/lib/dossiers";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const GENERIC_NOT_FOUND = "Dossier introuvable.";

const bodySchema = z.object({
  status: z.enum(["not_started", "submitted", "in_review", "completed"]),
});

export async function PATCH(
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

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const result = await setDossierStatus(id, parsed.data.status, { id: user.id, role: user.role });
  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
    }
    return NextResponse.json(
      { ok: false, error: "Transition de statut non autorisée." },
      { status: 400 },
    );
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "dossier_status_changed",
    targetType: "dossier",
    targetId: id,
    metadata: { from: result.previousStatus, to: parsed.data.status },
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
