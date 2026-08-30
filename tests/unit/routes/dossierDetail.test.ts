import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { createPendingUpload, confirmUpload } from "../../../src/lib/documents";
import { GET as dossierDetail } from "../../../src/app/api/dossiers/[id]/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossier-detail-${Date.now()}-${Math.random()}@example.test`;
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

function req() {
  return new NextRequest("http://localhost/api/dossiers/x", { method: "GET" });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/dossiers/:id", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await dossierDetail(req(), withParams("00000000-0000-0000-0000-000000000000"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a dossier owned by someone else", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(other.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams(dossier.id));
    expect(res.status).toBe(404);
  });

  it("returns 404 for a malformed dossier id", async () => {
    const owner = await makeUser();
    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams("not-a-uuid"));
    expect(res.status).toBe(404);
  });

  it("lets the owner view their dossier with its confirmed documents", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "salaire.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!created.ok) throw new Error("unreachable");
    await fetch(created.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "application/pdf" },
      body: "bytes",
    });
    await confirmUpload(created.documentId, owner.id);

    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams(dossier.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dossier.id).toBe(dossier.id);
    expect(
      body.documents.map((d: { filename: string; category: string }) => ({
        filename: d.filename,
        category: d.category,
      })),
    ).toEqual([{ filename: "salaire.pdf", category: "salaire" }]);
  });

  it("lets an admin view any client's dossier", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(admin.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams(dossier.id));
    expect(res.status).toBe(200);
  });
});
