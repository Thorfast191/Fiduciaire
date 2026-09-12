import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { deactivateClient } from "@/lib/adminUsers";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

/**
 * Closes a client account at the user's request — the clients list's
 * "Supprimer". A super-admin power, and a soft delete: the library stamps
 * `disabled_at` rather than removing the row, so the person drops out of the app
 * while the dossiers and payments that reference them stay intact.
 */
export async function DELETE(
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
  // Removing a client account is something either administrator does, as the
  // reference shows. `deactivateClient` only ever touches a client row, so this
  // cannot be turned on a colleague. Promotion stays the super admin's.
  if (user.role !== "admin" && user.role !== "super_admin") {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403 },
    );
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  const removed = await deactivateClient(id);
  if (!removed) {
    return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "client_deactivated",
    targetType: "user",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
