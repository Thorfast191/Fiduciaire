import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { POST } from "../../../src/app/api/auth/signup/route";

const PASSWORD = "LocalDev2026!";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/signup", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

/** A complete, valid signup body — every field on the form is mandatory. */
function body(overrides: Record<string, unknown> = {}) {
  return {
    email: `signup-${Date.now()}-${Math.random().toString(36).slice(2)}@example.test`,
    password: PASSWORD,
    firstName: "Camille",
    lastName: "Rochat",
    phone: "+41 79 000 00 00",
    street: "Rue du Lac 12",
    postalCode: "1003",
    city: "Lausanne",
    acceptTerms: true,
    ...overrides,
  };
}

describe("POST /api/auth/signup", () => {
  it("creates an unverified client user with their postal address", async () => {
    const data = body();
    const res = await POST(req(data));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    expect(user.role).toBe("client");
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.passwordHash).not.toBe(PASSWORD);
    expect(user.phone).toBe("+41 79 000 00 00");
    expect(user.street).toBe("Rue du Lac 12");
    expect(user.postalCode).toBe("1003");
    expect(user.city).toBe("Lausanne");
  });

  it("rejects a duplicate email", async () => {
    const email = `signup-dup-${Date.now()}@example.test`;
    await POST(req(body({ email })));
    const res = await POST(req(body({ email })));
    expect(res.status).toBe(400);
    expect((await res.json()).ok).toBe(false);
  });

  it("rejects a too-short password", async () => {
    const res = await POST(req(body({ password: "sh0rt!" })));
    expect(res.status).toBe(400);
  });

  it("rejects a password with no digit", async () => {
    const res = await POST(req(body({ password: "no-digits-here!" })));
    expect(res.status).toBe(400);
  });

  it("rejects a password with no special character", async () => {
    const res = await POST(req(body({ password: "n0specials123" })));
    expect(res.status).toBe(400);
  });

  it.each(["phone", "street", "postalCode", "city"])(
    "rejects a signup with no %s",
    async (field) => {
      const data = body({ [field]: "" });
      const res = await POST(req(data));
      expect(res.status).toBe(400);

      const found = await db
        .select()
        .from(users)
        .where(eq(users.email, data.email as string));
      expect(found).toHaveLength(0);
    },
  );
});

describe("POST /api/auth/signup — terms acceptance", () => {
  it("refuses to create an account when the terms are not accepted", async () => {
    const data = body();
    delete (data as Record<string, unknown>).acceptTerms;
    const res = await POST(req(data));
    expect(res.status).toBe(400);

    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    expect(found).toHaveLength(0);
  });

  it("refuses an explicit false rather than treating it as absent", async () => {
    const data = body({ acceptTerms: false });
    const res = await POST(req(data));
    expect(res.status).toBe(400);

    const found = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email as string));
    expect(found).toHaveLength(0);
  });

  it("records when the terms were accepted", async () => {
    const data = body();
    const before = Date.now();
    const res = await POST(req(data));
    expect(res.status).toBe(200);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email));
    expect(user.termsAcceptedAt).not.toBeNull();
    expect(user.termsAcceptedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
  });
});
