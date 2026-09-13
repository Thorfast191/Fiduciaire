import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../../../src/db/client";
import { users, otpCodes } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { issueOtp, consumeOtp } from "../../../src/lib/auth/otp";
import { PENDING_OTP_COOKIE } from "../../../src/lib/auth/pendingOtp";
import { POST as resendOtp } from "../../../src/app/api/auth/resend-otp/route";

/**
 * "Vous n'avez pas reçu le code ?" sends another one.
 *
 * The thing worth guarding is not that it works but that it cannot be aimed at
 * someone else: entitlement is the cookie the login set, never an address in
 * the body, so knowing a client's e-mail is not enough to burn their codes or
 * fill their inbox.
 */
async function makeClient() {
  const [user] = await db
    .insert(users)
    .values({
      email: `resend-${Date.now()}-${Math.random()}@example.test`,
      passwordHash: await hashPassword("LocalDev2026!"),
      firstName: "Test",
      lastName: "Client",
      role: "client",
    })
    .returning();
  return user;
}

function post(cookie?: string) {
  const request = new NextRequest("http://localhost/api/auth/resend-otp", {
    method: "POST",
  });
  if (cookie !== undefined) request.cookies.set(PENDING_OTP_COOKIE, cookie);
  return resendOtp(request);
}

async function liveCodeCount(userId: string) {
  const rows = await db
    .select({ id: otpCodes.id })
    .from(otpCodes)
    .where(and(eq(otpCodes.userId, userId), isNull(otpCodes.consumedAt)));
  return rows.length;
}

describe("POST /api/auth/resend-otp", () => {
  it("issues a new code for a pending login", async () => {
    const user = await makeClient();
    const first = await issueOtp(user.id, "login");

    const res = await post(first.id);
    expect(res.status).toBe(200);

    // Exactly one code is live: the fresh one replaced the first.
    expect(await liveCodeCount(user.id)).toBe(1);
  });

  it("retires the code it replaces", async () => {
    const user = await makeClient();
    const first = await issueOtp(user.id, "login");
    await post(first.id);

    const stale = await consumeOtp(user.id, "login", first.code);
    expect(stale.ok).toBe(false);
  });

  it("hands back a cookie that works for a second resend", async () => {
    const user = await makeClient();
    const first = await issueOtp(user.id, "login");

    const one = await post(first.id);
    const next = one.cookies.get(PENDING_OTP_COOKIE)?.value;
    expect(next).toBeTruthy();
    // Without rotating the cookie the second attempt would be refused, because
    // issuing the first replacement consumed the row the cookie named.
    expect((await post(next!)).status).toBe(200);
  });

  it("refuses a request with no cookie", async () => {
    expect((await post()).status).toBe(401);
  });

  it("refuses a cookie naming someone else's code that does not exist", async () => {
    expect(
      (await post("11111111-1111-4111-8111-111111111111")).status,
    ).toBe(401);
  });

  it("refuses a cookie that is not a uuid, rather than erroring", async () => {
    // Postgres raises on a bad uuid literal instead of returning no rows, so
    // this used to answer 500 on an unauthenticated route.
    for (const junk of ["not-a-uuid", "", "'; drop table users;--"]) {
      const res = await post(junk);
      expect(res.status, `cookie ${JSON.stringify(junk)}`).toBe(401);
    }
  });

  it("refuses once the code has been used", async () => {
    const user = await makeClient();
    const first = await issueOtp(user.id, "login");
    await consumeOtp(user.id, "login", first.code);
    expect((await post(first.id)).status).toBe(401);
  });

  it("refuses a disabled account", async () => {
    const user = await makeClient();
    const first = await issueOtp(user.id, "login");
    await db
      .update(users)
      .set({ disabledAt: new Date() })
      .where(eq(users.id, user.id));
    expect((await post(first.id)).status).toBe(401);
  });

  it("is held to the same cap as the login, so it is not a way around it", async () => {
    const user = await makeClient();
    let cookie = (await issueOtp(user.id, "login")).id;

    // The cap is five issuances per quarter hour, counted per user.
    let limited = false;
    for (let i = 0; i < 8; i += 1) {
      const res = await post(cookie);
      if (res.status === 429) {
        limited = true;
        break;
      }
      cookie = res.cookies.get(PENDING_OTP_COOKIE)!.value;
    }
    expect(limited).toBe(true);
  });
});
