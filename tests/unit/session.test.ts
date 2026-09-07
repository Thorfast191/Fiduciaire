import { describe, it, expect } from "vitest";
import { db } from "../../src/db/client";
import { users } from "../../src/db/schema";
import {
  createSession,
  getSessionUserByToken,
  revokeSessionByToken,
  revokeAllSessionsForUser,
} from "../../src/lib/auth/session";

async function makeUser(email: string) {
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: "unused",
      firstName: "Test",
      lastName: "User",
      role: "client",
    })
    .returning();
  return user;
}

describe("sessions", () => {
  it("creates a session and resolves it back to the user", async () => {
    const user = await makeUser(`sess-${Date.now()}@example.test`);
    const { token, expiresAt } = await createSession(user.id, {
      ip: "127.0.0.1",
    });
    expect(token.length).toBeGreaterThan(20);
    expect(expiresAt.getTime()).toBeGreaterThan(Date.now());

    const sessionUser = await getSessionUserByToken(token);
    expect(sessionUser).toEqual({
      id: user.id,
      email: user.email,
      role: "client",
      firstName: "Test",
      lastName: "User",
      // Carried so "Mon profil" can show it without a second query.
      phone: null,
    });
  });

  it("returns null for an unknown token", async () => {
    await expect(getSessionUserByToken("not-a-real-token")).resolves.toBeNull();
  });

  it("returns null after the session is revoked", async () => {
    const user = await makeUser(`sess-revoke-${Date.now()}@example.test`);
    const { token } = await createSession(user.id, {});
    await revokeSessionByToken(token);
    await expect(getSessionUserByToken(token)).resolves.toBeNull();
  });

  it("revokes all sessions for a user", async () => {
    const user = await makeUser(`sess-revokeall-${Date.now()}@example.test`);
    const a = await createSession(user.id, {});
    const b = await createSession(user.id, {});
    await revokeAllSessionsForUser(user.id);
    await expect(getSessionUserByToken(a.token)).resolves.toBeNull();
    await expect(getSessionUserByToken(b.token)).resolves.toBeNull();
  });
});
