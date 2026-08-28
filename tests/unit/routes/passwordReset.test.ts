import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users, otpCodes } from "../../../src/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword, verifyPassword } from "../../../src/lib/auth/password";
import { POST as forgotPassword } from "../../../src/app/api/auth/forgot-password/route";
import { POST as resetPassword } from "../../../src/app/api/auth/reset-password/route";
import { createSession, getSessionUserByToken } from "../../../src/lib/auth/session";

function req(path: string, body: unknown) {
  return new NextRequest(`http://localhost${path}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("password reset flow", () => {
  it("returns ok for both known and unknown emails", async () => {
    const knownEmail = `reset-${Date.now()}@example.test`;
    await db.insert(users).values({
      email: knownEmail,
      passwordHash: await hashPassword("some-password-123"),
      firstName: "A",
      lastName: "B",
    });

    const known = await forgotPassword(req("/api/auth/forgot-password", {
      email: knownEmail,
    }));
    const unknown = await forgotPassword(req("/api/auth/forgot-password", {
      email: "definitely-not-registered@example.test",
    }));
    expect(await known.json()).toEqual({ ok: true });
    expect(await unknown.json()).toEqual({ ok: true });
  });

  it("resets the password with a valid code and revokes existing sessions", async () => {
    const email = `reset-flow-${Date.now()}@example.test`;
    const [user] = await db
      .insert(users)
      .values({ email, passwordHash: await hashPassword("old-password-123"), firstName: "A", lastName: "B" })
      .returning();
    const { token: existingSessionToken } = await createSession(user.id, {});

    await forgotPassword(req("/api/auth/forgot-password", { email }));

    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(and(eq(otpCodes.userId, user.id), eq(otpCodes.purpose, "password_reset")));
    expect(otp).toBeDefined(); // confirms forgotPassword actually created the OTP row
    // The plain code isn't retrievable from the DB by design; re-issue one directly for this assertion.
    const { createOtp } = await import("../../../src/lib/auth/otp");
    const code = await createOtp(user.id, "password_reset");

    const res = await resetPassword(
      req("/api/auth/reset-password", { email, code, newPassword: "brand-new-password-1" }),
    );
    expect(res.status).toBe(200);

    const [updated] = await db.select().from(users).where(eq(users.id, user.id));
    await expect(verifyPassword(updated.passwordHash, "brand-new-password-1")).resolves.toBe(true);
    expect(await getSessionUserByToken(existingSessionToken)).toBeNull();
  });

  it("rejects an invalid code with a generic error", async () => {
    const email = `reset-bad-${Date.now()}@example.test`;
    await db.insert(users).values({
      email,
      passwordHash: await hashPassword("old-password-123"),
      firstName: "A",
      lastName: "B",
    });
    const res = await resetPassword(
      req("/api/auth/reset-password", { email, code: "000000", newPassword: "brand-new-password-1" }),
    );
    expect(res.status).toBe(400);
  });
});
