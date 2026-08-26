import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { POST } from "../../../src/app/api/auth/signup/route";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/auth/signup", () => {
  it("creates an unverified client user", async () => {
    const email = `signup-${Date.now()}@example.test`;
    const res = await POST(
      req({
        email,
        password: "a-long-enough-password",
        firstName: "Camille",
        lastName: "Rochat",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });

    const [user] = await db.select().from(users).where(eq(users.email, email));
    expect(user.role).toBe("client");
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.passwordHash).not.toBe("a-long-enough-password");
  });

  it("rejects a duplicate email", async () => {
    const email = `signup-dup-${Date.now()}@example.test`;
    await POST(
      req({ email, password: "a-long-enough-password", firstName: "A", lastName: "B" }),
    );
    const res = await POST(
      req({ email, password: "another-long-password", firstName: "A", lastName: "B" }),
    );
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("rejects a too-short password", async () => {
    const res = await POST(
      req({
        email: `signup-short-${Date.now()}@example.test`,
        password: "short",
        firstName: "A",
        lastName: "B",
      }),
    );
    expect(res.status).toBe(400);
  });
});
