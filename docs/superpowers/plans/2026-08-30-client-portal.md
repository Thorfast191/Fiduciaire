# Client Portal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Attach a tax-year dossier workflow (status pipeline, document categories) on top of Document Storage's generic upload/download/list/delete primitive, and replace the placeholder flat document list in `/portal` with the client's real experience.

**Architecture:** A new `dossiers` table (one row per client per tax year) sits between clients and documents. `documents` gains two required columns — `dossierId` and `category` — everything else about document storage (signed URLs, confirm-then-visible, soft delete, audit logging, `ownerId`-based access control) is untouched. Five new/modified API routes expose dossier CRUD and status transitions; the client portal UI and a bare admin page consume them.

**Tech Stack:** Next.js 16 (App Router), TypeScript, Drizzle ORM, PostgreSQL, Vitest, Playwright — all already established by Foundation and Document Storage.

**Spec:** `docs/superpowers/specs/2026-08-30-client-portal-design.md`

## Global Constraints

- One dossier per client per tax year. Status pipeline: `not_started` → `submitted` → `in_review` → `completed`.
- Document categories (fixed 6, internal key → French display label): `salaire` → "Certificat de salaire", `releves_bancaires` → "Relevés bancaires", `assurance` → "Attestations d'assurance", `pilier3` → "3e pilier", `justificatifs` → "Justificatifs divers", `autre` → "Autre".
- Only `admin`/`super_admin` can create a dossier. A client may only move their own dossier from `not_started` to `submitted`; every other transition (including submitting again once already submitted) requires `admin`/`super_admin`, who may set any of the 4 values regardless of current status.
- `documents.ownerId` stays authoritative for all existing access-control logic (`getAccessibleDocument`, `listDocumentsForOwner`, `confirmUpload` in `src/lib/documents.ts`) — none of that code changes. A document's `ownerId` is set to the uploading client's own id, which by construction equals its dossier's `clientId` (enforced by the upload route validating dossier ownership before creating the row, not by a DB constraint — matching this codebase's existing style).
- Enumeration-safety extends to dossiers: a non-owner non-admin requesting a dossier, or attempting a status transition, gets the exact same generic 404 as a nonexistent dossier — a disallowed client transition gets 400 "invalid transition" (not 403, which would confirm the dossier is theirs).
- Admin UI for this sub-project is bare-minimum by design (a plain form to create a dossier and change status) — the polished admin dashboard is a later sub-project's job, matching Document Storage's precedent of leaving admin UI to that same later sub-project.
- The existing flat `DocumentsPanel`/`/portal` view is replaced, not kept alongside — it was always a placeholder (Document Storage's own spec called it "a bare list/upload view... just enough to prove the pipeline end-to-end").
- No payment, no notifications, no finer-grained statuses, no deadlines — none of these were requested for this sub-project.

---

## Task 1: Database schema — `dossiers` table + `documents` extension

**Files:**
- Modify: `src/db/schema.ts`
- Test: none (schema change verified via migration application, per Document Storage's Task 1 pattern)

**Interfaces:**
- Produces: `dossiers` table, `Dossier`/`DossierStatus`/`DocumentCategory` types, and `documents.dossierId`/`documents.category` columns — consumed by Tasks 2-8.

- [ ] **Step 1: Add the `dossiers` table to the schema**

In `src/db/schema.ts`, add this table definition right after the existing `auditLog` table and before the existing `documents` table (it must come first in the file since `documents.dossierId` will reference it):

```typescript
export const dossiers = pgTable("dossiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id")
    .notNull()
    .references(() => users.id),
  taxYear: integer("tax_year").notNull(),
  status: text("status", {
    enum: ["not_started", "submitted", "in_review", "completed"],
  })
    .notNull()
    .default("not_started"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});
```

- [ ] **Step 2: Extend the `documents` table**

Replace the existing `documents` table definition:

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

with:

```typescript
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id),
  dossierId: uuid("dossier_id")
    .notNull()
    .references(() => dossiers.id),
  filename: text("filename").notNull(),
  category: text("category", {
    enum: ["salaire", "releves_bancaires", "assurance", "pilier3", "justificatifs", "autre"],
  }).notNull(),
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

- [ ] **Step 3: Add the new type exports**

Add these lines after the existing `export type Document = typeof documents.$inferSelect;` line:

```typescript
export type DossierStatus = "not_started" | "submitted" | "in_review" | "completed";
export type DocumentCategory =
  | "salaire"
  | "releves_bancaires"
  | "assurance"
  | "pilier3"
  | "justificatifs"
  | "autre";
export type Dossier = typeof dossiers.$inferSelect;
```

- [ ] **Step 4: Clear any leftover dev data before migrating**

The new `documents.dossierId`/`documents.category` columns are `NOT NULL` with no default, so any existing rows in the `documents` table (e.g. from earlier manual browser testing) would block the migration. This app has no real users/production data yet, so it's safe to clear the table.

Run: `docker exec fiduciaire-postgres-1 psql -U fiduvia -d fiduvia -c "SELECT count(*) FROM documents;"`

If the count is greater than 0, run: `docker exec fiduciaire-postgres-1 psql -U fiduvia -d fiduvia -c "TRUNCATE documents;"`

- [ ] **Step 5: Generate and apply the migration**

Run: `npm run db:generate`
Expected: a new SQL file appears under `src/db/migrations/`, containing `CREATE TABLE "dossiers"` and `ALTER TABLE "documents" ADD COLUMN "dossier_id" ...` / `ADD COLUMN "category" ...` statements.

Run: `npm run db:migrate`
Expected: completes without error.

Run: `docker exec fiduciaire-postgres-1 psql -U fiduvia -d fiduvia -c '\d dossiers'` and `docker exec fiduciaire-postgres-1 psql -U fiduvia -d fiduvia -c '\d documents'`
Expected: `dossiers` lists all 6 columns with a foreign key to `users`; `documents` now lists `dossier_id` (not null, FK to `dossiers`) and `category` (not null) alongside its existing columns.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts src/db/migrations
git commit -m "Add dossiers table and extend documents with dossierId/category"
```

---

## Task 2: Dossier business-logic layer

**Files:**
- Create: `src/lib/dossiers.ts`
- Test: `tests/unit/dossiers.test.ts`

**Interfaces:**
- Consumes: `dossiers`, `type Dossier`, `type DossierStatus`, `type Role` from `src/db/schema.ts` (Task 1); `db` from `src/db/client.ts`.
- Produces: `createDossier(params): Promise<Dossier>`, `listDossiersForClient(clientId): Promise<Dossier[]>`, `getAccessibleDossier(dossierId, requester): Promise<AccessCheckResult>`, `setDossierStatus(dossierId, newStatus, requester): Promise<SetStatusResult>` — consumed by Tasks 5-8's routes and Task 8's upload-url route.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/dossiers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { db } from "../../src/db/client";
import { users } from "../../src/db/schema";
import { hashPassword } from "../../src/lib/auth/password";
import {
  createDossier,
  listDossiersForClient,
  getAccessibleDossier,
  setDossierStatus,
} from "../../src/lib/dossiers";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossiers-biz-${Date.now()}-${Math.random()}@example.test`;
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

describe("createDossier", () => {
  it("creates a dossier with status not_started", async () => {
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2025 });
    expect(dossier.clientId).toBe(client.id);
    expect(dossier.taxYear).toBe(2025);
    expect(dossier.status).toBe("not_started");
  });
});

describe("listDossiersForClient", () => {
  it("returns only the given client's dossiers, newest tax year first", async () => {
    const client = await makeUser();
    const other = await makeUser();
    await createDossier({ clientId: client.id, taxYear: 2023 });
    await createDossier({ clientId: client.id, taxYear: 2025 });
    await createDossier({ clientId: other.id, taxYear: 2025 });

    const list = await listDossiersForClient(client.id);
    expect(list.map((d) => d.taxYear)).toEqual([2025, 2023]);
  });
});

describe("getAccessibleDossier", () => {
  it("allows the owner, denies another client, and allows an admin", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    expect((await getAccessibleDossier(dossier.id, { id: owner.id, role: "client" })).ok).toBe(true);
    expect((await getAccessibleDossier(dossier.id, { id: other.id, role: "client" })).ok).toBe(false);
    expect((await getAccessibleDossier(dossier.id, { id: admin.id, role: "admin" })).ok).toBe(true);
  });

  it("returns not_found for a nonexistent dossier", async () => {
    const result = await getAccessibleDossier("00000000-0000-0000-0000-000000000000", {
      id: "00000000-0000-0000-0000-000000000001",
      role: "client",
    });
    expect(result).toEqual({ ok: false, error: "not_found" });
  });
});

describe("setDossierStatus", () => {
  it("lets the owning client move not_started to submitted", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "submitted", { id: owner.id, role: "client" });
    expect(result).toEqual({ ok: true, previousStatus: "not_started" });
  });

  it("rejects a client trying to set any other status", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "in_review", { id: owner.id, role: "client" });
    expect(result).toEqual({ ok: false, error: "invalid_transition" });
  });

  it("rejects a client trying to submit an already-submitted dossier", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    await setDossierStatus(dossier.id, "submitted", { id: owner.id, role: "client" });

    const result = await setDossierStatus(dossier.id, "submitted", { id: owner.id, role: "client" });
    expect(result).toEqual({ ok: false, error: "invalid_transition" });
  });

  it("rejects a non-owner client with not_found", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "submitted", { id: other.id, role: "client" });
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("lets an admin set any status regardless of the current one", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const result = await setDossierStatus(dossier.id, "completed", { id: admin.id, role: "admin" });
    expect(result).toEqual({ ok: true, previousStatus: "not_started" });
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/dossiers.test.ts`
Expected: FAIL — `src/lib/dossiers.ts` does not exist yet.

- [ ] **Step 3: Implement the business-logic layer**

Create `src/lib/dossiers.ts`:

```typescript
import { eq, desc } from "drizzle-orm";
import { db } from "@/db/client";
import { dossiers, type Dossier, type DossierStatus, type Role } from "@/db/schema";

export async function createDossier(params: {
  clientId: string;
  taxYear: number;
}): Promise<Dossier> {
  const [dossier] = await db
    .insert(dossiers)
    .values({
      clientId: params.clientId,
      taxYear: params.taxYear,
    })
    .returning();
  return dossier;
}

export async function listDossiersForClient(clientId: string): Promise<Dossier[]> {
  return db
    .select()
    .from(dossiers)
    .where(eq(dossiers.clientId, clientId))
    .orderBy(desc(dossiers.taxYear));
}

export type AccessCheckResult =
  | { ok: true; dossier: Dossier }
  | { ok: false; error: "not_found" };

export async function getAccessibleDossier(
  dossierId: string,
  requester: { id: string; role: Role },
): Promise<AccessCheckResult> {
  const [dossier] = await db.select().from(dossiers).where(eq(dossiers.id, dossierId));
  if (!dossier) {
    return { ok: false, error: "not_found" };
  }
  const isOwner = dossier.clientId === requester.id;
  const isAdmin = requester.role === "admin" || requester.role === "super_admin";
  if (!isOwner && !isAdmin) {
    return { ok: false, error: "not_found" };
  }
  return { ok: true, dossier };
}

export type SetStatusResult =
  | { ok: true; previousStatus: DossierStatus }
  | { ok: false; error: "not_found" | "invalid_transition" };

export async function setDossierStatus(
  dossierId: string,
  newStatus: DossierStatus,
  requester: { id: string; role: Role },
): Promise<SetStatusResult> {
  const [dossier] = await db.select().from(dossiers).where(eq(dossiers.id, dossierId));
  const isOwner = dossier?.clientId === requester.id;
  const isAdmin = requester.role === "admin" || requester.role === "super_admin";
  if (!dossier || (!isOwner && !isAdmin)) {
    return { ok: false, error: "not_found" };
  }

  if (!isAdmin && (newStatus !== "submitted" || dossier.status !== "not_started")) {
    return { ok: false, error: "invalid_transition" };
  }

  const previousStatus = dossier.status;
  await db
    .update(dossiers)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(dossiers.id, dossierId));
  return { ok: true, previousStatus };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/dossiers.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/dossiers.ts tests/unit/dossiers.test.ts
git commit -m "Add dossiers business-logic layer"
```

---

## Task 3: Extend `createPendingUpload` for `dossierId`/`category`

**Files:**
- Modify: `src/lib/documents.ts`
- Modify: `tests/unit/documents.test.ts`

**Interfaces:**
- Produces: `DOCUMENT_CATEGORIES` (readonly tuple of the 6 category keys); `createPendingUpload` now requires `dossierId: string` and `category: string` in its params and rejects an invalid category with `{ok:false, error:"invalid_category"}` — consumed by Task 8's upload-url route and every test file that calls `createPendingUpload` (Task 4 fixes the rest of them).

Current `src/lib/documents.ts` (for context — only `createPendingUpload` and its result type change; every other export is untouched):

```typescript
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
```

- [ ] **Step 1: Write the failing test changes**

In `tests/unit/documents.test.ts`, add this import alongside the existing ones:

```typescript
import { createDossier } from "../../src/lib/dossiers";
```

Then update every `createPendingUpload({...})` call in the file to (a) first create a dossier for that call's owner via `await createDossier({ clientId: owner.id, taxYear: 2025 })`, and (b) add `dossierId: dossier.id, category: "salaire"` to the params object. Concretely, replace the entire file content with:

```typescript
import { describe, it, expect } from "vitest";
import { db } from "../../src/db/client";
import { users, documents } from "../../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../src/lib/auth/password";
import { getUploadUrl } from "../../src/lib/storage/client";
import { createDossier } from "../../src/lib/dossiers";
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
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const result = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.exe",
      category: "salaire",
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
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const result = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 21 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("too_large");

    const rows = await db.select().from(documents).where(eq(documents.ownerId, owner.id));
    expect(rows).toHaveLength(0);
  });

  it("rejects an invalid category without creating a row", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const result = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "not-a-real-category",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("invalid_category");

    const rows = await db.select().from(documents).where(eq(documents.ownerId, owner.id));
    expect(rows).toHaveLength(0);
  });

  it("creates a pending row with a signed upload URL for a valid request", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const result = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "salaire.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");
    expect(result.uploadUrl).toContain("http");

    const [row] = await db.select().from(documents).where(eq(documents.id, result.documentId));
    expect(row.uploadedAt).toBeNull();
    expect(row.ownerId).toBe(owner.id);
    expect(row.dossierId).toBe(dossier.id);
    expect(row.category).toBe("salaire");
  });
});

describe("confirmUpload", () => {
  it("returns not_found for a document owned by someone else", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!created.ok) throw new Error("unreachable");

    const result = await confirmUpload(created.documentId, other.id);
    expect(result).toEqual({ ok: false, error: "not_found" });
  });

  it("returns not_uploaded when the object was never actually stored", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!created.ok) throw new Error("unreachable");

    const result = await confirmUpload(created.documentId, owner.id);
    expect(result).toEqual({ ok: false, error: "not_uploaded" });
  });

  it("confirms and makes the document visible once the bytes actually exist", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
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
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const pending = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "pending.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    if (!pending.ok) throw new Error("unreachable");

    const confirmed = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "confirmed.pdf",
      category: "salaire",
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
      dossierId: dossier.id,
      filename: "deleted.pdf",
      category: "salaire",
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
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
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

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/unit/documents.test.ts`
Expected: FAIL — `createPendingUpload`'s current signature has no `dossierId`/`category` params and the `documents` table doesn't have those columns populated, so TypeScript will fail to compile and/or the DB insert will violate the new `NOT NULL` constraints.

- [ ] **Step 3: Implement the change**

In `src/lib/documents.ts`, add this constant right after the existing `MAX_SIZE_BYTES` line:

```typescript
export const DOCUMENT_CATEGORIES = [
  "salaire",
  "releves_bancaires",
  "assurance",
  "pilier3",
  "justificatifs",
  "autre",
] as const;
```

Then replace the `CreateUploadResult` type and `createPendingUpload` function shown in the "Current" block above with:

```typescript
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
  const storageKey = buildStorageKey(params.ownerId, documentId, params.filename);

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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- tests/unit/documents.test.ts`
Expected: PASS (9 tests). The rest of the suite (`npm test`) will still show failures in the other document route test files at this point — that's expected and fixed in Task 4.

- [ ] **Step 5: Commit**

```bash
git add src/lib/documents.ts tests/unit/documents.test.ts
git commit -m "Require dossierId and category on document uploads"
```

---

## Task 4: Fix existing document route tests for the new required fields

**Files:**
- Modify: `tests/unit/routes/documentsConfirm.test.ts`
- Modify: `tests/unit/routes/documentsList.test.ts`
- Modify: `tests/unit/routes/documentsDownloadUrl.test.ts`
- Modify: `tests/unit/routes/documentsDelete.test.ts`

**Interfaces:**
- Consumes: `createDossier` (Task 2); `createPendingUpload`'s new required `dossierId`/`category` params (Task 3).
- Produces: nothing new — this task only repairs test setup so the full suite is green again. The routes under test (`confirm`, list, download-url, delete) are NOT modified in this task; per the spec, they don't need to change since they already key off `documents.ownerId`, unaffected by the new columns.

- [ ] **Step 1: Fix `documentsConfirm.test.ts`**

Replace the full file content:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users, auditLog } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload } from "../../../src/lib/documents";
import { createDossier } from "../../../src/lib/dossiers";
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
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
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
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
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
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
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

  it("returns 404 for a malformed document id instead of a database error", async () => {
    const owner = await makeUser();
    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await confirm(request, withParams("not-a-uuid"));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Fix `documentsList.test.ts`**

Replace the full file content:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload, confirmUpload } from "../../../src/lib/documents";
import { createDossier } from "../../../src/lib/dossiers";
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
  const dossier = await createDossier({ clientId: ownerId, taxYear: 2025 });
  const created = await createPendingUpload({
    ownerId,
    uploadedBy: ownerId,
    dossierId: dossier.id,
    filename,
    category: "salaire",
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
```

- [ ] **Step 3: Fix `documentsDownloadUrl.test.ts`**

Replace the full file content:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload, confirmUpload } from "../../../src/lib/documents";
import { createDossier } from "../../../src/lib/dossiers";
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
  const dossier = await createDossier({ clientId: ownerId, taxYear: 2025 });
  const created = await createPendingUpload({
    ownerId,
    uploadedBy: ownerId,
    dossierId: dossier.id,
    filename: "a.pdf",
    category: "salaire",
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

  it("returns 404 for a malformed document id instead of a database error", async () => {
    const owner = await makeUser();
    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await downloadUrl(request, withParams("not-a-uuid"));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 4: Fix `documentsDelete.test.ts`**

Replace the full file content:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createPendingUpload, confirmUpload, listDocumentsForOwner } from "../../../src/lib/documents";
import { createDossier } from "../../../src/lib/dossiers";
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
  const dossier = await createDossier({ clientId: ownerId, taxYear: 2025 });
  const created = await createPendingUpload({
    ownerId,
    uploadedBy: ownerId,
    dossierId: dossier.id,
    filename: "a.pdf",
    category: "salaire",
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

  it("returns 404 for a malformed document id instead of a database error", async () => {
    const owner = await makeUser();
    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await deleteDoc(request, withParams("not-a-uuid"));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 5: Run the full suite to verify everything is green**

Run: `npm test`
Expected: PASS, all test files (including `tests/unit/routes/documentsUploadUrl.test.ts`, which still fails at this point — that's fixed in Task 8, not here). If every file except `documentsUploadUrl.test.ts` passes, this task is complete.

- [ ] **Step 6: Commit**

```bash
git add tests/unit/routes/documentsConfirm.test.ts tests/unit/routes/documentsList.test.ts tests/unit/routes/documentsDownloadUrl.test.ts tests/unit/routes/documentsDelete.test.ts
git commit -m "Fix document route tests for required dossierId/category"
```

---

## Task 5: `POST /api/dossiers` (create) + `GET /api/dossiers` (list)

**Files:**
- Create: `src/app/api/dossiers/route.ts`
- Test: `tests/unit/routes/dossiers.test.ts`

**Interfaces:**
- Consumes: `createDossier`, `listDossiersForClient` (Task 2).
- Produces: `POST` handler returning `{ok:true, dossier}` (200) or `{ok:false,error}` (401/403/400); `GET` handler returning `{ok:true, dossiers}` (200) or `{ok:false,error}` (401/400) — consumed by Task 9's UI and Task 10's E2E test.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/dossiers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { POST as createDossierRoute, GET as listDossiers } from "../../../src/app/api/dossiers/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossiers-route-${Date.now()}-${Math.random()}@example.test`;
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

function postReq(body: unknown) {
  return new NextRequest("http://localhost/api/dossiers", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function getReq(url: string) {
  return new NextRequest(url, { method: "GET" });
}

describe("POST /api/dossiers", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await createDossierRoute(
      postReq({ clientId: "00000000-0000-0000-0000-000000000000", taxYear: 2025 }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects a client (admin-only)", async () => {
    const client = await makeUser();
    const { token } = await createSession(client.id, {});
    const request = postReq({ clientId: client.id, taxYear: 2025 });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await createDossierRoute(request);
    expect(res.status).toBe(403);
  });

  it("creates a dossier for a valid admin request", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser();
    const { token } = await createSession(admin.id, {});
    const request = postReq({ clientId: client.id, taxYear: 2025 });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await createDossierRoute(request);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dossier.clientId).toBe(client.id);
    expect(body.dossier.taxYear).toBe(2025);
    expect(body.dossier.status).toBe("not_started");
  });
});

describe("GET /api/dossiers", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await listDossiers(getReq("http://localhost/api/dossiers"));
    expect(res.status).toBe(401);
  });

  it("returns only the requesting client's own dossiers", async () => {
    const client = await makeUser();
    const other = await makeUser();
    await createDossier({ clientId: client.id, taxYear: 2025 });
    await createDossier({ clientId: other.id, taxYear: 2025 });

    const { token } = await createSession(client.id, {});
    const request = getReq("http://localhost/api/dossiers");
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await listDossiers(request);
    const body = await res.json();
    expect(body.dossiers).toHaveLength(1);
    expect(body.dossiers[0].clientId).toBe(client.id);
  });

  it("requires a clientId query param for an admin", async () => {
    const admin = await makeUser("admin");
    const { token } = await createSession(admin.id, {});
    const request = getReq("http://localhost/api/dossiers");
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await listDossiers(request);
    expect(res.status).toBe(400);
  });

  it("lets an admin list a specific client's dossiers via clientId", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser();
    await createDossier({ clientId: client.id, taxYear: 2025 });

    const { token } = await createSession(admin.id, {});
    const request = getReq(`http://localhost/api/dossiers?clientId=${client.id}`);
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await listDossiers(request);
    const body = await res.json();
    expect(body.dossiers).toHaveLength(1);
    expect(body.dossiers[0].clientId).toBe(client.id);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/dossiers.test.ts`
Expected: FAIL — the route module does not exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/dossiers/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createDossier, listDossiersForClient } from "@/lib/dossiers";

const createBodySchema = z.object({
  clientId: z.string().uuid(),
  taxYear: z.number().int().min(2000).max(2100),
});

export async function POST(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (user.role !== "admin" && user.role !== "super_admin") {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const parsed = createBodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const dossier = await createDossier({
    clientId: parsed.data.clientId,
    taxYear: parsed.data.taxYear,
  });

  return NextResponse.json({ ok: true, dossier });
}

export async function GET(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let clientId: string;
  if (user.role === "client") {
    clientId = user.id;
  } else {
    const queryClientId = request.nextUrl.searchParams.get("clientId");
    if (!queryClientId || !z.string().uuid().safeParse(queryClientId).success) {
      return NextResponse.json({ ok: false, error: "clientId requis" }, { status: 400 });
    }
    clientId = queryClientId;
  }

  const dossiers = await listDossiersForClient(clientId);
  return NextResponse.json({ ok: true, dossiers });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/dossiers.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dossiers/route.ts tests/unit/routes/dossiers.test.ts
git commit -m "Add POST and GET /api/dossiers"
```

---

## Task 6: `GET /api/dossiers/:id` (dossier detail + its documents)

**Files:**
- Create: `src/app/api/dossiers/[id]/route.ts`
- Modify: `src/lib/documents.ts` (add `listDocumentsForDossier`)
- Test: `tests/unit/routes/dossierDetail.test.ts`

**Interfaces:**
- Consumes: `getAccessibleDossier` (Task 2); new `listDocumentsForDossier(dossierId): Promise<Document[]>`.
- Produces: `GET` handler returning `{ok:true, dossier, documents:[{id,filename,category,mimeType,sizeBytes,uploadedAt}]}` (200) or `{ok:false,error}` (401/404) — consumed by Task 9's UI.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/dossierDetail.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { createPendingUpload, confirmUpload } from "../../../src/lib/documents";
import { GET as dossierDetail } from "../../../src/app/api/dossiers/[id]/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossier-detail-${Date.now()}-${Math.random()}@example.test`;
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

function req() {
  return new NextRequest("http://localhost/api/dossiers/x", { method: "GET" });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("GET /api/dossiers/:id", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await dossierDetail(req(), withParams("00000000-0000-0000-0000-000000000000"));
    expect(res.status).toBe(401);
  });

  it("returns 404 for a dossier owned by someone else", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(other.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams(dossier.id));
    expect(res.status).toBe(404);
  });

  it("returns 404 for a malformed dossier id", async () => {
    const owner = await makeUser();
    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams("not-a-uuid"));
    expect(res.status).toBe(404);
  });

  it("lets the owner view their dossier with its confirmed documents", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });
    const created = await createPendingUpload({
      ownerId: owner.id,
      uploadedBy: owner.id,
      dossierId: dossier.id,
      filename: "salaire.pdf",
      category: "salaire",
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

    const { token } = await createSession(owner.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams(dossier.id));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.dossier.id).toBe(dossier.id);
    expect(
      body.documents.map((d: { filename: string; category: string }) => ({
        filename: d.filename,
        category: d.category,
      })),
    ).toEqual([{ filename: "salaire.pdf", category: "salaire" }]);
  });

  it("lets an admin view any client's dossier", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(admin.id, {});
    const request = req();
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await dossierDetail(request, withParams(dossier.id));
    expect(res.status).toBe(200);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/dossierDetail.test.ts`
Expected: FAIL — the route module and `listDocumentsForDossier` do not exist yet.

- [ ] **Step 3: Add `listDocumentsForDossier` to `src/lib/documents.ts`**

Add this function after the existing `listDocumentsForOwner` function:

```typescript
export async function listDocumentsForDossier(dossierId: string): Promise<Document[]> {
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
```

- [ ] **Step 4: Implement the route**

Create `src/app/api/dossiers/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { getAccessibleDossier } from "@/lib/dossiers";
import { listDocumentsForDossier } from "@/lib/documents";

const GENERIC_NOT_FOUND = "Dossier introuvable.";

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
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }

  const result = await getAccessibleDossier(id, { id: user.id, role: user.role });
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }

  const docs = await listDocumentsForDossier(id);
  return NextResponse.json({
    ok: true,
    dossier: result.dossier,
    documents: docs.map((d) => ({
      id: d.id,
      filename: d.filename,
      category: d.category,
      mimeType: d.mimeType,
      sizeBytes: d.sizeBytes,
      uploadedAt: d.uploadedAt,
    })),
  });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/dossierDetail.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
git add src/app/api/dossiers/\[id\]/route.ts src/lib/documents.ts tests/unit/routes/dossierDetail.test.ts
git commit -m "Add GET /api/dossiers/:id"
```

---

## Task 7: `PATCH /api/dossiers/:id/status`

**Files:**
- Create: `src/app/api/dossiers/[id]/status/route.ts`
- Test: `tests/unit/routes/dossierStatus.test.ts`

**Interfaces:**
- Consumes: `setDossierStatus` (Task 2); `writeAuditLog` (`src/lib/audit.ts`); `getClientIp` (`src/lib/http.ts`).
- Produces: `PATCH` handler returning `{ok:true}` (200) or `{ok:false,error}` (404/400/401) — consumed by Task 9's UI and Task 10's E2E test. Writes an `audit_log` row with `action: "dossier_status_changed"` and `metadata: {from, to}`.

- [ ] **Step 1: Write the failing tests**

Create `tests/unit/routes/dossierStatus.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users, auditLog, dossiers } from "../../../src/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
import { PATCH as setStatus } from "../../../src/app/api/dossiers/[id]/status/route";

async function makeUser(role: "client" | "admin" = "client") {
  const email = `dossier-status-${Date.now()}-${Math.random()}@example.test`;
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
  return new NextRequest("http://localhost/api/dossiers/x/status", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
}

function withParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe("PATCH /api/dossiers/:id/status", () => {
  it("rejects an unauthenticated request", async () => {
    const res = await setStatus(
      req({ status: "submitted" }),
      withParams("00000000-0000-0000-0000-000000000000"),
    );
    expect(res.status).toBe(401);
  });

  it("lets the owner submit their not_started dossier", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(owner.id, {});
    const request = req({ status: "submitted" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams(dossier.id));
    expect(res.status).toBe(200);

    const [updated] = await db.select().from(dossiers).where(eq(dossiers.id, dossier.id));
    expect(updated.status).toBe("submitted");
  });

  it("rejects a client trying to set in_review", async () => {
    const owner = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(owner.id, {});
    const request = req({ status: "in_review" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams(dossier.id));
    expect(res.status).toBe(400);
  });

  it("rejects a non-owner client with a generic 404", async () => {
    const owner = await makeUser();
    const other = await makeUser();
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(other.id, {});
    const request = req({ status: "submitted" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams(dossier.id));
    expect(res.status).toBe(404);
  });

  it("lets an admin move a dossier through every status and writes an audit log entry each time", async () => {
    const owner = await makeUser();
    const admin = await makeUser("admin");
    const dossier = await createDossier({ clientId: owner.id, taxYear: 2025 });

    const { token } = await createSession(admin.id, {});

    for (const status of ["submitted", "in_review", "completed"] as const) {
      const request = req({ status });
      request.cookies.set(SESSION_COOKIE_NAME, token);
      const res = await setStatus(request, withParams(dossier.id));
      expect(res.status).toBe(200);
    }

    const [updated] = await db.select().from(dossiers).where(eq(dossiers.id, dossier.id));
    expect(updated.status).toBe("completed");

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.action, "dossier_status_changed"));
    expect(entries.length).toBeGreaterThanOrEqual(3);
  });

  it("returns 404 for a malformed dossier id", async () => {
    const admin = await makeUser("admin");
    const { token } = await createSession(admin.id, {});
    const request = req({ status: "submitted" });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await setStatus(request, withParams("not-a-uuid"));
    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- tests/unit/routes/dossierStatus.test.ts`
Expected: FAIL — the route module does not exist yet.

- [ ] **Step 3: Implement the route**

Create `src/app/api/dossiers/[id]/status/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { setDossierStatus } from "@/lib/dossiers";
import { writeAuditLog } from "@/lib/audit";
import { getClientIp } from "@/lib/http";

const GENERIC_NOT_FOUND = "Dossier introuvable.";

const bodySchema = z.object({
  status: z.enum(["not_started", "submitted", "in_review", "completed"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = token ? await getSessionUserByToken(token) : null;
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }

  const result = await setDossierStatus(id, parsed.data.status, { id: user.id, role: user.role });
  if (!result.ok) {
    if (result.error === "not_found") {
      return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
    }
    return NextResponse.json(
      { ok: false, error: "Transition de statut non autorisée." },
      { status: 400 },
    );
  }

  await writeAuditLog({
    actorUserId: user.id,
    action: "dossier_status_changed",
    targetType: "dossier",
    targetId: id,
    metadata: { from: result.previousStatus, to: parsed.data.status },
    ip: getClientIp(request),
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- tests/unit/routes/dossierStatus.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/api/dossiers/\[id\]/status tests/unit/routes/dossierStatus.test.ts
git commit -m "Add PATCH /api/dossiers/:id/status"
```

---

## Task 8: Modify `POST /api/documents/upload-url` for `dossierId`/`category`

**Files:**
- Modify: `src/app/api/documents/upload-url/route.ts`
- Modify: `tests/unit/routes/documentsUploadUrl.test.ts`

**Interfaces:**
- Consumes: `getAccessibleDossier` (Task 2); `createPendingUpload`, `DOCUMENT_CATEGORIES` (Task 3).
- Produces: the route's request body now requires `dossierId` and `category`; validates the requesting client owns the target dossier (generic 404 otherwise) before creating the pending document — consumed by Task 9's UI and Task 10's E2E test.

Current `src/app/api/documents/upload-url/route.ts` (for context):

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

- [ ] **Step 1: Write the failing test changes**

Replace the full content of `tests/unit/routes/documentsUploadUrl.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { db } from "../../../src/db/client";
import { users } from "../../../src/db/schema";
import { hashPassword } from "../../../src/lib/auth/password";
import { createSession, SESSION_COOKIE_NAME } from "../../../src/lib/auth/session";
import { createDossier } from "../../../src/lib/dossiers";
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
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2025 });
    const res = await uploadUrl(
      req({ dossierId: dossier.id, filename: "a.pdf", category: "salaire", mimeType: "application/pdf", sizeBytes: 100 }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects an admin (client-only for now)", async () => {
    const admin = await makeUser("admin");
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2025 });
    const { token } = await createSession(admin.id, {});
    const request = req({
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await uploadUrl(request);
    expect(res.status).toBe(403);
  });

  it("rejects a disallowed mime type", async () => {
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2025 });
    const { token } = await createSession(client.id, {});
    const request = req({
      dossierId: dossier.id,
      filename: "a.exe",
      category: "salaire",
      mimeType: "application/x-msdownload",
      sizeBytes: 100,
    });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await uploadUrl(request);
    expect(res.status).toBe(400);
  });

  it("rejects an invalid category before it reaches the storage layer", async () => {
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2025 });
    const { token } = await createSession(client.id, {});
    const request = req({
      dossierId: dossier.id,
      filename: "a.pdf",
      category: "not-a-real-category",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await uploadUrl(request);
    expect(res.status).toBe(400);
  });

  it("rejects a dossier belonging to another client", async () => {
    const client = await makeUser();
    const other = await makeUser();
    const otherDossier = await createDossier({ clientId: other.id, taxYear: 2025 });
    const { token } = await createSession(client.id, {});
    const request = req({
      dossierId: otherDossier.id,
      filename: "a.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 100,
    });
    request.cookies.set(SESSION_COOKIE_NAME, token);
    const res = await uploadUrl(request);
    expect(res.status).toBe(404);
  });

  it("returns a signed upload URL for a valid request", async () => {
    const client = await makeUser();
    const dossier = await createDossier({ clientId: client.id, taxYear: 2025 });
    const { token } = await createSession(client.id, {});
    const request = req({
      dossierId: dossier.id,
      filename: "salaire.pdf",
      category: "salaire",
      mimeType: "application/pdf",
      sizeBytes: 1024,
    });
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
Expected: FAIL — the route's current body schema has no `dossierId`/`category`, and it never validates dossier ownership.

- [ ] **Step 3: Implement the route change**

Replace the full content of `src/app/api/documents/upload-url/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUserByToken, SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { createPendingUpload, DOCUMENT_CATEGORIES } from "@/lib/documents";
import { getAccessibleDossier } from "@/lib/dossiers";

const GENERIC_NOT_FOUND = "Dossier introuvable.";

const bodySchema = z.object({
  dossierId: z.string().uuid(),
  filename: z.string().min(1).max(255),
  category: z.enum(DOCUMENT_CATEGORIES),
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

  const dossierCheck = await getAccessibleDossier(parsed.data.dossierId, {
    id: user.id,
    role: user.role,
  });
  if (!dossierCheck.ok) {
    return NextResponse.json({ ok: false, error: GENERIC_NOT_FOUND }, { status: 404 });
  }

  const result = await createPendingUpload({
    ownerId: user.id,
    uploadedBy: user.id,
    dossierId: parsed.data.dossierId,
    filename: parsed.data.filename,
    category: parsed.data.category,
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
Expected: PASS (6 tests).

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS, every test file green.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/documents/upload-url/route.ts tests/unit/routes/documentsUploadUrl.test.ts
git commit -m "Require dossierId and category on POST /api/documents/upload-url"
```

---

## Task 9: Portal UI (dossier list + detail) and bare admin UI

**Files:**
- Create: `src/app/portal/DossierList.tsx`
- Create: `src/app/portal/dossiers/[id]/page.tsx`
- Create: `src/app/portal/dossiers/[id]/DossierDetail.tsx`
- Create: `src/app/admin/dossiers/page.tsx`
- Modify: `src/app/portal/page.tsx`
- Modify: `src/app/admin/page.tsx`
- Delete: `src/app/portal/DocumentsPanel.tsx`
- Test: none (thin UI wired to already-tested routes; covered end-to-end by Task 10)

**Interfaces:**
- Consumes: `GET /api/dossiers`, `GET /api/dossiers/:id`, `PATCH /api/dossiers/:id/status`, `POST /api/dossiers` (Tasks 5-7), `POST /api/documents/upload-url` (Task 8), `POST /api/documents/:id/confirm`, `GET /api/documents/:id/download-url`, `DELETE /api/documents/:id` (unchanged from Document Storage), fetched directly from the browser.
- Produces: `/portal` shows the client's dossiers; `/portal/dossiers/:id` shows one dossier's documents grouped by category with upload/download/delete/submit controls; `/admin/dossiers` is a bare admin form — exercised by Task 10's E2E test.

- [ ] **Step 1: Delete the old flat document panel**

Delete `src/app/portal/DocumentsPanel.tsx` — it's replaced by the dossier-based view below.

- [ ] **Step 2: Create the dossier list component**

Create `src/app/portal/DossierList.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface DossierItem {
  id: string;
  taxYear: number;
  status: "not_started" | "submitted" | "in_review" | "completed";
}

const STATUS_LABELS: Record<DossierItem["status"], string> = {
  not_started: "Non commencé",
  submitted: "Soumis",
  in_review: "En cours de traitement",
  completed: "Terminé",
};

export default function DossierList() {
  const [dossiers, setDossiers] = useState<DossierItem[]>([]);

  useEffect(() => {
    async function loadDossiers() {
      const res = await fetch("/api/dossiers");
      if (!res.ok) return;
      const body = await res.json();
      setDossiers(body.dossiers ?? []);
    }
    // Initial data fetch on mount; suppressed for the same reason as
    // DossierDetail's identical pattern below (see that file's comment).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDossiers();
  }, []);

  return (
    <section style={{ marginTop: 40 }}>
      <h2>Mes dossiers fiscaux</h2>
      {dossiers.length === 0 && <p>Aucun dossier pour le moment.</p>}
      <ul>
        {dossiers.map((dossier) => (
          <li key={dossier.id}>
            <Link href={`/portal/dossiers/${dossier.id}`}>
              Dossier {dossier.taxYear} — {STATUS_LABELS[dossier.status]}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 3: Wire it into the portal home page**

Modify `src/app/portal/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/auth/guards";
import DossierList from "./DossierList";

export default async function PortalHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Mon espace client</h1>
      <p>Connecté en tant que {user?.firstName} {user?.lastName} ({user?.email}).</p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
      <DossierList />
    </main>
  );
}
```

- [ ] **Step 4: Create the dossier detail page and component**

Create `src/app/portal/dossiers/[id]/page.tsx`:

```tsx
import DossierDetail from "./DossierDetail";

export default async function DossierDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <main style={{ maxWidth: 700, margin: "60px auto", fontFamily: "sans-serif" }}>
      <p>
        <a href="/portal">← Retour à mes dossiers</a>
      </p>
      <DossierDetail dossierId={id} />
    </main>
  );
}
```

Create `src/app/portal/dossiers/[id]/DossierDetail.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";

interface DocumentItem {
  id: string;
  filename: string;
  category: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

interface DossierData {
  id: string;
  taxYear: number;
  status: "not_started" | "submitted" | "in_review" | "completed";
}

const CATEGORY_LABELS: Record<string, string> = {
  salaire: "Certificat de salaire",
  releves_bancaires: "Relevés bancaires",
  assurance: "Attestations d'assurance",
  pilier3: "3e pilier",
  justificatifs: "Justificatifs divers",
  autre: "Autre",
};

const STATUS_LABELS: Record<string, string> = {
  not_started: "Non commencé",
  submitted: "Soumis",
  in_review: "En cours de traitement",
  completed: "Terminé",
};

const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_SIZE_BYTES = 20 * 1024 * 1024;

export default function DossierDetail({ dossierId }: { dossierId: string }) {
  const [dossier, setDossier] = useState<DossierData | null>(null);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [category, setCategory] = useState<string>("salaire");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function loadDossier() {
    const res = await fetch(`/api/dossiers/${dossierId}`);
    if (!res.ok) return;
    const body = await res.json();
    setDossier(body.dossier);
    setDocuments(body.documents ?? []);
  }

  useEffect(() => {
    // Initial data fetch on mount. eslint-plugin-react-hooks@7's
    // set-state-in-effect rule flags this idiomatic pattern; suppressed
    // rather than restructured, matching the precedent already established
    // in Document Storage's DocumentsPanel component.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDossier();
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
          dossierId,
          filename: file.name,
          category,
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

      await loadDossier();
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(id: string) {
    setError(null);
    const res = await fetch(`/api/documents/${id}/download-url`);
    if (!res.ok) {
      setError("Impossible de récupérer le lien de téléchargement.");
      return;
    }
    const { downloadUrl } = await res.json();
    // Same-tab navigation (not window.open) so it works regardless of
    // popup-blocker state, matching Document Storage's DocumentsPanel.
    // eslint-disable-next-line react-hooks/immutability
    window.location.href = downloadUrl;
  }

  async function handleDelete(id: string) {
    setError(null);
    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("Échec de la suppression.");
      return;
    }
    await loadDossier();
  }

  async function handleSubmit() {
    setError(null);
    const res = await fetch(`/api/dossiers/${dossierId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: "submitted" }),
    });
    if (!res.ok) {
      setError("Échec de la soumission du dossier.");
      return;
    }
    await loadDossier();
  }

  if (!dossier) {
    return <p>Chargement…</p>;
  }

  return (
    <section>
      <h1>Dossier fiscal {dossier.taxYear}</h1>
      <p>Statut : {STATUS_LABELS[dossier.status]}</p>

      {dossier.status === "not_started" && (
        <button type="button" onClick={handleSubmit}>
          Marquer comme soumis
        </button>
      )}

      <h2>Ajouter un document</h2>
      <select value={category} onChange={(e) => setCategory(e.target.value)}>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
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

      <h2>Documents</h2>
      {documents.length === 0 && <p>Aucun document pour le moment.</p>}
      <ul>
        {documents.map((doc) => (
          <li key={doc.id}>
            [{CATEGORY_LABELS[doc.category] ?? doc.category}] {doc.filename}{" "}
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

- [ ] **Step 5: Create the bare admin dossiers page**

Create `src/app/admin/dossiers/page.tsx`:

```tsx
"use client";

import { useState } from "react";

export default function AdminDossiersPage() {
  const [clientId, setClientId] = useState("");
  const [taxYear, setTaxYear] = useState("");
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const [statusDossierId, setStatusDossierId] = useState("");
  const [status, setStatus] = useState("not_started");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  async function handleCreate() {
    setCreateMessage(null);
    const res = await fetch("/api/dossiers", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ clientId, taxYear: Number(taxYear) }),
    });
    if (!res.ok) {
      setCreateMessage("Échec de la création du dossier.");
      return;
    }
    const body = await res.json();
    setCreateMessage(`Dossier créé : ${body.dossier.id}`);
  }

  async function handleSetStatus() {
    setStatusMessage(null);
    const res = await fetch(`/api/dossiers/${statusDossierId}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      setStatusMessage("Échec du changement de statut.");
      return;
    }
    setStatusMessage("Statut mis à jour.");
  }

  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <p>
        <a href="/admin">← Retour</a>
      </p>
      <h1>Dossiers fiscaux</h1>

      <h2>Créer un dossier</h2>
      <input
        placeholder="ID du client"
        value={clientId}
        onChange={(e) => setClientId(e.target.value)}
      />
      <input
        placeholder="Année fiscale"
        value={taxYear}
        onChange={(e) => setTaxYear(e.target.value)}
      />
      <button type="button" onClick={handleCreate}>
        Créer
      </button>
      {createMessage && <p role="alert">{createMessage}</p>}

      <h2>Changer le statut d&apos;un dossier</h2>
      <input
        placeholder="ID du dossier"
        value={statusDossierId}
        onChange={(e) => setStatusDossierId(e.target.value)}
      />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="not_started">Non commencé</option>
        <option value="submitted">Soumis</option>
        <option value="in_review">En cours de traitement</option>
        <option value="completed">Terminé</option>
      </select>
      <button type="button" onClick={handleSetStatus}>
        Mettre à jour
      </button>
      {statusMessage && <p role="alert">{statusMessage}</p>}
    </main>
  );
}
```

- [ ] **Step 6: Link the admin dossiers page from the admin home page**

Modify `src/app/admin/page.tsx`:

```tsx
import { getCurrentUser } from "@/lib/auth/guards";

export default async function AdminHomePage() {
  const user = await getCurrentUser();
  return (
    <main style={{ maxWidth: 600, margin: "60px auto", fontFamily: "sans-serif" }}>
      <h1>Espace administrateur</h1>
      <p>
        Connecté en tant que {user?.firstName} {user?.lastName} ({user?.role}).
      </p>
      <p>
        <a href="/admin/dossiers">Gérer les dossiers fiscaux</a>
      </p>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Se déconnecter</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 7: Verify the flow end-to-end**

Run: `npm run dev`. Log in as a client, confirm `/portal` shows "Aucun dossier pour le moment." Using a second terminal, curl `POST /api/dossiers` as a seeded admin (or wait for Task 10's E2E test, which exercises this fully) to create a dossier for that client, then reload `/portal` and confirm the dossier appears; click into it, upload a small PDF under a category, confirm it lists with its category label, then click "Marquer comme soumis" and confirm the status updates.

- [ ] **Step 8: Commit**

```bash
git add src/app/portal/DossierList.tsx src/app/portal/dossiers src/app/admin/dossiers src/app/portal/page.tsx src/app/admin/page.tsx
git rm src/app/portal/DocumentsPanel.tsx
git commit -m "Add dossier-based portal UI and bare admin dossier management"
```

---

## Task 10: E2E test — full dossier lifecycle

**Files:**
- Create: `tests/e2e/clientPortal.spec.ts`

**Interfaces:**
- Consumes: `getLatestOtpForEmail` (`tests/e2e/helpers/mailhog.ts`); the running dev server; all routes from Tasks 5-8; the UI from Task 9. Also reads `src/db/client`/`src/db/schema` directly for one narrow purpose — see the comment in Step 1's code.
- Produces: nothing consumed by later tasks — this is the plan's final task.

- [ ] **Step 1: Write the E2E test**

Create `tests/e2e/clientPortal.spec.ts`:

```typescript
import path from "node:path";
import { test, expect, type Page, type APIRequestContext } from "@playwright/test";
import { eq } from "drizzle-orm";
import { getLatestOtpForEmail } from "./helpers/mailhog";
import { db } from "../../src/db/client";
import { users } from "../../src/db/schema";

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

// Test-orchestration only, not a feature under test: the app deliberately
// has no endpoint that resolves an email to a user id (that would be an
// enumeration oracle), so driving a real admin flow — which acts on a
// client's id, not their email — needs this to set up the scenario. Every
// actual dossier/document/status operation below goes through the real
// HTTP API, matching every other E2E test in this suite.
async function getUserIdByEmail(email: string): Promise<string> {
  const [user] = await db.select().from(users).where(eq(users.email, email));
  return user.id;
}

async function loginAsAdmin(context: { request: APIRequestContext }) {
  const email = "admin@fiduvia.test"; // seeded by `npm run seed:admin`, see tests/e2e/auth.spec.ts
  await context.request.post("/api/auth/login", {
    data: { email, password: "a-long-enough-password" },
  });
  const code = await getLatestOtpForEmail(email);
  await context.request.post("/api/auth/verify-otp", {
    data: { email, code, purpose: "login" },
  });
}

const SAMPLE_PDF = path.join(__dirname, "fixtures", "sample.pdf");

test("admin creates a dossier, client uploads and submits, admin reviews and completes it", async ({
  page,
  request,
  browser,
}) => {
  const clientEmail = await loginAsNewClient(page, request, "e2e-portal-client");
  const clientId = await getUserIdByEmail(clientEmail);

  const adminContext = await browser.newContext();
  await loginAsAdmin(adminContext);

  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId, taxYear: 2025 },
  });
  expect(createRes.ok()).toBe(true);
  const { dossier } = await createRes.json();

  await page.goto("/portal");
  await expect(page.getByText(`Dossier ${dossier.taxYear}`)).toBeVisible({ timeout: 10_000 });
  await page.getByText(`Dossier ${dossier.taxYear}`).click();
  await page.waitForURL(new RegExp(`/portal/dossiers/${dossier.id}`));

  await page.locator('input[type="file"]').setInputFiles(SAMPLE_PDF);
  await expect(page.getByText("sample.pdf")).toBeVisible({ timeout: 10_000 });

  await page.getByRole("button", { name: "Marquer comme soumis" }).click();
  await expect(page.getByText("Soumis")).toBeVisible();

  const reviewRes = await adminContext.request.patch(`/api/dossiers/${dossier.id}/status`, {
    data: { status: "in_review" },
  });
  expect(reviewRes.ok()).toBe(true);
  const completeRes = await adminContext.request.patch(`/api/dossiers/${dossier.id}/status`, {
    data: { status: "completed" },
  });
  expect(completeRes.ok()).toBe(true);

  await page.reload();
  await expect(page.getByText("Terminé")).toBeVisible();

  await adminContext.close();
});

test("a client cannot see another client's dossier", async ({ page, request, browser }) => {
  const ownerEmail = await loginAsNewClient(page, request, "e2e-portal-owner");
  const ownerId = await getUserIdByEmail(ownerEmail);

  const adminContext = await browser.newContext();
  await loginAsAdmin(adminContext);
  const createRes = await adminContext.request.post("/api/dossiers", {
    data: { clientId: ownerId, taxYear: 2025 },
  });
  const { dossier } = await createRes.json();
  await adminContext.close();

  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await loginAsNewClient(otherPage, otherContext.request, "e2e-portal-other");

  const res = await otherContext.request.get(`/api/dossiers/${dossier.id}`);
  expect(res.status()).toBe(404);
  await otherContext.close();
});
```

- [ ] **Step 2: Run the E2E suite**

Run: `npm run test:e2e -- tests/e2e/clientPortal.spec.ts`
Expected: PASS (2 tests). Requires `docker compose up -d` (Postgres, MinIO, Mailhog all running), a migrated database, and the seeded admin account (`npm run seed:admin -- admin@fiduvia.test a-long-enough-password`, matching `tests/e2e/auth.spec.ts`'s existing assumption).

- [ ] **Step 3: Run the full test suite one more time**

Run: `npm test && npm run test:e2e`
Expected: everything passes — this is the last task in the plan.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/clientPortal.spec.ts
git commit -m "Add E2E tests for the client portal dossier lifecycle"
```

---
