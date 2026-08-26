import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";
import { isLoginRateLimited, recordLoginFailure } from "@/lib/auth/rateLimit";
import { getClientIp } from "@/lib/http";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GENERIC_ERROR = "Adresse e-mail ou mot de passe incorrect.";

export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }
  const { email, password } = parsed.data;
  const ip = getClientIp(request);

  if (await isLoginRateLimited(email, ip)) {
    return NextResponse.json(
      { ok: false, error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429 },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  const valid = user ? await verifyPassword(user.passwordHash, password) : false;

  if (!user || !valid) {
    await recordLoginFailure(email, ip);
    return NextResponse.json({ ok: false, error: GENERIC_ERROR }, { status: 401 });
  }

  const code = await createOtp(user.id, "login");
  const emailBody = otpEmailTemplate({ code, purpose: "login" });
  await sendEmail({ to: user.email, ...emailBody });

  return NextResponse.json({ ok: true });
}
