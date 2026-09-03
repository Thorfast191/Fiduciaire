import { describe, it, expect } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { users, documents } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createDossier } from "@/lib/dossiers";
import { createPendingUpload, confirmUpload } from "@/lib/documents";
import { getObjectMetadata, objectExists } from "@/lib/storage/client";

async function makeClient() {
  const [user] = await db
    .insert(users)
    .values({
      email: `upver-${Date.now()}-${Math.random()}@example.test`,
      passwordHash: await hashPassword("irrelevant-here"),
      firstName: "U",
      lastName: "V",
      role: "client",
    })
    .returning();
  return user;
}

/** Requests an upload slot, then PUTs `body` with `actualType` to the URL. */
async function upload(opts: {
  claimedType: string;
  claimedSize: number;
  actualType: string;
  /** ASCII only, so byte length equals string length. */
  body: string;
}) {
  const user = await makeClient();
  const dossier = await createDossier({
    clientId: user.id,
    taxYear: 950000 + Math.floor(Math.random() * 40000),
  });

  const pending = await createPendingUpload({
    ownerId: user.id,
    uploadedBy: user.id,
    dossierId: dossier.id,
    filename: "claim.pdf",
    category: "salaire",
    mimeType: opts.claimedType,
    sizeBytes: opts.claimedSize,
  });

  if (!pending.ok) throw new Error(`pending failed: ${pending.error}`);

  const res = await fetch(pending.uploadUrl, {
    method: "PUT",
    headers: { "content-type": opts.actualType },
    body: opts.body,
  });
  expect(res.ok).toBe(true);

  return { user, documentId: pending.documentId };
}

describe("confirmUpload verifies what was actually stored", () => {
  it("records the object's real size and type, not the claimed ones", async () => {
    const body = "a".repeat(2048);
    const { user, documentId } = await upload({
      claimedType: "application/pdf",
      claimedSize: 5,
      actualType: "image/png",
      body,
    });

    const result = await confirmUpload(documentId, user.id);
    expect(result.ok).toBe(true);

    const [row] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));

    // The claim was 5 bytes of PDF; the bucket holds 2048 bytes of PNG.
    expect(row.sizeBytes).toBe(2048);
    expect(row.mimeType).toBe("image/png");
    expect(row.uploadedAt).not.toBeNull();
  });

  it("rejects a disallowed type even though the claim was allowed", async () => {
    // This is the original defect: claim image/png, upload an executable.
    const { user, documentId } = await upload({
      claimedType: "image/png",
      claimedSize: 5,
      actualType: "application/x-msdownload",
      body: "b".repeat(4096),
    });

    const result = await confirmUpload(documentId, user.id);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_type");

    const [row] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, documentId));

    // Never becomes visible, and the bytes do not stay addressable.
    expect(row.uploadedAt).toBeNull();
    expect(row.deletedAt).not.toBeNull();
    expect(await objectExists(row.storageKey)).toBe(false);
  });

  it("refuses to re-confirm a rejected document", async () => {
    const { user, documentId } = await upload({
      claimedType: "image/png",
      claimedSize: 5,
      actualType: "application/x-msdownload",
      body: "c".repeat(16),
    });

    await confirmUpload(documentId, user.id);
    const again = await confirmUpload(documentId, user.id);

    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.error).toBe("not_found");
  });

  it("reports null metadata for an object that was never uploaded", async () => {
    expect(await getObjectMetadata("clients/does/not-exist")).toBeNull();
  });
});
