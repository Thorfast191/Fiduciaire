import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { createOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";
import {
  isLoginRateLimited,
  recordLoginFailure,
  isOtpIssuanceRateLimited,
  recordOtpIssuance,
} from "@/lib/auth/rateLimit";
import { getClientIp, readJsonBody } from "@/lib/http";
import { apiErrors } from "@/lib/i18n/apiErrors";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Cache for dummy hash to protect against timing-based user enumeration (CWE-208)
let cachedDummyHash: Promise<string> | null = null;

async function getDummyHash(): Promise<string> {
  if (!cachedDummyHash) {
    cachedDummyHash = hashPassword("timing-safety-dummy-password-do-not-use");
  }
  return cachedDummyHash;
}

export async function POST(request: NextRequest) {
  const e = apiErrors(request);
  const parsed = bodySchema.safeParse(await readJsonBody(request));
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: e.badCredentials },
      { status: 401 },
    );
  }
  const { email, password } = parsed.data;
  const ip = getClientIp(request);

  if (await isLoginRateLimited(email, ip)) {
    return NextResponse.json(
      { ok: false, error: e.tooManyLogins },
      { status: 429 },
    );
  }

  const [user] = await db.select().from(users).where(eq(users.email, email));
  // Always run verifyPassword to equalize timing regardless of whether user exists (CWE-208)
  const hashToCheck = user?.passwordHash ?? (await getDummyHash());
  const passwordValid = await verifyPassword(hashToCheck, password);
  const valid = passwordValid && !!user && !user?.disabledAt;

  if (!valid) {
    await recordLoginFailure(email, ip);
    return NextResponse.json(
      { ok: false, error: e.badCredentials },
      { status: 401 },
    );
  }

  if (await isOtpIssuanceRateLimited(user.id, "login")) {
    return NextResponse.json(
      { ok: false, error: e.tooManyLogins },
      { status: 429 },
    );
  }

  const code = await createOtp(user.id, "login");
  await recordOtpIssuance(user.id, "login");
  const emailBody = otpEmailTemplate({
    code,
    purpose: "login",
    locale: user.locale,
  });
  await sendEmail({ to: user.email, ...emailBody });

  return NextResponse.json({ ok: true });
}
