import crypto from "node:crypto";
import { and, desc, eq, isNull, isNotNull } from "drizzle-orm";
import { db } from "@/db/client";
import { documents, type Document, type Role } from "@/db/schema";
import { getUploadUrl, objectExists } from "@/lib/storage/client";

export const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png"] as const;
export const MAX_SIZE_BYTES = 20 * 1024 * 1024;

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function buildStorageKey(ownerId: string, documentId: string, filename: string): string {
  return `clients/${ownerId}/${documentId}-${sanitizeFilename(filename)}`;
}

export type CreateUploadResult =
  | { ok: true; documentId: string; uploadUrl: string }
  | { ok: false; error: "invalid_type" | "too_large" };

export async function createPendingUpload(params: {
  ownerId: string;
  uploadedBy: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}): Promise<CreateUploadResult> {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(params.mimeType)) {
    return { ok: false, error: "invalid_type" };
  }
  if (params.sizeBytes <= 0 || params.sizeBytes > MAX_SIZE_BYTES) {
    return { ok: false, error: "too_large" };
  }

  const documentId = crypto.randomUUID();
  const storageKey = buildStorageKey(params.ownerId, documentId, params.filename);

  await db.insert(documents).values({
    id: documentId,
    ownerId: params.ownerId,
    uploadedBy: params.uploadedBy,
    filename: params.filename,
    storageKey,
    mimeType: params.mimeType,
    sizeBytes: params.sizeBytes,
  });

  const uploadUrl = await getUploadUrl(storageKey, params.mimeType);
  return { ok: true, documentId, uploadUrl };
}

export type ConfirmUploadResult =
  | { ok: true }
  | { ok: false; error: "not_found" | "not_uploaded" };

export async function confirmUpload(
  documentId: string,
  requesterId: string,
): Promise<ConfirmUploadResult> {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
  if (!doc || doc.ownerId !== requesterId || doc.deletedAt) {
    return { ok: false, error: "not_found" };
  }
  if (doc.uploadedAt) {
    return { ok: true };
  }

  const exists = await objectExists(doc.storageKey);
  if (!exists) {
    return { ok: false, error: "not_uploaded" };
  }

  await db.update(documents).set({ uploadedAt: new Date() }).where(eq(documents.id, documentId));
  return { ok: true };
}

export async function listDocumentsForOwner(ownerId: string): Promise<Document[]> {
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

export type AccessCheckResult =
  | { ok: true; document: Document }
  | { ok: false; error: "not_found" };

export async function getAccessibleDocument(
  documentId: string,
  requester: { id: string; role: Role },
): Promise<AccessCheckResult> {
  const [doc] = await db.select().from(documents).where(eq(documents.id, documentId));
  if (!doc || doc.deletedAt || !doc.uploadedAt) {
    return { ok: false, error: "not_found" };
  }
  const isOwner = doc.ownerId === requester.id;
  const isAdmin = requester.role === "admin" || requester.role === "super_admin";
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "not_found" };
  }
  return { ok: true, document: doc };
}

export async function softDeleteDocument(documentId: string): Promise<void> {
  await db.update(documents).set({ deletedAt: new Date() }).where(eq(documents.id, documentId));
}
