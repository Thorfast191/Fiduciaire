import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload, confirmUpload } from "../../../src/lib/documents";
import { GET as list } from "../../../src/app/api/documents/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `list-route-${Date.now()}-${Math.random()}@example.test`;
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

async function uploadConfirmedDoc(ownerId: string, filename: string) {
  const created = await createPendingUpload({
    ownerId,
    uploadedBy: ownerId,
    filename,
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

function req(url: string) {
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/documents", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await list(req("http://localhost/api/documents"));
    expect(res.status).toBe(401);
  });

  it("returns only the requesting client's own confirmed documents", async () => {
    const client = await makeUser();
    const other = await makeUser();
    await uploadConfirmedDoc(client.id, "mine.pdf");
    await uploadConfirmedDoc(other.id, "not-mine.pdf");

    const { token } = await createSession(client.id, {});
    const request = req("http://localhost/api/documents");
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await list(request);
    const body = await res.json();
    expect(body.documents.map((d: { filename: string }) => d.filename)).toEqual(["mine.pdf"]);
  });

  it("requires a clientId query param for an admin", async () => {
    const admin = await makeUser("admin");
    const { token } = await createSession(admin.id, {});
    const request = req("http://localhost/api/documents");
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await list(request);
    expect(res.status).toBe(400);
  });

  it("lets an admin list a specific client's documents via clientId", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser();
    await uploadConfirmedDoc(client.id, "for-admin.pdf");

    const { token } = await createSession(admin.id, {});
    const request = req(`http://localhost/api/documents?clientId=${client.id}`);
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await list(request);
    const body = await res.json();
    expect(body.documents.map((d: { filename: string }) => d.filename)).toEqual(["for-admin.pdf"]);
  });

  it("returns 400 for a malformed clientId instead of a database error", async () => {
    const admin = await makeUser("admin");
    const { token } = await createSession(admin.id, {});
    const request = req("http://localhost/api/documents?clientId=not-a-uuid");
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await list(request);
    expect(res.status).toBe(400);
  });
});
