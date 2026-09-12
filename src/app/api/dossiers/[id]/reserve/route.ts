import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { reserveDossier, releaseDossier } from "@/lib/dossiers";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, readJsonBody } from "@/lib/http";

/** Optional `{ adminId }` — a super admin assigning the dossier to that admin. */
const assignSchema = z.object({ adminId: z.string().uuid() }).partial();

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) return { error: "unauthorized" as const, status: 401 };
  if (user.role !== "admin" && user.role !== "super_admin") {
    return { error: "forbidden" as const, status: 403 };
  }
  return { user };
}

/** Reserve a dossier for the signed-in administrator ("Réserver"). */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const parsed = assignSchema.safeParse((await readJsonBody(request)) ?? {});
  const targetAdminId = parsed.success ? parsed.data.adminId : undefined;

  const result = await reserveDossier(
    id,
    { id: auth.user.id, role: auth.user.role },
    targetAdminId,
  );
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.error === "not_found" ? 404 : 409 },
    );
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "dossier_reserved",
    targetType: "dossier",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}

/** Release a dossier back to the unassigned pool ("Libérer"). */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const result = await releaseDossier(id, {
    id: auth.user.id,
    role: auth.user.role,
  });
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: result.error === "not_found" ? 404 : 403 },
    );
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "dossier_released",
    targetType: "dossier",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
