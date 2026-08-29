import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { POST as uploadUrl } from "../../../src/app/api/documents/upload-url/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `upload-route-${Date.now()}-${Math.random()}@example.test`;
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
  return new NextRequest("http://localhost/api/documents/upload-url", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

describe("POST /api/documents/upload-url", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await uploadUrl(req({ filename: "a.pdf", mimeType: "application/pdf", sizeBytes: 100 }));
    expect(res.status).toBe(401);
  });

  it("rejects an admin (client-only for now)", async () => {
    const admin = await makeUser("admin");
    const { token } = await createSession(admin.id, {});
    const request = req({ filename: "a.pdf", mimeType: "application/pdf", sizeBytes: 100 });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await uploadUrl(request);
    expect(res.status).toBe(403);
  });

  it("rejects a disallowed mime type", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    const request = req({ filename: "a.exe", mimeType: "application/x-msdownload", sizeBytes: 100 });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await uploadUrl(request);
    expect(res.status).toBe(400);
  });

  it("returns a signed upload URL for a valid request", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    const request = req({ filename: "salaire.pdf", mimeType: "application/pdf", sizeBytes: 1024 });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await uploadUrl(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.documentId).toBe("string");
    expect(body.uploadUrl).toContain("http");
  });
});
