import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword, verifyPassword } from "../../../src/lib/auth/password";
import {
  createSession,
  SESSION_COOKIE_NAME,
} from "../../../src/lib/auth/session";
import { PATCH as updateAccount } from "../../../src/app/api/account/route";

async function makeUser() {
  const email = `account-${Date.now()}-${Math.random()}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword("the-original-password"),
      firstName: "Old",
      lastName: "Name",
      role: "client",
    })
    .returning();
  return user;
}

function patch(body: unknown, token?: string) {
  const request = new NextRequest("http://localhost/api/account", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  if (token) request.cookies.set(SESSION_COOKIE_NAME, token);
  return request;
}

async function reload(id: string) {
  const [row] = await db.select().from(users).where(eq(users.id, id));
  return row;
}

describe("PATCH /api/account", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await updateAccount(
      patch({ firstName: "A", lastName: "B" }),
    );
    expect(res.status).toBe(401);
  });

  it("updates name and phone", async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id, {});

    const res = await updateAccount(
      patch(
        { firstName: "Camille", lastName: "Rochat", phone: "+41 79 000 00 00" },
        token,
      ),
    );

    expect(res.status).toBe(200);
    const row = await reload(user.id);
    expect(row.firstName).toBe("Camille");
    expect(row.lastName).toBe("Rochat");
    expect(row.phone).toBe("+41 79 000 00 00");
  });

  it("keeps the current password when the field is left blank", async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id, {});

    await updateAccount(
      patch({ firstName: "A", lastName: "B", password: "" }, token),
    );

    const row = await reload(user.id);
    expect(await verifyPassword(row.passwordHash, "the-original-password")).toBe(
      true,
    );
  });

  it("changes the password when one is supplied", async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id, {});

    const res = await updateAccount(
      patch(
        { firstName: "A", lastName: "B", password: "a-brand-new-password" },
        token,
      ),
    );
    expect(res.status).toBe(200);

    const row = await reload(user.id);
    expect(await verifyPassword(row.passwordHash, "a-brand-new-password")).toBe(
      true,
    );
    expect(await verifyPassword(row.passwordHash, "the-original-password")).toBe(
      false,
    );
  });

  it("refuses a password shorter than the signup minimum", async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id, {});

    const res = await updateAccount(
      patch({ firstName: "A", lastName: "B", password: "short" }, token),
    );

    expect(res.status).toBe(400);
    const row = await reload(user.id);
    expect(await verifyPassword(row.passwordHash, "the-original-password")).toBe(
      true,
    );
  });

  it("never lets the email address be changed through this route", async () => {
    const user = await makeUser();
    const { token } = await createSession(user.id, {});

    await updateAccount(
      patch(
        { firstName: "A", lastName: "B", email: "attacker@example.test" },
        token,
      ),
    );

    const row = await reload(user.id);
    expect(row.email).toBe(user.email);
  });
});
