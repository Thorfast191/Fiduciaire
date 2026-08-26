import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { createOtp } from "../../../src/lib/auth/otp";
import { hashPassword } from "../../../src/lib/auth/password";
import { POST as verifyOtp } from "../../../src/app/api/auth/verify-otp/route";
import { SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

async function makeUnverifiedUser() {
  const email = `verify-${Date.now()}-${Math.random()}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "A",
      lastName: "B",
      role: "client",
    })
    .returning();
  return user;
}

describe("POST /api/auth/verify-otp", () => {
  it("sets a session cookie and marks the email verified on signup purpose", async () => {
    const user = await makeUnverifiedUser();
    const code = await createOtp(user.id, "signup");

    const res = await verifyOtp(req({ email: user.email, code, purpose: "signup" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true, role: "client" });
    expect(res.cookies.get(SESSION_COOKIE_NAME)).toBeDefined();

    const [updated] = await db.select().from(users).where(eq(users.id, user.id));
    expect(updated.emailVerifiedAt).not.toBeNull();
  });

  it("rejects a wrong code", async () => {
    const user = await makeUnverifiedUser();
    await createOtp(user.id, "login");
    const res = await verifyOtp(req({ email: user.email, code: "000000", purpose: "login" }));
    expect(res.status).toBe(401);
  });
});
