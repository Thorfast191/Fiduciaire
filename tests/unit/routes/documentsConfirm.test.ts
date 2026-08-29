import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users, auditLog } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload } from "../../../src/lib/documents";
import { POST as confirm } from "../../../src/app/api/documents/[id]/confirm/route";

async function makeUser() {
  const email = `confirm-route-${Date.now()}-${Math.random()}@example.test`;
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

function req() {
  return new NextRequest("http://localhost/api/documents/x/confirm", { method: "POST" });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("POST /api/documents/:id/confirm", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await confirm(req(), withParams("00000000-0000-0000-0000-000000000000"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a document owned by someone else", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "a.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!created.ok) throw new Error("unreachable");

    const { token } = await createSession(other.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await confirm(request, withParams(created.documentId));
    expect(res.status).toBe(404);
  });

  it("returns 400 when the object was never actually stored", async () => {
    const owner = await makeUser();
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "a.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!created.ok) throw new Error("unreachable");

    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await confirm(request, withParams(created.documentId));
    expect(res.status).toBe(400);
  });

  it("confirms a real upload and writes an audit log entry", async () => {
    const owner = await makeUser();
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "a.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!created.ok) throw new Error("unreachable");
    await fetch(created.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "application/pdf" },
      body: "bytes",
    });

    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await confirm(request, withParams(created.documentId));
    expect(res.status).toBe(200);

    const [entry] = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, "document_confirmed"))
      .orderBy(auditLog.createdAt);
    expect(entry).toBeDefined();
  });
});
