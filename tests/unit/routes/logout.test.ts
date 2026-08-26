import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, getSessionUserByToken, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { POST as logout } from "../../../src/app/api/auth/logout/route";

describe("POST /api/auth/logout", () => {
  it("revokes the session named by the cookie and clears it", async () => {
    const [user] = await db
      .insert(users)
      .values({
        email: `logout-${Date.now()}@example.test`,
        passwordHash: await hashPassword("irrelevant"),
        firstName: "A",
        lastName: "B",
      })
      .returning();
    const { token } = await createSession(user.id, {});

    const request = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
    request.cookies.set(SESSION_COOKIE_NAME, token);

    const res = await logout(request);
    expect(res.status).toBe(200);
    expect(await getSessionUserByToken(token)).toBeNull();
  });

  it("returns ok even with no session cookie present", async () => {
    const request = new NextRequest("http://localhost/api/auth/logout", { method: "POST" });
    const res = await logout(request);
    expect(res.status).toBe(200);
  });
});
