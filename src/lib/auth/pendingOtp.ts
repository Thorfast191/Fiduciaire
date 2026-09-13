import type { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { otpCodes } from "@/db/schema";
import type { OtpPurpose } from "@/db/schema";

export const PENDING_OTP_COOKIE = "fiduvia_pending_otp";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Who is halfway through a two-factor login, so they can ask for a new code.
 *
 * The verify page needs to re-send without the user typing their password
 * again. Taking an email address in the request body would have been simpler
 * and would have been a mistake: anyone who knows a client's address could
 * then burn their five-codes-per-quarter-hour allowance and fill their inbox,
 * which today is impossible without the password.
 *
 * So issuing a code drops its row id in a short-lived, httpOnly cookie and the
 * resend proves entitlement by presenting it. The id is a random v4 uuid that
 * only ever travelled in a Set-Cookie, and it is only accepted while the code
 * it names is still live — so it expires on its own, and consuming the code
 * ends it. It authorises nothing but "send this person another code".
 */
export function setPendingOtp(response: NextResponse, otpId: string): void {
  response.cookies.set(PENDING_OTP_COOKIE, otpId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // Matches the code's own lifetime; a stale cookie is refused anyway.
    maxAge: 15 * 60,
  });
}

export function clearPendingOtp(response: NextResponse): void {
  response.cookies.set(PENDING_OTP_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export interface PendingOtp {
  userId: string;
  purpose: OtpPurpose;
}

/**
 * Resolve the cookie to the person it belongs to, or null.
 *
 * Null covers every failure the same way — no cookie, a made-up one, a code
 * already used, a code that has expired — so the caller cannot turn this into
 * a way of asking whether an account exists.
 */
export async function readPendingOtp(
  request: NextRequest,
): Promise<PendingOtp | null> {
  const id = request.cookies.get(PENDING_OTP_COOKIE)?.value;
  // Anything that is not a uuid never came from us, and handing it to Postgres
  // as a uuid literal raises rather than returning no rows — which turned a
  // junk cookie into a 500 on an unauthenticated route.
  if (!id || !UUID.test(id)) return null;

  const [row] = await db
    .select({ userId: otpCodes.userId, purpose: otpCodes.purpose })
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.id, id),
        isNull(otpCodes.consumedAt),
        gt(otpCodes.expiresAt, new Date()),
      ),
    );

  return row ?? null;
}
