import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { POST as createDossierRoute, GET as listDossiers } from "../../../src/app/api/dossiers/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossiers-route-${Date.now()}-${Math.random()}@example.test`;
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

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/dossiers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function getReq(url: string) {
  return new NextRequest(url, { method: "GET" });
}

describe("POST /api/dossiers", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await createDossierRoute(
      postReq({ clientId: "00000000-0000-0000-0000-000000000000", taxYear: 2025 }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a client (admin-only)", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    const request = postReq({ clientId: client.id, taxYear: 2025 });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await createDossierRoute(request);
    expect(res.status).toBe(403);
  });

  it("creates a dossier for a valid admin request", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser();
    const { token } = await createSession(admin.id, {});
    const request = postReq({ clientId: client.id, taxYear: 2025 });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await createDossierRoute(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dossier.clientId).toBe(client.id);
    expect(body.dossier.taxYear).toBe(2025);
    expect(body.dossier.status).toBe("not_started");
  });
});

describe("GET /api/dossiers", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await listDossiers(getReq("http://localhost/api/dossiers"));
    expect(res.status).toBe(401);
  });

  it("returns only the requesting client's own dossiers", async () => {
    const client = await makeUser();
    const other = await makeUser();
    await createDossier({ clientId: client.id, taxYear: 2025 });
    await createDossier({ clientId: other.id, taxYear: 2025 });

    const { token } = await createSession(client.id, {});
    const request = getReq("http://localhost/api/dossiers");
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await listDossiers(request);
    const body = await res.json();
    expect(body.dossiers).toHaveLength(1);
    expect(body.dossiers[0].clientId).toBe(client.id);
  });

  it("requires a clientId query param for an admin", async () => {
    const admin = await makeUser("admin");
    const { token } = await createSession(admin.id, {});
    const request = getReq("http://localhost/api/dossiers");
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await listDossiers(request);
    expect(res.status).toBe(400);
  });

  it("lets an admin list a specific client's dossiers via clientId", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser();
    await createDossier({ clientId: client.id, taxYear: 2025 });

    const { token } = await createSession(admin.id, {});
    const request = getReq(`http://localhost/api/dossiers?clientId=${client.id}`);
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await listDossiers(request);
    const body = await res.json();
    expect(body.dossiers).toHaveLength(1);
    expect(body.dossiers[0].clientId).toBe(client.id);
  });
});
