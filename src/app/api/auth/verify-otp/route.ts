import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { consumeOtp } from "@/lib/auth/otp";
import { createSession, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { recordLoginSuccess } from "@/lib/auth/rateLimit";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const bodySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  purpose: z.enum(["login", "signup"]),
});

const GENERIC_ERROR = "Code incorrect ou expiré.";

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }
  const { email, code, purpose } = parsed.data;
  const ip = getClientIp(request);

  const [user] = await db.select().from(users).where(eq(users.email, email));
  if (!user) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const result = await consumeOtp(user.id, purpose, code);
  if (!result.ok) {
    const message =
      result.reason === "too_many_attempts"
        ? "Trop de tentatives. Demandez un nouveau code."
        : GENERIC_ERROR;
    return NextResponse.json({ ok: false, error: message }, { status: 401 });
  }

  if (purpose === "signup") {
    await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, user.id));
  }

  const { token, expiresAt } = await createSession(user.id, {
    ip,
    userAgent: request.headers.get("user-agent") ?? undefined,
  });

  if (purpose === "login") {
    await recordLoginSuccess(user.id, user.email, ip);
  } else {
    await writeAuditLog({
      actorUserId: user.id,
      action: "signup_verified",
      ip,
    });
  }

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
  return response;
}
