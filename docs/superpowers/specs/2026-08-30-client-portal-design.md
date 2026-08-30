# Fiduvia Platform — Client Portal

Sub-project 3 of 7 in the Fiduvia platform rebuild. Attaches a real
tax-declaration workflow — dossiers per tax year, document categories, and
a review status — on top of the generic document storage primitive built
in sub-project 2, and replaces the placeholder flat document list in
`/portal` with the client's actual experience.

## Context

Foundation (sub-project 1) delivered accounts, mandatory email 2FA,
sessions, and role-protected shells. Document Storage (sub-project 2)
delivered upload/list/download/delete of files via signed URLs, but
deliberately scoped out any tax-declaration concept: its spec explicitly
deferred "dossiers, tax years, document categories, status pipeline" to
this sub-project, and its `/portal` page shipped a flat, ungrouped document
list described in its own spec as "a bare list/upload view... just enough
to prove the pipeline end-to-end", not the real client experience.

This sub-project builds that real experience: a client's documents belong
to a specific tax year's dossier, are organized by category, and the
dossier moves through a review status that both the client and the
fiduciary's admins can see.

**Constraints gathered before design (brainstorming session, 2026-08-30):**

- One dossier per client per tax year — matches how Swiss personal tax
  declarations actually work (one filing per year), rather than a single
  undifferentiated space per client.
- Status pipeline: `not_started` → `submitted` → `in_review` →
  `completed`. No finer-grained states (e.g. "awaiting missing documents",
  "filed with tax authority") for this sub-project.
- Fixed document categories, not free-text tags: Certificat de salaire,
  Relevés bancaires, Attestations d'assurance, 3e pilier, Justificatifs
  divers, Autre.
- Dossier ownership: an admin/super_admin creates a dossier for a client
  (client cannot self-create one); the client can move it from
  `not_started` to `submitted`; only an admin can move it to `in_review`
  or `completed`.
- Admin UI stays bare-minimum for this sub-project — a plain page/form to
  create a dossier and change its status. The real admin dashboard
  (client list, search, bulk actions) is sub-project 5's job, matching how
  Document Storage left admin document UI to the same sub-project.
- The existing flat `DocumentsPanel`/`/portal` view is replaced, not kept
  alongside the new dossier view — it was always a placeholder.

## Goals

- A client sees their tax-year dossiers in `/portal`, opens one, and
  uploads documents into it under a category.
- A client can mark a dossier `submitted` once they believe they've
  uploaded everything.
- An admin/super_admin can create a dossier for any client and move it
  through `in_review` to `completed`.
- Every document still goes through Document Storage's existing
  confirm-then-visible, signed-URL, enumeration-safe pipeline — this
  sub-project adds structure around documents, it does not change how
  documents themselves are stored, confirmed, downloaded, or deleted.
- All of Document Storage's access-control guarantees (owner or
  admin/super_admin, indistinguishable 404 otherwise) continue to hold
  without modification to `getAccessibleDocument`/`listDocumentsForOwner`.

## Non-goals (deferred to later sub-projects)

- Payment integration at submission time — sub-project 4.
- A polished admin dashboard (client list, search/filter, bulk dossier
  creation) — sub-project 5; this sub-project ships only the minimum
  admin form needed to create a dossier and change its status.
- Notification emails on status change or document upload — sub-project 6.
- Finer-grained status states, deadlines/due-date tracking, or
  per-category completeness checks (e.g. "you're missing your salary
  certificate") — none of these were requested; adding them now would be
  scope creep beyond what was asked.
- Retiring/purging the now-unused flat document list code from
  Document Storage beyond what's needed to replace the `/portal` UI —
  the underlying document API routes are reused as-is, only the UI and
  the upload request shape change.

## Architecture

- **New table**: `dossiers` — one row per client per tax year, holding
  `clientId`, `taxYear`, and `status`.
- **Extended table**: `documents` gains two required columns —
  `dossierId` (references `dossiers.id`) and `category` (one of the 6
  fixed values). Every document created from this point forward belongs
  to exactly one dossier and one category; there is no more "dossier-less"
  document.
- **`ownerId` stays authoritative for access control.** Document Storage's
  `getAccessibleDocument`, `listDocumentsForOwner`, and `confirmUpload`
  all key off `documents.ownerId` and are left completely unmodified —
  this sub-project does not touch `src/lib/documents.ts`. When a document
  is created within a dossier, the business logic that creates it sets
  `ownerId` to the dossier's `clientId` by construction (enforced in code,
  not a DB constraint, matching this codebase's existing style of
  application-level invariants over composite DB constraints for
  same-transaction values).
- **Status transitions are enforced server-side**, not just hidden in the
  UI: a client-role request to the status endpoint can only ever move a
  dossier from `not_started` to `submitted`; every other transition
  requires admin/super_admin.

## Data model

Two changes, both additive — no existing Document Storage table is
altered beyond the two new `documents` columns:

```
dossiers
  id          uuid primary key
  clientId    uuid not null references users(id)
  taxYear     integer not null
  status      text not null default 'not_started'
              (enum: not_started | submitted | in_review | completed)
  createdAt   timestamptz not null default now()
  updatedAt   timestamptz not null default now()

documents (extended — existing columns unchanged, see Document Storage spec)
  dossierId   uuid not null references dossiers(id)
  category    text not null
              (enum: salaire | releves_bancaires | assurance | pilier3
                     | justificatifs | autre)
```

The `category` enum's internal keys map to these French display labels
(used verbatim in the UI, matching this app's `lang="fr"` convention):

| Internal key         | Display label                  |
|-----------------------|--------------------------------|
| `salaire`              | Certificat de salaire           |
| `releves_bancaires`   | Relevés bancaires                |
| `assurance`            | Attestations d'assurance        |
| `pilier3`               | 3e pilier                        |
| `justificatifs`        | Justificatifs divers             |
| `autre`                | Autre                            |

No uniqueness constraint on `(clientId, taxYear)` is added at the DB level
for this sub-project — the admin-creation flow is expected to prevent
duplicates by showing existing dossiers, but a hard constraint is a cheap
addition an implementer can include if it doesn't complicate the create
flow; not a hard requirement either way.

## API surface & access control

All routes require an authenticated session, following the same
route-level `request.cookies` + `getSessionUserByToken` pattern as every
existing route in this codebase (never `next/headers`'s `cookies()`).

- `POST /api/dossiers` — role: `admin`/`super_admin` only. Body:
  `{clientId, taxYear}`. Creates a dossier with `status: 'not_started'`.
- `GET /api/dossiers` — role: `client` returns their own dossiers;
  `admin`/`super_admin` must pass `?clientId=` (same "no default, 400 if
  missing" rule Document Storage's `GET /api/documents` already
  established).
- `GET /api/dossiers/:id` — role: the dossier's `clientId`, or any
  admin/super_admin. Returns the dossier plus its documents grouped by
  category. Enumeration-safe: a non-owner non-admin gets the same generic
  404 as a nonexistent dossier, matching Document Storage's established
  rule.
- `PATCH /api/dossiers/:id/status` — role: the dossier's `clientId` may
  only set `status: 'submitted'`, and only when the current status is
  `not_started`; `admin`/`super_admin` may set any of the four values.
  Writes an `audit_log` entry (`action: "dossier_status_changed"`,
  `metadata: {from, to}`) on every successful transition.
- `POST /api/documents/upload-url` — **modified**, not new: gains two
  required body fields, `dossierId` and `category`. Validates the
  requesting client owns the target dossier (enumeration-safe 404
  otherwise) before creating the pending document row; `category` is
  validated against the fixed 6-value list the same way `mimeType` is
  already validated against `ALLOWED_MIME_TYPES`.
- `POST /api/documents/:id/confirm`, `GET /api/documents`,
  `GET /api/documents/:id/download-url`, `DELETE /api/documents/:id` —
  **unchanged**. They already operate on `ownerId`, and a document's
  `ownerId` continues to correctly identify its owning client regardless
  of which dossier it belongs to.

A client requesting a dossier they don't own, or attempting a status
transition beyond `not_started → submitted`, gets a 404 or 400
respectively — never information distinguishing "exists but not yours"
from "doesn't exist", extending Document Storage's established
enumeration-safety rule to dossiers.

## Error handling

- `POST /api/dossiers` rejects a duplicate `(clientId, taxYear)` pair with
  a clear 400 if the implementer adds the uniqueness constraint; if not,
  duplicates are simply allowed (see Data model note above) and the admin
  UI is responsible for not inviting confusion.
- `POST /api/documents/upload-url` rejects an invalid `category` or an
  invalid/inaccessible `dossierId` before creating any row, mirroring
  Document Storage's existing "reject before any trace in the database"
  rule for mime type/size.
- `PATCH /api/dossiers/:id/status` rejects an out-of-order client
  transition (e.g. a client trying to set `in_review`) with a 400, not a
  403 — a 403 would confirm the dossier exists and is accessible, which is
  true here (the client does own it), so 400 "invalid transition" is the
  correct, non-leaking response.

## Testing

- **Unit** (Vitest, against real local Postgres/MinIO, matching Document
  Storage's established pattern): dossier creation, status-transition
  authorization (client can only submit, only from not_started; admin can
  set any value), the upload-url route's new dossier/category validation,
  and access control on `GET /api/dossiers/:id` (owner, non-owner, admin).
- **E2E** (Playwright, extending the existing suite): an admin creates a
  dossier for a client (via API call, since admin UI is bare-minimum and
  not the point of this test); the client logs in, sees the dossier, opens
  it, uploads a document under a category, and marks it submitted; the
  admin moves it to in_review then completed; a second client cannot see
  the first client's dossier.

## Open questions to resolve during implementation

- Whether to add the `(clientId, taxYear)` uniqueness constraint on
  `dossiers` — left to the implementer's judgment per the Data model
  section above; either choice satisfies this spec.
