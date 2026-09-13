import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { issueOtp } from "@/lib/auth/otp";
import { readPendingOtp, setPendingOtp } from "@/lib/auth/pendingOtp";
import {
  isOtpIssuanceRateLimited,
  recordOtpIssuance,
} from "@/lib/auth/rateLimit";
import { sendEmail } from "@/lib/email/send";
import { otpEmailTemplate } from "@/lib/email/templates/otpEmail";
import { apiErrors } from "@/lib/i18n/apiErrors";
import { logger } from "@/lib/logger";

/**
 * "Vous n'avez pas reçu le code ?" — send another one.
 *
 * Entitlement comes from the short-lived cookie the login set, not from an
 * address in the body, so this cannot be used to mail codes at someone whose
 * password you do not have. Issuing retires the previous code, which is what
 * makes this a regenerate rather than a second valid code in the wild.
 *
 * The same five-per-quarter-hour cap the login uses applies, and it is the
 * cap that answers 429 — otherwise this button would be a way around it.
 */
export async function POST(request: NextRequest) {
  const e = apiErrors(request);

  const pending = await readPendingOtp(request);
  if (!pending) {
    // No cookie, a forged one, or a code that has already been used or has
    // expired. All the same answer: start again from the login page.
    return NextResponse.json(
      { ok: false, error: e.sessionExpired },
      { status: 401 },
    );
  }

  if (await isOtpIssuanceRateLimited(pending.userId, pending.purpose)) {
    return NextResponse.json(
      { ok: false, error: e.tooManyCodeRequests },
      { status: 429 },
    );
  }

  const [user] = await db
    .select({ email: users.email, locale: users.locale, disabledAt: users.disabledAt })
    .from(users)
    .where(eq(users.id, pending.userId));

  if (!user || user.disabledAt) {
    return NextResponse.json(
      { ok: false, error: e.sessionExpired },
      { status: 401 },
    );
  }

  const { code, id: otpId } = await issueOtp(pending.userId, pending.purpose);
  await recordOtpIssuance(pending.userId, pending.purpose);

  try {
    await sendEmail({
      to: user.email,
      ...otpEmailTemplate({
        code,
        purpose: pending.purpose,
        locale: user.locale,
      }),
    });
  } catch (err) {
    // The old code is already retired, so failing quietly would leave the
    // client with nothing that works and no idea why.
    logger.error({ err, userId: pending.userId }, "could not resend the code");
    return NextResponse.json(
      { ok: false, error: e.resendFailed },
      { status: 502 },
    );
  }

  // The cookie must follow the new row: the old one names a code that issuing
  // this one just consumed, so a second resend would be refused without it.
  const response = NextResponse.json({ ok: true });
  setPendingOtp(response, otpId);
  return response;
}
