# Fiduvia Platform — Document Storage

Sub-project 2 of 7 in the Fiduvia platform rebuild. Gives clients and admins a
place to upload, list, download, and delete files, backed by Swiss-hosted
object storage. Everything in the platform's auth/session/RBAC layer
(sub-project 1, "Foundation") is complete, reviewed, and merged; this
sub-project builds directly on top of it.

## Context

The Foundation sub-project delivered real accounts, mandatory email 2FA,
sessions, and a role-protected client portal / admin dashboard shell — but
no way to actually store a document. The client's brief explicitly asks for:
"the ability for clients to submit their files directly through their
account" and "storage of client information and documents on secure servers
located in Switzerland... with sufficient storage capacity to handle a large
number of clients." This sub-project delivers that storage layer.

Infomaniak was already chosen as the Swiss hosting provider during
Foundation's design (confirmed again directly by the client mid-session:
"We already started setting up Fiduvia with Infomaniak"). Foundation's own
`docker-compose.yml` already provisions a MinIO container (S3-compatible)
for local development, unused until now — this sub-project is what finally
uses it.

**Constraints gathered before design (brainstorming session,
2026-08-29):**

- Scope is the storage primitive only — upload/download/list/delete with
  basic metadata, tied to a client account. The richer tax-declaration
  domain model (dossiers, tax years, document categories, status pipeline)
  is explicitly out of scope here and belongs to sub-project 3 (Client
  Portal), which will attach documents to that context once it exists.
- Expected files: scanned PDFs and photos of paperwork (salary certificates,
  bank statements, receipts), a few MB each — not large media files.
- Access model: any admin or super_admin can access any client's documents
  (matches the existing mockup's model and Foundation's existing RBAC
  roles) — no per-client admin assignment.
- Security depth: Infomaniak's own encryption-at-rest, TLS in transit, and a
  private bucket with short-lived signed URLs is judged sufficient.
  Deliberately not adding application-level (client-side) encryption on top
  — that would add real key-management complexity for a security margin
  the client didn't ask for and Foundation's own security bar (argon2id,
  hashed sessions, audit logging) doesn't otherwise assume is necessary at
  this layer.
- Virus/malware scanning on upload is explicitly deferred — a clean
  addition later that doesn't require redesigning anything now, not worth
  the added cost/complexity at this stage.

## Goals

- Clients can upload files from their own portal, see a list of their own
  files, and download or delete them.
- Admins can do the same for any client's files.
- The app server never handles raw file bytes — all transfer is
  client-browser-to-storage directly, so the app tier's resource usage
  doesn't grow with file traffic (serves the brief's "scalable... large
  number of clients" requirement).
- Files are never reachable except through a short-lived, permission-checked
  signed URL — no public bucket paths anywhere.
- A file only becomes visible/listed once its upload is verified to have
  actually landed in storage, not merely claimed by the client.

## Non-goals (deferred to later sub-projects)

- Any tax-declaration domain concept (dossiers, tax years, categories,
  submission status) — sub-project 3.
- Attaching a payment step to submission — sub-project 4.
- Admin dashboard UI for browsing/managing documents — sub-project 5 (this
  sub-project ships the API only; a bare list/upload view is included just
  enough to prove the pipeline end-to-end, matching how Foundation shipped
  bare portal/admin shells rather than final UI).
- Notification emails triggered by document activity — sub-project 6.
- Virus/malware scanning, application-level encryption, per-client admin
  assignment — all explicitly deferred per the constraints above.

## Architecture

- **Storage**: Infomaniak Object Storage (S3-compatible), one private
  bucket (e.g. `fiduvia-documents`). No object in it is ever publicly
  readable — every access goes through a signed URL generated per-request.
- **Storage client**: `src/lib/storage/client.ts`, built on the standard AWS
  S3 SDK (`@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`) configured
  with an S3-compatible endpoint from environment variables. The same code
  works against Infomaniak in production and MinIO locally — only the
  endpoint/credentials differ, which is exactly why the SDK (rather than an
  Infomaniak-specific client) is the right choice.
- **Local dev**: Foundation's `docker-compose.yml` already runs a `minio`
  service; this sub-project is its first real consumer. New environment
  variables: `STORAGE_ENDPOINT`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY_ID`,
  `STORAGE_SECRET_ACCESS_KEY`, `STORAGE_REGION` (MinIO/S3-compatible
  endpoints require a region value even when it's not meaningful;
  `us-east-1` is the conventional placeholder for MinIO).
- **Upload flow**:
  1. Client calls `POST /api/documents/upload-url` with
     `{filename, mimeType, sizeBytes}`.
  2. Server validates `mimeType` against an allow-list
     (`application/pdf`, `image/jpeg`, `image/png`) and `sizeBytes` against
     a cap (20 MB), rejecting before anything is created if either fails.
  3. Server creates a `documents` row with `uploadedAt: null` and a storage
     key scoped to the owning client
     (`clients/{ownerId}/{documentId}-{sanitizedFilename}`), then generates
     a signed PUT URL for that exact key (short expiry, e.g. 5 minutes) and
     returns `{documentId, uploadUrl}`.
  4. The client's browser `PUT`s the file bytes directly to `uploadUrl` —
     the Next.js server is not in this path at all.
  5. Client calls `POST /api/documents/:id/confirm`. The server does a HEAD
     request against the storage object for that key; if it exists, sets
     `uploadedAt = now()`. If it doesn't (upload never completed, or the
     client is lying), returns an error and the row stays invisible.
- **Download flow**: `GET /api/documents/:id/download-url` checks the
  requester owns the document (or is an admin/super_admin), then returns a
  signed GET URL (short expiry) for the browser to fetch directly from
  storage.
- **Listing**: only rows with `uploadedAt IS NOT NULL` and `deletedAt IS
  NULL` are ever returned by list/download/delete endpoints — an
  unconfirmed or deleted row is invisible everywhere, not just hidden in
  the UI.

## Data model

One new table, added via a Drizzle migration on top of Foundation's
existing schema (`users`, `sessions`, `otp_codes`, `audit_log` are
untouched):

```
documents
  id            uuid primary key
  ownerId       uuid not null references users(id)   -- the client this file belongs to
  uploadedBy    uuid not null references users(id)    -- who actually uploaded it (== ownerId for client self-upload; distinct value reserved for a future admin-uploads-for-client path, not built yet)
  filename      text not null                          -- original filename as given by the client, sanitized for storage-key use but stored as-given for display
  storageKey    text not null unique
  mimeType      text not null
  sizeBytes     integer not null
  uploadedAt    timestamptz                            -- null until confirmed real
  deletedAt     timestamptz                            -- soft delete
  createdAt     timestamptz not null default now()
```

`ownerId` and `uploadedBy` are both `uuid references users(id)` rather than
a single column, specifically so that a later admin-initiated upload (an
admin uploading a document on a client's behalf) doesn't need a schema
change — `uploadedBy` would simply differ from `ownerId`. Nothing in this
sub-project sets them to different values; that's future scope.

## API surface & access control

All routes require an authenticated session (Foundation's `requireRole`
guard / route-level session check — same pattern as the existing API
routes).

- `POST /api/documents/upload-url` — role: `client` only for now (an admin
  uploading on a client's behalf is deferred, per the data model note
  above). Validates type/size, creates the pending row, returns the signed
  upload URL.
- `POST /api/documents/:id/confirm` — role: must be the document's
  `ownerId`. Verifies the object exists in storage before marking it
  visible.
- `GET /api/documents` — role: `client` returns their own confirmed,
  non-deleted documents; `admin`/`super_admin` may pass `?clientId=` to
  list a specific client's documents (no `clientId` for an admin returns a
  generic error — admins have no "own" documents to default to).
- `GET /api/documents/:id/download-url` — role: the document's `ownerId`,
  or any `admin`/`super_admin`. Returns a signed GET URL.
- `DELETE /api/documents/:id` — role: the document's `ownerId`, or any
  `admin`/`super_admin`. Soft delete (`deletedAt = now()`), object is left
  in storage (not purged) — recoverable by a future admin action, not
  built yet.

A client requesting a document they don't own gets the same generic 404 as
a document ID that doesn't exist at all — this sub-project extends
Foundation's established rule (never let a response distinguish "exists but
not yours" from "doesn't exist") to documents.

Every write action here (upload confirmed, downloaded, deleted) writes an
`audit_log` entry via Foundation's existing `writeAuditLog` helper —
matching the pattern already established for every other state-changing
action in the app, and directly relevant for a fiduciary handling client
tax documents.

## Error handling

- Type/size validation happens before any row is created or any signed URL
  is issued — a rejected upload leaves no trace in the database.
- A `confirm` call for a key that doesn't actually exist in storage returns
  a clear error and leaves the row permanently unconfirmed (never becomes
  visible) — no retry-loop or cleanup job is needed for Foundation-level
  scope; an orphaned unconfirmed row is inert and invisible to every
  endpoint that matters.
- Signed URLs are short-lived (5 minutes) specifically so a leaked URL
  (e.g. via browser history, a proxy log) stops being useful quickly.
- Storage-layer errors (Infomaniak/MinIO unreachable) surface as a generic
  500 with no internal detail in the response body, logged server-side —
  same pattern as every other route in this codebase.

## Testing

- **Unit** (Vitest, against the real local MinIO container from
  `docker-compose.yml` — not mocked, matching Foundation's existing
  pattern of testing against a real local Postgres rather than a mock):
  storage client round-trip (put via a signed URL, confirm existence via
  HEAD, get via a signed URL, delete), upload/download-url route handlers'
  validation and access-control logic (owner can, non-owner can't, admin
  can, unconfirmed/deleted documents are invisible).
- **E2E** (Playwright, extending Foundation's existing suite): a client
  uploads a real small PDF through the actual UI, sees it in their list,
  downloads it back, and confirms the bytes round-trip correctly; a second
  client cannot see the first client's file; an admin can.

## Open questions to resolve during implementation

- Exact Infomaniak Object Storage bucket name/credentials — needs to be
  provisioned against the client's real Infomaniak account, not decided in
  the abstract; local dev is unaffected (MinIO) either way.
