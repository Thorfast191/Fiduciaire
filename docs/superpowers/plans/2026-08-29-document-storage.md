# Document Storage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give clients a way to upload, list, download, and delete files through their portal, and admins the same for any client, backed by Infomaniak Object Storage (MinIO locally) — with the app server never touching raw file bytes.

**Architecture:** Direct-to-storage uploads/downloads via short-lived signed URLs. A new `documents` table tracks metadata only; a low-level storage client wraps the S3 SDK against an S3-compatible endpoint (Infomaniak in production, MinIO locally — same code, different endpoint config); a business-logic layer composes storage + database with the validation and access-control rules; five API routes expose it; a client component wires it into the existing `/portal` page.

**Tech Stack:** `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`, Drizzle ORM, PostgreSQL, Vitest, Playwright — all already established by the Foundation sub-project this builds on.

**Spec:** `docs/superpowers/specs/2026-08-29-document-storage-design.md`

## Global Constraints

- Scope is the storage primitive only — no dossier/tax-year/category model. That belongs to the Client Portal sub-project.
- Allowed file types: `application/pdf`, `image/jpeg`, `image/png`. Max size: 20 MB.
- Any `admin`/`super_admin` may access any client's documents; no per-client admin assignment.
- No application-level encryption beyond Infomaniak's own encryption-at-rest + TLS + private-bucket-with-signed-URLs. No virus scanning.
- A document is invisible to every list/download/delete endpoint until its upload is confirmed to actually exist in storage (`uploadedAt IS NOT NULL`) and not soft-deleted (`deletedAt IS NULL`).
- A requester who doesn't own a document gets the same generic "not found" as a document that doesn't exist — never a distinguishable error.
- Every confirmed upload, download-url request, and delete writes an `audit_log` entry, matching the pattern already established for every other state-changing action in the app.
- API routes read the session via `request.cookies` + `getSessionUserByToken` directly (not `next/headers`'s `cookies()`), so they stay unit-testable by importing and invoking the handler directly — same reasoning Foundation's auth routes already follow.
- Local dev and CI never touch real Infomaniak resources — MinIO (already in `docker-compose.yml`) stands in.

---

## Task 1: Database schema & migration

**Files:**
- Modify: `src/db/schema.ts`
- Test: none (schema change verified via migration application, per Foundation's Task 3 pattern)

**Interfaces:**
- Produces: `documents` table and `Document = typeof documents.$inferSelect` type, added to `src/db/schema.ts` alongside the existing `users`/`sessions`/`otpCodes`/`auditLog` tables (all unchanged).

- [ ] **Step 1: Add the `documents` table to the schema**

Add this table definition to `src/db/schema.ts`, after the existing `auditLog` table definition and before the type exports at the bottom:

```typescript
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  filename: text("filename").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
```

Add `export type Document = typeof documents.$inferSelect;` alongside the existing type exports at the bottom of the file (after `export type AuditLogEntry = ...`).

- [ ] **Step 2: Generate and apply the migration**

Run: `npm run db:generate`
Expected: a new SQL file appears under `src/db/migrations/`, containing a `CREATE TABLE "documents"` statement with the columns above and two foreign keys to `users(id)`.

Run: `npm run db:migrate`
Expected: completes without error.

Run: `psql "$DATABASE_URL" -c '\d documents'` (or the equivalent `docker exec` form if connecting to the Dockerized Postgres — e.g. `docker exec fiduciaire-postgres-1 psql -U fiduvia -d fiduvia -c '\d documents'`)
Expected: lists all 9 columns with the correct types, and two foreign-key constraints referencing `users`.

- [ ] **Step 3: Commit**

```bash
git add src/db/schema.ts src/db/migrations
git commit -m "Add documents table"
```

---

## Task 2: Docker Compose MinIO bucket auto-creation + env vars

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`

**Interfaces:**
- Produces: a `fiduvia-documents` bucket that exists automatically in the local MinIO instance whenever `docker compose up -d` runs — no manual step required, matching how `db:migrate` already automates the database side.

Current `docker-compose.yml`'s `minio` service (unchanged, shown for context):

```yaml
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: fiduvia
      MINIO_ROOT_PASSWORD: fiduvia123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio-data:/data
```

- [ ] **Step 1: Add a one-shot bucket-creation service**

Add this service to `docker-compose.yml`, alongside the existing `postgres`/`minio`/`mailhog` services (order doesn't matter, but placing it right after `minio` reads naturally):

```yaml
  minio-init:
    image: minio/mc:latest
    depends_on:
      - minio
    entrypoint: >
      /bin/sh -c "
      until mc alias set local http://minio:9000 fiduvia fiduvia123; do sleep 1; done;
      mc mb --ignore-existing local/fiduvia-documents;
      "
```

This uses MinIO's own client image to wait for the `minio` service to accept connections, then creates the `fiduvia-documents` bucket if it doesn't already exist (`--ignore-existing` makes this safe to run every time `docker compose up` runs, not just the first time). This container exits after running — that's expected, it's a one-shot init task, not a long-running service.

- [ ] **Step 2: Verify it works**

Run: `docker compose up -d`
Run: `docker compose logs minio-init`
Expected: output shows the `mc alias set` and `mc mb` commands succeeding (look for `Bucket created successfully` or `already own it`, either is fine).

Run: `docker exec fiduciaire-minio-1 mc ls local/ --json 2>&1 || echo "(if this specific check fails, verify via the MinIO console at http://localhost:9001 instead — log in with fiduvia/fiduvia123 and confirm the fiduvia-documents bucket is listed)"`

Expected: the `fiduvia-documents` bucket is visible one way or another.

- [ ] **Step 3: Add storage environment variables to `.env.example`**

Current `.env.example` (unchanged lines shown for context):
```
DATABASE_URL=postgres://fiduvia:fiduvia@localhost:5432/fiduvia
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Fiduvia <no-reply@fiduvia.ch>"
```

Add these lines:
```
STORAGE_ENDPOINT=http://localhost:9000
STORAGE_BUCKET=fiduvia-documents
STORAGE_ACCESS_KEY_ID=fiduvia
STORAGE_SECRET_ACCESS_KEY=fiduvia123
STORAGE_REGION=us-east-1
```

(`us-east-1` is the conventional placeholder region MinIO and other S3-compatible services expect even when region doesn't carry real meaning locally.)

Also update your own local `.env` (not committed) with the same 5 lines, copying `.env.example`'s values — the implementer's own `.env` needs these for later tasks' tests to pass.

- [ ] **Step 4: Commit**

```bash
git add docker-compose.yml .env.example
git commit -m "Add MinIO bucket auto-creation and storage env vars"
```

---

## Task 3: Storage env vars in `src/lib/env.ts`

**Files:**
- Modify: `src/lib/env.ts`
- Test: `tests/unit/env.test.ts` (modify)

**Interfaces:**
- Consumes: nothing new.
- Produces: `env.STORAGE_ENDPOINT`, `env.STORAGE_BUCKET`, `env.STORAGE_ACCESS_KEY_ID`, `env.STORAGE_SECRET_ACCESS_KEY`, `env.STORAGE_REGION` (all `string`) — consumed by Task 4's storage client.

Current `src/lib/env.ts` (unchanged parts shown for context):

```typescript
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres://")),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().min(1),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
```

- [ ] **Step 1: Extend the failing test with storage env vars**

Replace the `REQUIRED` object and add an assertion in `tests/unit/env.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const REQUIRED = {
  DATABASE_URL: "postgres://fiduvia:fiduvia@localhost:5432/fiduvia",
  SMTP_HOST: "localhost",
  SMTP_PORT: "1025",
  SMTP_FROM: "Fiduvia <no-reply@fiduvia.ch>",
  STORAGE_ENDPOINT: "http://localhost:9000",
  STORAGE_BUCKET: "fiduvia-documents",
  STORAGE_ACCESS_KEY_ID: "fiduvia",
  STORAGE_SECRET_ACCESS_KEY: "fiduvia123",
  STORAGE_REGION: "us-east-1",
};

describe("env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    Object.assign(process.env, REQUIRED);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  it("parses valid environment variables", async () => {
    vi.resetModules();
    const { env } = await import("../../src/lib/env");
    expect(env.DATABASE_URL).toBe(REQUIRED.DATABASE_URL);
    expect(env.SMTP_PORT).toBe(1025);
    expect(env.STORAGE_BUCKET).toBe(REQUIRED.STORAGE_BUCKET);
  });

  it("throws when a required variable is missing", async () => {
    vi.resetModules();
    delete process.env.DATABASE_URL;
    await expect(import("../../src/lib/env")).rejects.toThrow();
  });

  it("throws when a storage variable is missing", async () => {
    vi.resetModules();
    delete process.env.STORAGE_BUCKET;
    await expect(import("../../src/lib/env")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/env.test.ts`
Expected: FAIL — `env.STORAGE_BUCKET` is `undefined` (Zod strips unrecognized keys by default), so the first assertion's `toBe` fails.

- [ ] **Step 3: Add the storage fields to the schema**

```typescript
import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().url().or(z.string().startsWith("postgres://")),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().int().positive(),
  SMTP_USER: z.string().optional().default(""),
  SMTP_PASS: z.string().optional().default(""),
  SMTP_FROM: z.string().min(1),
  STORAGE_ENDPOINT: z.string().url(),
  STORAGE_BUCKET: z.string().min(1),
  STORAGE_ACCESS_KEY_ID: z.string().min(1),
  STORAGE_SECRET_ACCESS_KEY: z.string().min(1),
  STORAGE_REGION: z.string().min(1),
});

export const env = schema.parse(process.env);
export type Env = z.infer<typeof schema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/env.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/env.ts tests/unit/env.test.ts
git commit -m "Add storage environment variables"
```

---

## Task 4: Storage client (signed URLs against the S3-compatible endpoint)

**Files:**
- Create: `src/lib/storage/client.ts`
- Test: `tests/unit/storage/client.test.ts`
- Modify: `package.json` (add `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)

**Interfaces:**
- Consumes: `env.STORAGE_ENDPOINT`, `env.STORAGE_BUCKET`, `env.STORAGE_ACCESS_KEY_ID`, `env.STORAGE_SECRET_ACCESS_KEY`, `env.STORAGE_REGION` (Task 3).
- Produces: `getUploadUrl(key: string, mimeType: string): Promise<string>`, `getDownloadUrl(key: string, filename: string): Promise<string>`, `objectExists(key: string): Promise<boolean>` — consumed by Task 5's business-logic layer.

- [ ] **Step 1: Install the AWS SDK packages**

Run: `npm install @aws-sdk/client-s3@^3 @aws-sdk/s3-request-presigner@^3`
Expected: `package.json` and `package-lock.json` gain the two dependencies.

- [ ] **Step 2: Write the failing test**

Create `tests/unit/storage/client.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { getUploadUrl, getDownloadUrl, objectExists } from "../../../src/lib/storage/client";

describe("storage client (round-trip against the local MinIO container)", () => {
  it("uploads via a signed PUT URL, confirms existence, and downloads the same bytes", async () => {
    const key = `test/${Date.now()}-${Math.random()}.txt`;
    const body = "hello fiduvia";

    const uploadUrl = await getUploadUrl(key, "text/plain");
    const putRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "content-type": "text/plain" },
      body,
    });
    expect(putRes.ok).toBe(true);

    expect(await objectExists(key)).toBe(true);
    expect(await objectExists(`${key}-does-not-exist`)).toBe(false);

    const downloadUrl = await getDownloadUrl(key, "hello.txt");
    const getRes = await fetch(downloadUrl);
    expect(getRes.ok).toBe(true);
    expect(await getRes.text()).toBe(body);
  });
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `npm test -- tests/unit/storage/client.test.ts`
Expected: FAIL — `src/lib/storage/client.ts` does not exist yet (module not found).

- [ ] **Step 4: Implement the storage client**

Create `src/lib/storage/client.ts`:

```typescript
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/lib/env";

const SIGNED_URL_TTL_SECONDS = 5 * 60;

// Path-style addressing (bucket in the URL path, not a subdomain) is
// required for MinIO and works identically against Infomaniak Object
// Storage — this is what makes the same client code work against both.
const client = new S3Client({
  endpoint: env.STORAGE_ENDPOINT,
  region: env.STORAGE_REGION,
  credentials: {
    accessKeyId: env.STORAGE_ACCESS_KEY_ID,
    secretAccessKey: env.STORAGE_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,
});

export async function getUploadUrl(key: string, mimeType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: key,
    ContentType: mimeType,
  });
  return getSignedUrl(client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}

export async function getDownloadUrl(key: string, filename: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: env.STORAGE_BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(client, command, { expiresIn: SIGNED_URL_TTL_SECONDS });
}

export async function objectExists(key: string): Promise<boolean> {
  try {
    await client.send(new HeadObjectCommand({ Bucket: env.STORAGE_BUCKET, Key: key }));
    return true;
  } catch (err) {
    const name = (err as { name?: string }).name;
    if (name === "NotFound" || name === "NoSuchKey") return false;
    throw err;
  }
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- tests/unit/storage/client.test.ts`
Expected: PASS. This hits the real local MinIO container (`docker compose up -d` must be running) — if it fails with a connection error, verify `docker ps` shows `minio` healthy and `.env` has the `STORAGE_*` vars from Task 2.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json src/lib/storage tests/unit/storage
git commit -m "Add S3-compatible storage client"
```

---

## Task 5: Documents business-logic layer

**Files:**
- Create: `src/lib/documents.ts`
- Test: `tests/unit/documents.test.ts`

**Interfaces:**
- Consumes: `getUploadUrl`, `getDownloadUrl` (unused here — download URL generation stays in the route, Task 9), `objectExists` from `src/lib/storage/client.ts` (Task 4); `documents`, `type Document`, `type Role` from `src/db/schema.ts` (Task 1); `db` from `src/db/client.ts`.
- Produces: `ALLOWED_MIME_TYPES`, `MAX_SIZE_BYTES`, `createPendingUpload(params): Promise<CreateUploadResult>`, `confirmUpload(documentId, requesterId): Promise<ConfirmUploadResult>`, `listDocumentsForOwner(ownerId): Promise<Document[]>`, `getAccessibleDocument(documentId, requester): Promise<AccessCheckResult>`, `softDeleteDocument(documentId): Promise<void>` — consumed by Tasks 6-10's routes.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/documents.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/documents.test.ts`
Expected: FAIL — `src/lib/documents.ts` does not exist yet.

- [ ] **Step 3: Implement the business-logic layer**

Create `src/lib/documents.ts`:

```typescript
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/documents.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents.ts tests/unit/documents.test.ts
git commit -m "Add documents business-logic layer"
```

---

## Task 6: `POST /api/documents/upload-url`

**Files:**
- Create: `src/app/api/documents/upload-url/route.ts`
- Test: `tests/unit/routes/documentsUploadUrl.test.ts`

**Interfaces:**
- Consumes: `getSessionUserByToken`, `SESSION_COOKIE_NAME` (`src/lib/auth/session.ts`); `createPendingUpload` (Task 5).
- Produces: `POST` handler returning `{ok:true, documentId, uploadUrl}` (200) or `{ok:false, error}` (401/403/400) — consumed by Task 11's UI and Task 12's E2E test.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/documentsUploadUrl.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/documentsUploadUrl.test.ts`
Expected: FAIL — the route module does not exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/documents/upload-url/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createPendingUpload } from "@/lib/documents";

const bodySchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().positive(),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (user.role !== "client") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const result = await createPendingUpload({
    ownerId: user.id,
    uploadedBy: user.id,
    filename: parsed.data.filename,
    mimeType: parsed.data.mimeType,
    sizeBytes: parsed.data.sizeBytes,
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, documentId: result.documentId, uploadUrl: result.uploadUrl });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/documentsUploadUrl.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/documents/upload-url tests/unit/routes/documentsUploadUrl.test.ts
git commit -m "Add POST /api/documents/upload-url"
```

---

## Task 7: `POST /api/documents/:id/confirm`

**Files:**
- Create: `src/app/api/documents/[id]/confirm/route.ts`
- Test: `tests/unit/routes/documentsConfirm.test.ts`

**Interfaces:**
- Consumes: `confirmUpload` (Task 5); `writeAuditLog` (`src/lib/audit.ts`); `getClientIp` (`src/lib/http.ts`).
- Produces: `POST` handler returning `{ok:true}` (200), `{ok:false,error}` (404 not found / 400 not yet uploaded / 401) — consumed by Task 11's UI and Task 12's E2E test. Writes an `audit_log` row with `action: "document_confirmed"`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/documentsConfirm.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/documentsConfirm.test.ts`
Expected: FAIL — the route module does not exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/documents/[id]/confirm/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { confirmUpload } from "@/lib/documents";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const GENERIC_NOT_FOUND = "Document introuvable.";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await confirmUpload(id, user.id);

  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
    }
    return NextResponse.json(
      { ok: false, error: "Le fichier n'a pas été reçu par le stockage." },
      { status: 400 },
    );
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "document_confirmed",
    targetType: "document",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/documentsConfirm.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/documents/\[id\]/confirm tests/unit/routes/documentsConfirm.test.ts
git commit -m "Add POST /api/documents/:id/confirm"
```

---

## Task 8: `GET /api/documents`

**Files:**
- Create: `src/app/api/documents/route.ts`
- Test: `tests/unit/routes/documentsList.test.ts`

**Interfaces:**
- Consumes: `listDocumentsForOwner` (Task 5).
- Produces: `GET` handler returning `{ok:true, documents: [{id, filename, mimeType, sizeBytes, uploadedAt}]}` — consumed by Task 11's UI.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/documentsList.test.ts`:

```typescript
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
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/documentsList.test.ts`
Expected: FAIL — the route module does not exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/documents/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { listDocumentsForOwner } from "@/lib/documents";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let ownerId: string;
  if (user.role === "client") {
    ownerId = user.id;
  } else {
    const clientId = request.nextUrl.searchParams.get("clientId");
    if (!clientId) {
      return NextResponse.json({ ok: false, error: "clientId requis" }, { status: 400 });
    }
    ownerId = clientId;
  }

  const docs = await listDocumentsForOwner(ownerId);
  return NextResponse.json({
    ok: true,
    documents: docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt,
    })),
  });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/documentsList.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/documents/route.ts tests/unit/routes/documentsList.test.ts
git commit -m "Add GET /api/documents"
```

---

## Task 9: `GET /api/documents/:id/download-url`

**Files:**
- Create: `src/app/api/documents/[id]/download-url/route.ts`
- Test: `tests/unit/routes/documentsDownloadUrl.test.ts`

**Interfaces:**
- Consumes: `getAccessibleDocument` (Task 5); `getDownloadUrl` (`src/lib/storage/client.ts`, Task 4); `writeAuditLog`, `getClientIp`.
- Produces: `GET` handler returning `{ok:true, downloadUrl}` (200) or `{ok:false,error}` (404/401) — consumed by Task 11's UI and Task 12's E2E test. Writes an `audit_log` row with `action: "document_downloaded"`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/documentsDownloadUrl.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/documentsDownloadUrl.test.ts`
Expected: FAIL — the route module does not exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/documents/[id]/download-url/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDocument } from "@/lib/documents";
import { getDownloadUrl } from "@/lib/storage/client";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const GENERIC_NOT_FOUND = "Document introuvable.";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAccessibleDocument(id, { id: user.id, role: user.role });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }

  const downloadUrl = await getDownloadUrl(result.document.storageKey, result.document.filename);

  await writeAuditLog({
    actorUserId: user.id,
    action: "document_downloaded",
    targetType: "document",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true, downloadUrl });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/documentsDownloadUrl.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/documents/\[id\]/download-url tests/unit/routes/documentsDownloadUrl.test.ts
git commit -m "Add GET /api/documents/:id/download-url"
```

---

## Task 10: `DELETE /api/documents/:id`

**Files:**
- Create: `src/app/api/documents/[id]/route.ts`
- Test: `tests/unit/routes/documentsDelete.test.ts`

**Interfaces:**
- Consumes: `getAccessibleDocument`, `softDeleteDocument` (Task 5); `writeAuditLog`, `getClientIp`.
- Produces: `DELETE` handler returning `{ok:true}` (200) or `{ok:false,error}` (404/401) — consumed by Task 11's UI. Writes an `audit_log` row with `action: "document_deleted"`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/documentsDelete.test.ts`:

```typescript
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/documentsDelete.test.ts`
Expected: FAIL — the route module does not exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/documents/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDocument, softDeleteDocument } from "@/lib/documents";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const GENERIC_NOT_FOUND = "Document introuvable.";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await getAccessibleDocument(id, { id: user.id, role: user.role });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }

  await softDeleteDocument(id);

  await writeAuditLog({
    actorUserId: user.id,
    action: "document_deleted",
    targetType: "document",
    targetId: id,
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/documentsDelete.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/documents/\[id\]/route.ts tests/unit/routes/documentsDelete.test.ts
git commit -m "Add DELETE /api/documents/:id"
```

---

## Task 11: Portal UI — `DocumentsPanel`

**Files:**
- Create: `src/app/portal/DocumentsPanel.tsx`
- Modify: `src/app/portal/page.tsx`
- Test: none (this is a thin UI wired to already-tested routes; covered end-to-end by Task 12)

**Interfaces:**
- Consumes: `GET /api/documents`, `POST /api/documents/upload-url`, `POST /api/documents/:id/confirm`, `GET /api/documents/:id/download-url`, `DELETE /api/documents/:id` (Tasks 6-10), fetched directly from the browser.
- Produces: a `<DocumentsPanel />` component rendered inside `/portal`, exercised by Task 12's E2E test via the file input, the document list, and the "Télécharger"/"Supprimer" buttons.

Current `src/app/portal/page.tsx` (for context):

```tsx
import { getCurrentUser } from "@/lib/auth/guards";

export default async function PortalHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Mon espace client</h1>
      <p>Connecté en tant que {user?.firstName} {user?.lastName} ({user?.email}).</p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 1: Create the `DocumentsPanel` client component**

Create `src/app/portal/DocumentsPanel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface DocumentItem {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export default function DocumentsPanel() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadDocuments() {
    const res = await fetch("/api/documents");
    if (!res.ok) return;
    const body = await res.json();
    setDocuments(body.documents);
  }

  useEffect(() => {
    loadDocuments();
  }, []);

  async function handleUpload(file: File) {
    setError(null);
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Type de fichier non autorisé (PDF, JPG ou PNG uniquement).");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError("Fichier trop volumineux (20 Mo maximum).");
      return;
    }

    setUploading(true);
    try {
      const startRes = await fetch("/api/documents/upload-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
        }),
      });
      if (!startRes.ok) {
        setError("Impossible de démarrer l'envoi.");
        return;
      }
      const { documentId, uploadUrl } = await startRes.json();

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "content-type": file.type },
        body: file,
      });
      if (!putRes.ok) {
        setError("Échec de l'envoi du fichier.");
        return;
      }

      const confirmRes = await fetch(`/api/documents/${documentId}/confirm`, { method: "POST" });
      if (!confirmRes.ok) {
        setError("Échec de la confirmation de l'envoi.");
        return;
      }

      await loadDocuments();
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(id: string) {
    const res = await fetch(`/api/documents/${id}/download-url`);
    if (!res.ok) return;
    const { downloadUrl } = await res.json();
    window.open(downloadUrl, "_blank");
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    await loadDocuments();
  }

  return (
    <section style={{ marginTop: 40 }}>
      <h2>Mes documents</h2>
      <input
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleUpload(file);
          e.target.value = "";
        }}
      />
      {uploading && <p>Envoi en cours…</p>}
      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            {doc.filename}{" "}
            <button type="button" onClick={() => handleDownload(doc.id)}>
              Télécharger
            </button>{" "}
            <button type="button" onClick={() => handleDelete(doc.id)}>
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 2: Wire it into the portal page**

Modify `src/app/portal/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/auth/guards";
import DocumentsPanel from "./DocumentsPanel";

export default async function PortalHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Mon espace client</h1>
      <p>Connecté en tant que {user?.firstName} {user?.lastName} ({user?.email}).</p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
      <DocumentsPanel />
    </main>
  );
}
```

- [ ] **Step 3: Manually verify in the browser**

Run: `npm run dev`, log in as a client at `http://localhost:3000/login`, land on `/portal`.
Expected: "Mes documents" section is visible with a file picker and an empty list. Uploading a small PDF makes it appear in the list within a couple seconds; "Télécharger" opens it in a new tab with the right bytes; "Supprimer" removes it from the list.

- [ ] **Step 4: Commit**

```bash
git add src/app/portal/DocumentsPanel.tsx src/app/portal/page.tsx
git commit -m "Add documents panel to the client portal"
```

---

## Task 12: E2E test — upload, list, download, isolation

**Files:**
- Create: `tests/e2e/fixtures/sample.pdf`
- Create: `tests/e2e/documents.spec.ts`

**Interfaces:**
- Consumes: `getLatestOtpForEmail` (`tests/e2e/helpers/mailhog.ts`); the running dev server (`npm run dev`, per `playwright.config.ts`'s `webServer`); `DocumentsPanel` (Task 11).
- Produces: nothing consumed by later tasks — this is the plan's final task.

- [ ] **Step 1: Add a minimal PDF fixture**

Create `tests/e2e/fixtures/sample.pdf`:

```
%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj
trailer<</Size 4/Root 1 0 R>>
%%EOF
```

This does not need to be a byte-perfect PDF — the app never parses file contents, only stores and returns them, and Playwright's `setInputFiles` derives the upload's MIME type from the `.pdf` extension, not the content.

- [ ] **Step 2: Write the E2E test**

Create `tests/e2e/documents.spec.ts`:

```typescript
import fs from "node:fs";
import path from "node:path";
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { getLatestOtpForEmail } from "./helpers/mailhog";

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.test`;
}

async function loginAsNewClient(page: Page, request: APIRequestContext, prefix: string) {
  const email = uniqueEmail(prefix);
  await request.post("/api/auth/signup", {
    data: { email, password: "a-long-enough-password", firstName: "A", lastName: "B" },
  });
  await getLatestOtpForEmail(email); // drain the signup OTP email first

  await page.goto("/login");
  await page.getByPlaceholder("E-mail").fill(email);
  await page.getByPlaceholder("Mot de passe").fill("a-long-enough-password");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(/\/verify/);
  const code = await getLatestOtpForEmail(email);
  await page.getByPlaceholder("000000").fill(code);
  await page.getByRole("button", { name: "Valider" }).click();
  await page.waitForURL("/portal");
  return email;
}

const SAMPLE_PDF = path.join(__dirname, "fixtures", "sample.pdf");

test("client uploads a document and sees it listed", async ({ page, request }) => {
  await loginAsNewClient(page, request, "e2e-doc-upload");

  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);

  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });
});

test("downloading a document returns the exact bytes that were uploaded", async ({ page, request }) => {
  await loginAsNewClient(page, request, "e2e-doc-download");
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  const [popup] = await Promise.all([
    page.waitForEvent("popup"),
    page.getByRole("button", { name: "Télécharger" }).click(),
  ]);
  const download = await popup.waitForEvent("download");
  const downloadedPath = await download.path();
  expect(downloadedPath).not.toBeNull();
  const downloadedBytes = fs.readFileSync(downloadedPath!);
  const originalBytes = fs.readFileSync(SAMPLE_PDF);
  expect(downloadedBytes.equals(originalBytes)).toBe(true);
});

test("a client cannot see another client's uploaded document", async ({ page, request, browser }) => {
  await loginAsNewClient(page, request, "e2e-doc-owner");
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await loginAsNewClient(otherPage, otherContext.request, "e2e-doc-other");
  await expect(otherPage.getByText("sample.pdf")).not.toBeVisible();
  await otherContext.close();
});

test("deleting a document removes it from the list", async ({ page, request }) => {
  await loginAsNewClient(page, request, "e2e-doc-delete");
  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Supprimer" }).click();
  await expect(page.getByText("sample.pdf")).not.toBeVisible();
});
```

Note on admin coverage: the spec's testing section also calls for verifying
"an admin can" access a client's document. There is no admin UI in this
sub-project (deferred to sub-project 5, per the spec's non-goals), so an
admin flow can't be driven through the browser the way the client flow is
here — that access-control path is instead covered at the route level by
Task 8's "lets an admin list a specific client's documents via clientId"
and Task 9's "lets an admin download" tests, which exercise the real
handlers with a real database.

- [ ] **Step 3: Run the E2E suite**

Run: `npm run test:e2e -- tests/e2e/documents.spec.ts`
Expected: PASS (4 tests). Requires `docker compose up -d` (Postgres, MinIO, Mailhog all running) and a migrated database (`npm run db:migrate`).

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/fixtures/sample.pdf tests/e2e/documents.spec.ts
git commit -m "Add E2E tests for document upload, isolation, and deletion"
```

---
