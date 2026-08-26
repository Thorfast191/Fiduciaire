import { describe, it, expect, beforeEach } from "vitest";
import { db } from "../../src/db/client";
import { users, otpCodes } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { createOtp, consumeOtp } from "../../src/lib/auth/otp";

async function makeUser(email: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: "unused-in-this-test",
      firstName: "Test",
      lastName: "User",
    })
    .returning();
  return user;
}

describe("OTP", () => {
  it("creates a 6-digit code and can consume it once", async () => {
    const user = await makeUser(`otp-${Date.now()}@example.test`);
    const code = await createOtp(user.id, "login");
    expect(code).toMatch(/^\d{6}$/);

    const result = await consumeOtp(user.id, "login", code);
    expect(result).toEqual({ ok: true });

    const again = await consumeOtp(user.id, "login", code);
    expect(again).toEqual({ ok: false, reason: "invalid_or_expired" });
  });

  it("rejects a wrong code", async () => {
    const user = await makeUser(`otp-wrong-${Date.now()}@example.test`);
    await createOtp(user.id, "login");
    const result = await consumeOtp(user.id, "login", "000000");
    expect(result.ok).toBe(false);
  });

  it("locks out after 5 wrong attempts, even with the right code after", async () => {
    const user = await makeUser(`otp-lock-${Date.now()}@example.test`);
    const code = await createOtp(user.id, "login");
    for (let i = 0; i < 5; i++) {
      await consumeOtp(user.id, "login", "000000");
    }
    const result = await consumeOtp(user.id, "login", code);
    expect(result).toEqual({ ok: false, reason: "too_many_attempts" });
  });

  it("rejects an expired code", async () => {
    const user = await makeUser(`otp-expired-${Date.now()}@example.test`);
    const code = await createOtp(user.id, "login");
    await db
      .update(otpCodes)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(otpCodes.userId, user.id));
    const result = await consumeOtp(user.id, "login", code);
    expect(result).toEqual({ ok: false, reason: "invalid_or_expired" });
  });
});
