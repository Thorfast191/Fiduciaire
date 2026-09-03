import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { consumeOtp } from "@/lib/auth/otp";
import { hashPassword } from "@/lib/auth/password";
import { revokeAllSessionsForUser } from "@/lib/auth/session";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(10),
});

export async function POST(request: NextRequest) {
  const e = apiErrors(request);
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: e.badCode }, { status: 400 });
  }
  const { email, code, newPassword } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return NextResponse.json({ ok: false, error: e.badCode }, { status: 400 });
  }

  const result = await consumeOtp(user.id, "password_reset", code);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: e.badCode }, { status: 400 });
  }

  const passwordHash = await hashPassword(newPassword);
  await db.update(users).set({ passwordHash }).where(eq(users.id, user.id));
  await revokeAllSessionsForUser(user.id);
  await writeAuditLog({
    actorUserId: user.id,
    action: "password_reset",
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
