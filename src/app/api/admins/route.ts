import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { demoteAdmin, listAdminAccounts } from "@/lib/adminUsers";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

const createSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(10),
});

const deleteSchema = z.object({ id: z.string().uuid() });

/**
 * Managing administrators is a super-admin power: an ordinary admin must not
 * be able to grant themselves peers or strip a colleague's access.
 */
async function requireSuperAdmin(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) return { error: "unauthorized" as const, status: 401 };
  if (user.role !== "super_admin") {
    return { error: "forbidden" as const, status: 403 };
  }
  return { user };
}

async function body(request: NextRequest): Promise<unknown | undefined> {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
}

export async function GET(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  return NextResponse.json({ ok: true, admins: await listAdminAccounts() });
}

export async function POST(request: NextRequest) {
  const e = apiErrors(request);
  const auth = await requireSuperAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const parsed = createSchema.safeParse(await body(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase();
  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.email, email));

  if (existing) {
    // Promote an existing account rather than refusing outright, but never
    // silently change a super admin's role.
    if (existing.role === "super_admin") {
      return NextResponse.json(
        { ok: false, error: e.emailExists },
        { status: 409 },
      );
    }

    await db
      .update(users)
      .set({ role: "admin", updatedAt: new Date() })
      .where(eq(users.id, existing.id));

    await writeAuditLog({
      actorUserId: auth.user.id,
      action: "admin_promoted",
      targetType: "user",
      targetId: existing.id,
      ip: getClientIp(request),
    });

    return NextResponse.json({ ok: true, promoted: true });
  }

  const [created] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword(parsed.data.password),
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      role: "admin",
      emailVerifiedAt: new Date(),
    })
    .returning({ id: users.id });

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "admin_created",
    targetType: "user",
    targetId: created.id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  const auth = await requireSuperAdmin(request);
  if ("error" in auth) {
    return NextResponse.json(
      { ok: false, error: auth.error },
      { status: auth.status },
    );
  }

  const parsed = deleteSchema.safeParse(await body(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_request" },
      { status: 400 },
    );
  }

  const demoted = await demoteAdmin(parsed.data.id);
  if (!demoted) {
    return NextResponse.json(
      { ok: false, error: "not_found" },
      { status: 404 },
    );
  }

  await writeAuditLog({
    actorUserId: auth.user.id,
    action: "admin_demoted",
    targetType: "user",
    targetId: parsed.data.id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
