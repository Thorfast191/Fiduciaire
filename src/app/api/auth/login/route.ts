import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { verifyPassword, hashPassword } from "@/lib/auth/password";
import { issueOtp } from "@/lib/auth/otp";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";
import { setPendingOtp } from "@/lib/auth/pendingOtp";
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

  // A distinct message from the failed-password limit above. The password was
  // right; the account has simply asked for too many codes. Saying "too many
  // attempts" here sends people hunting for a wrong password that is not wrong.
  if (await isOtpIssuanceRateLimited(user.id, "login")) {
    return NextResponse.json(
      { ok: false, error: e.tooManyCodeRequests },
      { status: 429 },
    );
  }

  const { code, id: otpId } = await issueOtp(user.id, "login");
  await recordOtpIssuance(user.id, "login");
  const emailBody = otpEmailTemplate({
    code,
    purpose: "login",
    locale: user.locale,
  });
  await sendEmail({ to: user.email, ...emailBody });

  // Lets the verify page ask for a fresh code without the password again, and
  // without putting an email address in a request body anyone could forge.
  const response = NextResponse.json({ ok: true });
  setPendingOtp(response, otpId);
  return response;
}
