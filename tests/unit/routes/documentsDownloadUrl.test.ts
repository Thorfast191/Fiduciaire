import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload, confirmUpload } from "../../../src/lib/documents";
import { GET as downloadUrl } from "../../../src/app/api/documents/[id]/download-url/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `download-route-${Date.now()}-${Math.random()}@example.test`;
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
  return new NextRequest("http://localhost/api/documents/x/download-url", { method: "GET" });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/documents/:id/download-url", () => {
  it("lets the owner download", async () => {
    const owner = await makeUser();
    const docId = await uploadConfirmedDoc(owner.id);

    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await downloadUrl(request, withParams(docId));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.downloadUrl).toContain("http");
  });

  it("returns 404 for another client", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const docId = await uploadConfirmedDoc(owner.id);

    const { token } = await createSession(other.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await downloadUrl(request, withParams(docId));
    expect(res.status).toBe(404);
  });

  it("lets an admin download", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const docId = await uploadConfirmedDoc(owner.id);

    const { token } = await createSession(admin.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await downloadUrl(request, withParams(docId));
    expect(res.status).toBe(200);
  });
});
