import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "../../../src/db/client";
import { taxPeriods, users, type Role } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import {
  createSession,
  SESSION_COOKIE_NAME,
} from "../../../src/lib/auth/session";
import { POST as createPeriod } from "../../../src/app/api/tax-periods/route";
import { POST as recordPayment } from "../../../src/app/api/admin/payments/route";
import { GET as listAdmins } from "../../../src/app/api/admins/route";

/**
 * An ordinary admin is a case worker: their personal statistics and their
 * dossiers, nothing firm-wide. The sidebar shows them two entries and the page
 * guards redirect them, but a route handler runs outside the middleware's
 * protected-path check, so each firm-wide route has to refuse them itself.
 *
 * These three were reachable by hand until 2026-09-13 even though their
 * screens were not, which is the gap this locks shut.
 */
async function signIn(role: Role) {
  const [user] = await db
    .insert(users)
    .values({
      email: `guard-${role}-${Date.now()}-${Math.random()}@example.test`,
      passwordHash: await hashPassword("LocalDev2026!"),
      firstName: "Guard",
      lastName: "Probe",
      role,
    })
    .returning();
  const { token } = await createSession(user.id, {});
  return { user, token };
}

/** A synthetic year no real period uses, fresh on every run. */
function freeYear(): number {
  return 2090 + Math.floor(Math.random() * 10);
}

function post(url: string, body: unknown, token: string) {
  const request = new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  request.cookies.set(SESSION_COOKIE_NAME, token);
  return request;
}

function get(url: string, token: string) {
  const request = new NextRequest(url);
  request.cookies.set(SESSION_COOKIE_NAME, token);
  return request;
}

describe("firm-wide routes are the super admin's alone", () => {
  it("refuses an ordinary admin a new tax period", async () => {
    const { token } = await signIn("admin");
    const res = await createPeriod(
      post("http://localhost/api/tax-periods", { year: freeYear() }, token),
    );
    expect(res.status).toBe(403);
  });

  it("lets a super admin create one", async () => {
    const { token } = await signIn("super_admin");
    const year = freeYear();
    try {
      const res = await createPeriod(
        post("http://localhost/api/tax-periods", { year }, token),
      );
      expect(res.status).toBe(200);
    } finally {
      // Leaving it behind makes the next run collide with its own period.
      await db.delete(taxPeriods).where(eq(taxPeriods.year, year));
    }
  });

  it("refuses an ordinary admin the payment register", async () => {
    const { token } = await signIn("admin");
    const client = await signIn("client");
    const res = await recordPayment(
      post(
        "http://localhost/api/admin/payments",
        {
          clientId: client.user.id,
          taxYear: 2025,
          label: "Probe",
          method: "bank_transfer",
          amountChf: 10,
          status: "paid",
        },
        token,
      ),
    );
    expect(res.status).toBe(403);
  });

  it("refuses an ordinary admin the administrator roster", async () => {
    const { token } = await signIn("admin");
    const res = await listAdmins(get("http://localhost/api/admins", token));
    expect(res.status).toBe(403);
  });

  it("refuses a client outright", async () => {
    const { token } = await signIn("client");
    const res = await createPeriod(
      post("http://localhost/api/tax-periods", { year: freeYear() }, token),
    );
    expect(res.status).toBe(403);
  });
});
