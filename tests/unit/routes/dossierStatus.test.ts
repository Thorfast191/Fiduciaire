import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users, auditLog, dossiers } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { PATCH as setStatus } from "../../../src/app/api/dossiers/[id]/status/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossier-status-${Date.now()}-${Math.random()}@example.test`;
  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "A",
      lastName: "B",
      role,
    })
    .returning();
  return user;
}

function req(body: unknown) {
  return new NextRequest("http://localhost/api/dossiers/x/status", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/dossiers/:id/status", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await setStatus(
      req({ status: "submitted" }),
      withParams("00000000-0000-0000-0000-000000000000"),
    );
    expect(res.status).toBe(401);
  });

  it("blocks a client submitting a declaration directly — payment is required", async () => {
    const owner = await makeUser();
    // createDossier defaults to a declaration, which is now pay-to-submit.
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(owner.id, {});
    const request = req({ status: "submitted" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams(dossier.id));
    expect(res.status).toBe(402);

    const [updated] = await db.select().from(dossiers).where(eq(dossiers.id, dossier.id));
    expect(updated.status).toBe("not_started");
  });

  it("lets the owner submit a non-declaration prestation directly", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({
      clientId: owner.id,
      taxYear: 2025,
      serviceType: "capital",
    });

    const { token } = await createSession(owner.id, {});
    const request = req({ status: "submitted" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams(dossier.id));
    expect(res.status).toBe(200);

    const [updated] = await db.select().from(dossiers).where(eq(dossiers.id, dossier.id));
    expect(updated.status).toBe("submitted");
  });

  it("rejects a client trying to set in_review", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(owner.id, {});
    const request = req({ status: "in_review" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams(dossier.id));
    expect(res.status).toBe(400);
  });

  it("rejects a non-owner client with a generic 404", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(other.id, {});
    const request = req({ status: "submitted" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams(dossier.id));
    expect(res.status).toBe(404);
  });

  it("lets an admin move a dossier through every status and writes an audit log entry each time", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(admin.id, {});

    for (const status of ["submitted", "in_review", "completed"] as const) {
      const request = req({ status });
      request.cookies.set(SESSION_COOKIE_NAME, token);
      const res = await setStatus(request, withParams(dossier.id));
      expect(res.status).toBe(200);
    }

    const [updated] = await db.select().from(dossiers).where(eq(dossiers.id, dossier.id));
    expect(updated.status).toBe("completed");

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, "dossier_status_changed"));
    expect(entries.length).toBeGreaterThanOrEqual(3);
  });

  it("returns 404 for a malformed dossier id", async () => {
    const admin = await makeUser("admin");
    const { token } = await createSession(admin.id, {});
    const request = req({ status: "submitted" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams("not-a-uuid"));
    expect(res.status).toBe(404);
  });
});
