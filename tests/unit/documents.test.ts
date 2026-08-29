import { describe, it, expect } from "vitest";
import { db } from "../../src/db/client";
import { users, documents } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../src/lib/auth/password";
import { getUploadUrl } from "../../src/lib/storage/client";
import {
  createPendingUpload,
  confirmUpload,
  listDocumentsForOwner,
  getAccessibleDocument,
  softDeleteDocument,
} from "../../src/lib/documents";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `docs-biz-${Date.now()}-${Math.random()}@example.test`;
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

describe("createPendingUpload", () => {
  it("rejects a disallowed mime type without creating a row", async () => {
    const owner = await makeUser();
    const result = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "a.exe",
      mimeType: "application/x-msdownload",
      sizeBytes: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("invalid_type");

    const rows = await db.select().from(documents).where(eq(documents.ownerId, owner.id));
    expect(rows).toHaveLength(0);
  });

  it("rejects a file over the 20MB cap", async () => {
    const owner = await makeUser();
    const result = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "a.pdf",
      mimeType: "application/pdf",
      sizeBytes: 21 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("too_large");

    const rows = await db.select().from(documents).where(eq(documents.ownerId, owner.id));
    expect(rows).toHaveLength(0);
  });

  it("creates a pending row with a signed upload URL for a valid request", async () => {
    const owner = await makeUser();
    const result = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "salaire.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.uploadUrl).toContain("http");

    const [row] = await db.select().from(documents).where(eq(documents.id, result.documentId));
    expect(row.uploadedAt).toBeNull();
    expect(row.ownerId).toBe(owner.id);
  });
});

describe("confirmUpload", () => {
  it("returns not_found for a document owned by someone else", async () => {
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

    const result = await confirmUpload(created.documentId, other.id);
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("returns not_uploaded when the object was never actually stored", async () => {
    const owner = await makeUser();
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "a.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!created.ok) throw new Error("unreachable");

    const result = await confirmUpload(created.documentId, owner.id);
    expect(result).toEqual({ ok: false, error: "not_uploaded" });
  });

  it("confirms and makes the document visible once the bytes actually exist", async () => {
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
      body: "fake pdf bytes",
    });

    const result = await confirmUpload(created.documentId, owner.id);
    expect(result).toEqual({ ok: true });

    const listed = await listDocumentsForOwner(owner.id);
    expect(listed.map((d) => d.id)).toContain(created.documentId);
  });
});

describe("listDocumentsForOwner", () => {
  it("excludes unconfirmed and deleted documents", async () => {
    const owner = await makeUser();

    const pending = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "pending.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!pending.ok) throw new Error("unreachable");

    const confirmed = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "confirmed.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!confirmed.ok) throw new Error("unreachable");
    await fetch(confirmed.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "application/pdf" },
      body: "bytes",
    });
    await confirmUpload(confirmed.documentId, owner.id);

    const deleted = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      filename: "deleted.pdf",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!deleted.ok) throw new Error("unreachable");
    await fetch(deleted.uploadUrl, {
      method: "PUT",
      headers: { "content-type": "application/pdf" },
      body: "bytes",
    });
    await confirmUpload(deleted.documentId, owner.id);
    await softDeleteDocument(deleted.documentId);

    const listed = await listDocumentsForOwner(owner.id);
    const ids = listed.map((d) => d.id);
    expect(ids).toContain(confirmed.documentId);
    expect(ids).not.toContain(pending.documentId);
    expect(ids).not.toContain(deleted.documentId);
  });
});

describe("getAccessibleDocument", () => {
  it("allows the owner, denies another client, and allows an admin", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const admin = await makeUser("admin");

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
    await confirmUpload(created.documentId, owner.id);

    expect((await getAccessibleDocument(created.documentId, { id: owner.id, role: "client" })).ok).toBe(true);
    expect((await getAccessibleDocument(created.documentId, { id: other.id, role: "client" })).ok).toBe(false);
    expect((await getAccessibleDocument(created.documentId, { id: admin.id, role: "admin" })).ok).toBe(true);
  });
});
