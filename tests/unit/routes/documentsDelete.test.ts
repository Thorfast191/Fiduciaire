import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload, confirmUpload, listDocumentsForOwner } from "../../../src/lib/documents";
import { DELETE as deleteDoc } from "../../../src/app/api/documents/[id]/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `delete-route-${Date.now()}-${Math.random()}@example.test`;
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

async function uploadConfirmedDoc(ownerId: string) {
  const created = await createPendingUpload({
    ownerId,
    uploadedBy: ownerId,
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
  await confirmUpload(created.documentId, ownerId);
  return created.documentId;
}

function req() {
  return new NextRequest("http://localhost/api/documents/x", { method: "DELETE" });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("DELETE /api/documents/:id", () => {
  it("returns 404 for another client and leaves the document intact", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const docId = await uploadConfirmedDoc(owner.id);

    const { token } = await createSession(other.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await deleteDoc(request, withParams(docId));
    expect(res.status).toBe(404);

    const stillListed = await listDocumentsForOwner(owner.id);
    expect(stillListed.map((d) => d.id)).toContain(docId);
  });

  it("lets the owner delete, removing it from their list", async () => {
    const owner = await makeUser();
    const docId = await uploadConfirmedDoc(owner.id);

    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await deleteDoc(request, withParams(docId));
    expect(res.status).toBe(200);

    const listed = await listDocumentsForOwner(owner.id);
    expect(listed.map((d) => d.id)).not.toContain(docId);
  });

  it("lets an admin delete a client's document", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const docId = await uploadConfirmedDoc(owner.id);

    const { token } = await createSession(admin.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await deleteDoc(request, withParams(docId));
    expect(res.status).toBe(200);
  });
});
