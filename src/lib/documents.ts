import crypto from "node:crypto";
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { logger } from "@/lib/logger";
import { documents, type Document, type Role } from "@/db/schema";
import {
  deleteObject,
  getObjectMetadata,
  getUploadUrl,
} from "@/lib/storage/client";

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
] as const;
export const MAX_SIZE_BYTES = 20 * 1024 * 1024;
export const DOCUMENT_CATEGORIES = [
  "salaire",
  "releves_bancaires",
  "assurance",
  "pilier3",
  "justificatifs",
  "autre",
] as const;

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildStorageKey(
  ownerId: string,
  documentId: string,
  filename: string,
): string {
  return `clients/${ownerId}/${documentId}-${sanitizeFilename(filename)}`;
}

export type CreateUploadResult =
  | { ok: true; documentId: string; uploadUrl: string }
  | { ok: false; error: "invalid_type" | "too_large" | "invalid_category" };

export async function createPendingUpload(params: {
  ownerId: string;
  uploadedBy: string;
  dossierId: string;
  filename: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<CreateUploadResult> {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(params.mimeType)) {
    return { ok: false, error: "invalid_type" };
  }
  if (params.sizeBytes <= 0 || params.sizeBytes > MAX_SIZE_BYTES) {
    return { ok: false, error: "too_large" };
  }
  if (!(DOCUMENT_CATEGORIES as readonly string[]).includes(params.category)) {
    return { ok: false, error: "invalid_category" };
  }

  const documentId = crypto.randomUUID();
  const storageKey = buildStorageKey(
    params.ownerId,
    documentId,
    params.filename,
  );

  await db.insert(documents).values({
    id: documentId,
    ownerId: params.ownerId,
    uploadedBy: params.uploadedBy,
    dossierId: params.dossierId,
    filename: params.filename,
    category: params.category as (typeof DOCUMENT_CATEGORIES)[number],
    storageKey,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
  });

  const uploadUrl = await getUploadUrl(storageKey, params.mimeType);
  return { ok: true, documentId, uploadUrl };
}

export type ConfirmUploadResult =
  | { ok: true }
  | {
      ok: false;
      error: "not_found" | "not_uploaded" | "invalid_type" | "too_large";
    };

/**
 * Marks an upload visible, but only after checking what was *actually* stored.
 *
 * The size and MIME type recorded by `createPendingUpload` are the client's
 * claim: a presigned PUT does not bind Content-Length, and the signed
 * Content-Type is not enforced by every S3-compatible backend, so a caller can
 * request a URL for a 5-byte PNG and upload an arbitrary executable. This reads
 * the object's real metadata, re-applies the allow-list and size cap to it, and
 * persists the true values — so what the UI lists is what is in the bucket.
 *
 * An object that fails the checks is removed rather than left addressable, and
 * its row is soft-deleted so the confirmation cannot simply be retried.
 */
export async function confirmUpload(
  documentId: string,
  requesterId: string,
): Promise<ConfirmUploadResult> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));
  if (!doc || doc.ownerId !== requesterId || doc.deletedAt) {
    return { ok: false, error: "not_found" };
  }
  if (doc.uploadedAt) {
    return { ok: true };
  }

  const metadata = await getObjectMetadata(doc.storageKey);
  if (!metadata) {
    return { ok: false, error: "not_uploaded" };
  }

  async function reject(
    error: "invalid_type" | "too_large",
  ): Promise<ConfirmUploadResult> {
    await deleteObject(doc.storageKey);
    await db
      .update(documents)
      .set({ deletedAt: new Date() })
      .where(eq(documents.id, documentId));
    return { ok: false, error };
  }

  // Some backends report no type at all; treat that as unacceptable rather
  // than letting it through as an implicit default.
  const actualType = metadata.contentType.split(";")[0].trim().toLowerCase();
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(actualType)) {
    return reject("invalid_type");
  }

  if (metadata.contentLength <= 0 || metadata.contentLength > MAX_SIZE_BYTES) {
    return reject("too_large");
  }

  await db
    .update(documents)
    .set({
      uploadedAt: new Date(),
      mimeType: actualType,
      sizeBytes: metadata.contentLength,
    })
    .where(eq(documents.id, documentId));
  return { ok: true };
}

export async function listDocumentsForOwner(
  ownerId: string,
): Promise<Document[]> {
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.ownerId, ownerId),
        isNotNull(documents.uploadedAt),
        isNull(documents.deletedAt),
      ),
    )
    .orderBy(desc(documents.createdAt));
}

export async function listDocumentsForDossier(
  dossierId: string,
): Promise<Document[]> {
  return db
    .select()
    .from(documents)
    .where(
      and(
        eq(documents.dossierId, dossierId),
        isNotNull(documents.uploadedAt),
        isNull(documents.deletedAt),
      ),
    )
    .orderBy(desc(documents.createdAt));
}

export type AccessCheckResult =
  { ok: true; document: Document } | { ok: false; error: "not_found" };

export async function getAccessibleDocument(
  documentId: string,
  requester: { id: string; role: Role },
): Promise<AccessCheckResult> {
  const [doc] = await db
    .select()
    .from(documents)
    .where(eq(documents.id, documentId));
  if (!doc || doc.deletedAt || !doc.uploadedAt) {
    return { ok: false, error: "not_found" };
  }
  const isOwner = doc.ownerId === requester.id;
  const isAdmin =
    requester.role === "admin" || requester.role === "super_admin";
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "not_found" };
  }
  return { ok: true, document: doc };
}

/**
 * Marks a document deleted and removes its bytes from storage.
 *
 * The row is kept — `deletedAt` is the audit trail of what was held and when it
 * went — but the object itself is purged. Leaving it in the bucket would mean a
 * client who deletes a tax document still has it stored indefinitely, with no
 * lifecycle rule to remove it and no way to tell from the UI.
 *
 * Order matters: the row is marked first so the deletion is honoured even if
 * storage is unreachable. A failed object delete leaves an orphan, which is a
 * cleanup problem; a failed row update would leave a document the client
 * believes is gone still listed, which is a correctness problem.
 */
export async function softDeleteDocument(documentId: string): Promise<void> {
  const [doc] = await db
    .select({ storageKey: documents.storageKey })
    .from(documents)
    .where(eq(documents.id, documentId));

  await db
    .update(documents)
    .set({ deletedAt: new Date() })
    .where(eq(documents.id, documentId));

  if (!doc) return;

  try {
    await deleteObject(doc.storageKey);
  } catch (err) {
    logger.error(
      { err, documentId, storageKey: doc.storageKey },
      "document row soft-deleted but its object could not be removed",
    );
  }
}
