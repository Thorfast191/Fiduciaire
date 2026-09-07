import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp, readJsonBody } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

const bodySchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(50).optional().default(""),
  // Blank means "keep the current password", which is what the form's hint
  // promises. Anything else has to clear the same bar as signup.
  password: z.string().min(10).max(200).optional().or(z.literal("")),
});

/**
 * The signed-in user's own profile.
 *
 * Deliberately not editable here: the email address. It is the login identity
 * and the destination for every verification code, so changing it without a
 * re-verification round trip would let anyone with a live session move the
 * account to an address they control. The field is shown read-only instead.
 */
export async function PATCH(request: NextRequest) {
  const e = apiErrors(request);

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 },
    );
  }

  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.checkInput },
      { status: 400 },
    );
  }

  const { firstName, lastName, phone, password } = parsed.data;

  await db
    .update(users)
    .set({
      firstName,
      lastName,
      phone: phone || null,
      ...(password ? { passwordHash: await hashPassword(password) } : {}),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  await writeAuditLog({
    actorUserId: user.id,
    action: password ? "profile_updated_with_password" : "profile_updated",
    ip: getClientIp(request),
  });

  return NextResponse.json({
    ok: true,
    account: { firstName, lastName, phone: phone || null },
  });
}
