# Fiduvia — OLD vs NEW audit

**Date:** 2026-09-06 · **Scope:** audit only, no code changed.

> ### ⚠ Urgent — live credential exposure
>
> **fiduvia.ch serves the Super Administrator password in its public page
> source.** `pw:"Fiduvia2002_"` and `pw:"1234"` are readable by anyone who views
> source on the live site.
>
> The mockup itself cannot be breached — it has no backend, no accounts and no
> stored data (§"What was compared"). **The real risk is password reuse:** if
> `Fiduvia2002_` is also used for the client's email, Infomaniak, domain
> registrar, bank or Stripe account, those are exposed today. It should be
> rotated wherever else it appears, independently of this project's timeline.
>
> The brief lists securing these credentials as a pre-production task. It is a
> live issue now, not at launch.

> **Scope note.** §7 compares the platform to the mockup. §8 compares it to the
> client's written brief. **§8 is binding** — the client states directly that the
> mockup is a visual reference and its technical structure need not be kept. Read
> §7 as a scope-difference map, not a defect list.

## What was compared

Your request left the two paths as `<path>` placeholders. There is exactly one
HTML/JS codebase in this repo, so it was taken as OLD:

| | Path | What it is |
|---|---|---|
| **OLD** | `Fiduvia.dc.html` (7,501 lines) + `support.js`, `_ds/` | Claude Design canvas export. A single-file client-side prototype. Duplicated verbatim at `Fiduciaire (4)/Fiduvia.dc.html`. |
| **NEW** | `src/` (Next.js 16, ~14k lines TS/TSX) | The rewrite. |

### The live demo at fiduvia.ch *is* `Fiduvia.dc.html` — verified

This was checked directly, because it determines whether this audit compares the
right things. **fiduvia.ch serves the same file.**

| Check | Result |
|---|---|
| Raw bytes | live 774,094 · local 774,100 |
| Difference | The local `.dc.html` wraps the document in an HTML comment (`<!-- … -->`). Content is otherwise identical. |
| Design-system bundle | `design-system-16c37d22-ce07-4262-affa-55376831535b` — same UUID on both |
| Scripts served | `fiduvia.ch/support.js`, the same `_ds` bundle, jsPDF 2.5.1 from the same CDN, React 18.3.1 UMD |
| `payExtra`, `confirmSubmitAll`, `_pdfDocPage`, `pickDoc`, `doLogin` | present and identical in both |
| `fetch(` / `XMLHttpRequest` occurrences on the **live** site | **0** |

So the client demo is the mockup, deployed as a static page. There is no separate
"real" version of it with a working backend. Every finding below applies to
fiduvia.ch exactly as it applies to the local file, including that the live demo
performs **zero network requests** and persists nothing.

**One methodology note:** all findings are read from source. The demo's
authenticated areas were not clicked through, because there is nothing behind
them to observe — no server, no accounts, no stored data. Reading its 7,501 lines
is strictly more complete than clicking it, since state that never leaves the
browser is fully described by the code that sets it.

**One fact governs half of this audit:** OLD contains **no network calls of any
kind** — no `fetch`, no `XMLHttpRequest`, no beacon, no WebSocket (verified by
grep across all 7,501 lines). Every "action" in OLD is a React-style
`this.setState` against in-memory JavaScript objects, seeded from hardcoded
literals, discarded on page reload. It has no server, no database, and no
persistence. So for anything requiring a backend, OLD is a **visual simulation**,
not an implementation — and "does NEW have parity with OLD" is often the wrong
question. Where that is the case, it is said plainly below.

---

## 1. 2FA

**NEW: implemented. Email OTP. Enforced, not opt-in.**
**OLD: not implemented.**

NEW uses a 6-digit numeric code emailed to the user. Not TOTP, not SMS.

| Piece | Location |
|---|---|
| Code generation (6 digits, `crypto.randomInt`) | `src/lib/auth/otp.ts:13-15` |
| Storage as SHA-256 digest | `src/lib/auth/otp.ts:20-22` |
| 10-minute TTL | `src/lib/auth/otp.ts:6` |
| 5-attempt cap, then lockout | `src/lib/auth/otp.ts:7`, `:71-88` |
| Prior unconsumed codes invalidated on reissue | `src/lib/auth/otp.ts:28-37` |
| Issuance rate limit (5 per 15 min per user+purpose) | `src/lib/auth/rateLimit.ts:54-76` |
| `otp_codes` table | `src/db/schema.ts:63-86` |

**Why "enforced" is a verified claim, not an assumption:** `createSession` and
the session-cookie write each have exactly **one** call site in the whole
codebase — `src/app/api/auth/verify-otp/route.ts:48` and `:64`. The login route
(`src/app/api/auth/login/route.ts:74-83`) verifies the password and then only
issues a code and returns `{ok:true}`; it never mints a session. There is no
"remember this device" path, no bypass flag, no admin exemption. Password alone
cannot produce an authenticated session.

Covers three purposes — `login`, `signup`, `password_reset`
(`src/db/schema.ts:70-72`).

**OLD has no second factor.** `doLogin` at `Fiduvia.dc.html:6002-6022` compares
the typed password to a plaintext string on an in-memory object
(`:6009`, `:6015`) and immediately flips `view:"portal"`. The only occurrences of
"2FA" in OLD are prose in the privacy policy and CGV artboards
(`Fiduvia.dc.html:971`, `:1110`) describing 2FA as something Fiduvia "prévoit
d'utiliser" — text, not behaviour.

> **Separate finding, worth flagging.** OLD's login has a fallthrough at
> `Fiduvia.dc.html:6019-6020`: after the super-admin and admin branches miss, any
> email that is merely non-empty, with any non-empty password, is logged in as a
> client. No credential check at all. It is a demo shortcut, and it must not be
> carried across. NEW does not have it.

---

## 2. Password policy at signup

**NEW: partially implemented.** The only rule is a 10-character minimum.
**Enforced on both sides — server-side authoritative.**

| Layer | Location | Rule |
|---|---|---|
| Server | `src/app/api/auth/signup/route.ts:17` | `z.string().min(10)` |
| Server (reset) | `src/app/api/auth/reset-password/route.ts:16` | `z.string().min(10)` |
| Browser | `src/app/(auth)/signup/page.tsx:148` | `minLength={10}` |
| Browser (reset) | `src/app/(auth)/reset-password/page.tsx:189` | `minLength={10}` |
| Displayed rule text | `src/lib/i18n/messages/fr.ts:261`, `:308` | "Au moins 10 caractères" |

The server check is not a mirror of the client's — it runs on a route that
rejects with 400 before any user row is written
(`src/app/api/auth/signup/route.ts:24-30`). Stripping `minLength` in devtools
does not get a short password through.

Storage is argon2id (`src/lib/auth/password.ts:1-5`) — a correct choice, and
verification is constant-path with a cached dummy hash to close the timing
oracle (`src/app/api/auth/login/route.ts:24-32`, `:55-56`).

**What is missing, precisely:**
- No complexity requirement — no character-class, mixed-case, digit, or symbol rule.
- No maximum length, so an argon2 hash is computed over arbitrarily long input.
- No breach-corpus or common-password check (no HIBP, no denylist).
- No similarity check against the user's own email or name.
- **No confirm-password field on signup.** `src/app/(auth)/signup/page.tsx:12-17` — form state is `{email, password, firstName, lastName}`. OLD *did* have one (`Fiduvia.dc.html:530`, validated at `:6030`). This is a genuine regression from OLD.
- No terms/CGU acceptance checkbox. OLD had one and blocked signup without it (`Fiduvia.dc.html:6031`). NEW's signup page and route contain no CGU field at all.

**OLD's policy: not implemented.** `doSignup` at `Fiduvia.dc.html:6025-6038`
checks only that fields are non-empty (`:6029`), that the two password fields
match (`:6030`), and that the CGU box is ticked (`:6031`). No length rule, no
complexity rule. Client-side only, because there is no server.

---

## 3. Document storage

**NEW: partially implemented.** Files land in S3-compatible object storage via
presigned URLs. **Encryption at rest: not implemented. Retention: not
implemented. Backup: DB only — the document bucket is not backed up.**

**Where files land.** Not local disk. An S3-compatible bucket, path-style
addressing so the same code works against MinIO locally and Infomaniak Object
Storage in production (`src/lib/storage/client.ts:16-24`). Config in
`src/lib/env.ts:13-17`; local MinIO service at `docker-compose.yml:13-33`.

Bytes never transit the app server. The browser gets a 5-minute presigned PUT
(`src/lib/storage/client.ts:11`, `:26-36`) and uploads direct
(`src/app/portal/dossiers/[id]/DossierDetail.tsx:79-106`). Key layout:
`clients/{ownerId}/{documentId}-{sanitizedFilename}`
(`src/lib/documents.ts:30-36`), filename sanitized to `[a-zA-Z0-9._-]` at `:26-28`.

Upload constraints are enforced **twice**, and the second time is the one that
counts: the claimed type/size are checked when the URL is issued
(`src/lib/documents.ts:51-59`, allow-list and 20 MB cap at `:11-16`), then
`confirmUpload` re-reads the object's **actual** `HEAD` metadata and re-applies
both checks to the real values (`src/lib/documents.ts:104-155`, `:137-144`).
Anything failing is deleted from the bucket and soft-deleted in the DB
(`:124-133`), so the confirmation cannot be retried. This closes the presigned-PUT
hole where a caller requests a URL for a small PNG and uploads an executable.
Regression test: `tests/unit/uploadVerification.test.ts`.

**Who can read them.** Two gates, and the second is broad:

- **Clients:** own documents only. `getAccessibleDocument` at `src/lib/documents.ts:192-210` requires `doc.ownerId === requester.id` for non-admins (`:203`, `:206-208`). Enforced on download (`src/app/api/documents/[id]/download-url/route.ts:31`) and delete (`src/app/api/documents/[id]/route.ts:30`).
- **Admins:** **every document belonging to every client.** `src/lib/documents.ts:204-207` — any `admin` or `super_admin` passes the check unconditionally. There is no assignment, no per-dossier scoping, no "this admin handles this client" relation anywhere in the schema. That may be the intent for a small firm, but it is not a restriction, and no code narrows it.

Downloads are presigned GETs, 5-minute TTL, with RFC 6266 filename encoding so
accented French filenames survive (`src/lib/storage/client.ts:38-57`). Every
download writes an audit row (`src/app/api/documents/[id]/download-url/route.ts:47-53`).

**Encryption at rest: not implemented.** No `ServerSideEncryption`,
`SSECustomerKey`, `aws:kms`, or `AES256` parameter appears anywhere in `src/`,
`scripts/`, `docker-compose.yml`, or `Dockerfile` — verified by grep. The
`PutObjectCommand` at `src/lib/storage/client.ts:30-34` sets `Bucket`, `Key`,
`ContentType` and nothing else. Whether bytes are encrypted on disk depends
entirely on whatever the storage provider does by default, which this codebase
neither requests nor asserts. No application-level encryption either.

**Retention/lifecycle: not implemented.** No lifecycle rule, no TTL, no purge
job, no scheduled cleanup — no cron, no queue, no GitHub Action beyond
`.github/workflows/ci.yml`. Deletion is soft-only:
`softDeleteDocument` (`src/lib/documents.ts:212-217`) stamps `deletedAt` and
returns. **The object is never removed from the bucket on user delete.** The only
`deleteObject` call is the rejection path in `confirmUpload`
(`src/lib/documents.ts:127`). A client who deletes a document sees it vanish from
the UI while the bytes remain in storage indefinitely. For a Swiss fiduciary
holding tax documents, that is a data-retention question worth an explicit
decision.

**Backup: partially implemented, and it does not cover documents.**
`scripts/backup-db.sh:7-10` runs `pg_dump | gzip` and copies the dump to a backup
bucket. That is the **Postgres database only**. There is no equivalent for the
document bucket — no replication, no versioning, no sync. Restoring from this
backup gives you every `documents` row with its `storage_key`, pointing at
objects that were never backed up. The script is also not scheduled by anything
in the repo; it is a script someone must invoke.

**OLD: no storage of any kind.** `pickDoc` at `Fiduvia.dc.html:5424` takes the
`FileList`, maps it to `f.name`, and stores **only the filename strings** in
component state. The `File` objects and their bytes are discarded on the same
line. Nothing is uploaded, because OLD has no network layer. NEW is not behind
OLD here — OLD has nothing to be behind.

---

## 4. Payment trigger point

**NEW: not implemented.**
**OLD: not implemented — simulated in the UI only.**

**NEW has no payment code at all.** No Stripe, no TWINT, no gateway SDK, no
checkout route, no webhook handler, no price/amount/order/invoice table. The
dependency list (`package.json:17-29`) contains no payment library. The word
"payments" survives only as UI strings and a deliberately-disabled nav entry:
`src/components/shell/nav.ts:28` marks it `kind: "soon"`, and
`src/app/admin/stats/page.tsx:31` carries the comment *"third KPI is revenue;
this shows active clients, since payments do not exist."*

Because nothing exists, **there is no answer to "what happens on failure or if
the client closes the modal"** — there is no payment call, no modal, and no
state machine to be interrupted. Anything else would be describing intent.

**OLD simulates payment in three disconnected places, none of which is a
trigger point in a flow:**

| Mechanism | Location | What it actually does |
|---|---|---|
| Admin paid/unpaid toggle | `Fiduvia.dc.html:5934` (`togglePayment`) | Flips a string in `state.adminPayments` between `"paid"`/`"pending"`. Seeded from a hardcoded literal at `:5277`. |
| Extra-payment request | `:6067-6079` (`sendExtraPay`) | Pushes a row into `state.extraPayments` with `status:"pending"`. |
| Client "pays" an extra request | `:6081-6084` (`payExtra`) | Sets that row's `status` to `"paid"` and shows a toast. |
| Client refuses | `:6086-6089` (`refuseExtra`) | Sets `status:"refused"`, toast about partial refund. |
| Client payment history | `:7033-7035` | Three hardcoded rows (`CHF 420`, `CHF 390`, `CHF 180`). |

`payExtra` is the closest thing to a payment action, and its entire body is a
`setState` plus a toast. No amount is charged, no gateway is contacted, nothing
is validated. Stripe and TWINT appear in OLD **only as prose in the legal
artboards** (`Fiduvia.dc.html:849`, `:977`, `:1203`, `:4262`) — the CGV and
privacy policy describing payment providers the business intends to use.

**Critically for sequencing: OLD gates nothing on payment.** `confirmSubmitAll`
(`Fiduvia.dc.html:5428-5439`) — the submit-your-declaration handler — advances
status and never reads `adminPayments` or `extraPayments`. A declaration can be
submitted with payment `"pending"`. So there is **no payment trigger point in the
flow to port**; the pricing and billing model is still a client business decision,
not a lost feature.

---

## 5. PDF merge on submission

**NEW: not implemented.** No PDF library in `package.json`, no generation code
anywhere in `src/`.

**OLD: does not do what the button text claims.** There *is* a PDF generator, and
it is real jsPDF code — but it does **not merge uploaded documents**, and it is
**not triggered by submission**.

*What OLD actually generates* — two documents, both via `downloadPdfKind`
(`Fiduvia.dc.html:5679-5695`), using jsPDF loaded from CDN (`:18`, guarded at `:5658`):

1. **"form" PDF** (`_pdfBuildForm`, `:5665-5670`) — a cover page plus the questionnaire answers rendered as text sections. This one is genuine output.
2. **"docs" PDF** (`_pdfBuildDocs`, `:5671-5678`) — this is the one that looks like a merge and is not.

`_pdfBuildDocs` produces a cover, then a checklist of expected documents
(`_pdfDocsList`, `:5589-5616`) marking each PROVIDED/MISSING, then calls
`_pdfDocPage` once per provided document (`:5676`). And `_pdfDocPage`
(`:5617-5637`) draws **a placeholder card** — a rounded rectangle, a teal square,
the literal text `"PDF"`, and the *filename* as a caption (`:5630-5636`).

It never opens the file. It cannot: `pickDoc` (`:5424`) discarded the bytes at
upload time and kept only `f.name`. `_pdfDocEntries` (`:5572-5578`) confirms this —
it maps over expected document keys and reads `up[k]`, which is a string. **No
`addImage`, no embedded page, no byte-level merge exists in OLD.** The output is
a cover sheet manifest, not a merged dossier.

*On triggering:* `confirmSubmitAll` (`:5428-5439`) sets the dossier status and
shows the toast `submitPdfToast` — **"Déclaration transmise · PDF du dossier
généré."** (`:4457`). That string is a lie in OLD's own terms: the handler never
calls `downloadPdfKind` or any PDF function. Nothing is generated on submit. PDF
generation only ever happens when a user clicks one of six explicit download
buttons (`:5696-5701`), from the client dossier view, the client form view, or the
admin detail panel.

**So: "before or after payment confirmation" does not apply.** Generation is
manual, on-demand, unconnected to submission and unconnected to payment.

If a real merge (embedding the actual uploaded PDFs/images into one file) is a
requirement, it is **new work in both codebases**, not a port. NEW is better
positioned for it than OLD ever was, because NEW actually holds the bytes
(`src/lib/documents.ts`) — but note it would have to run server-side, and the
allow-list at `src/lib/documents.ts:11-15` admits `application/pdf`, `image/jpeg`
and `image/png`, so images would need rasterizing into pages.

---

## 6. Invoice email after payment

**Not implemented in either codebase.** Idempotency does not arise.

NEW: no invoice generation, no invoice template, no invoice table, no invoice
send path. The mail layer exists and works — `src/lib/email/send.ts` over
nodemailer, with three templates: `otpEmail.ts`, `contactEmail.ts`,
`notificationEmail.ts` (`src/lib/email/templates/`). None is an invoice. There is
no payment event for one to hang off (see item 4).

OLD: no invoice logic. "facture" appears only in the CGV artboard prose
(`Fiduvia.dc.html:893` — *"établir les factures"*, a stated obligation) and as a
document-category hint at `:4675` (*"Factures et justificatifs"* under medical
expenses). OLD cannot send email at all — no network layer.

For the record, since it will matter when this is built: the one place NEW does
send transactional mail on a state change is
`src/app/api/dossiers/[id]/notifications/route.ts`, and it has **no idempotency
guard** — each POST inserts a row and sends. Whatever pattern gets chosen for
invoices should not copy that as-is.

---

## 7. Is the project aligned with the client demo?

**No — and it was never built to be.** The demo describes a substantially larger
product. Structurally the two match well; by feature surface the project
implements roughly a quarter of what the demo shows.

### Client area — 3 of 12 sections built

The demo's client space has twelve sections (`clientSection` values in
`Fiduvia.dc.html`): `home`, `year`, `capital`, `departure`, `deces`, `taxoffice`,
`simu`, `acompte`, `relecture`, `assistance`, `paiements`, `contacts`.

| Demo section | In project | Where |
|---|---|---|
| `home` | **Yes** | `src/app/portal/page.tsx` |
| `year` (dossier detail) | **Yes** | `src/app/portal/dossiers/[id]/page.tsx` |
| `contacts` | **Yes** | `src/app/portal/contacts/page.tsx` |
| `capital` (prestation en capital) | No — greyed "bientôt" | `src/components/shell/nav.ts:22` |
| `simu` (simulation d'impôts) | No — greyed | `nav.ts:23` |
| `acompte` (acomptes) | No — greyed | `nav.ts:24` |
| `relecture` (relecture) | No — greyed | `nav.ts:25` |
| `assistance` (Fiduvia Assistance) | No — greyed | `nav.ts:27` |
| `paiements` | No — greyed | `nav.ts:28` |
| `departure` (départ à l'étranger) | **Not present at all** | — |
| `deces` (décès en cours d'année) | **Not present at all** | — |
| `taxoffice` | **Not present at all** | — |

Note the distinction: six appear in the sidebar as non-clickable "bientôt"
entries, so the shell *looks* like the demo; three have no representation in the
product at all. All six services are advertised on the public marketing page
(`src/app/(public)/[lang]/page.tsx`), so a visitor is offered six prestations and
can act on one.

Also absent: the demo's **multi-page declaration questionnaire** (`goToPage`,
`qPage`, 7 pages, `Fiduvia.dc.html:5419-5421`) with its per-page comments and
`resumePrevYear` carry-forward (`:5406-5416`). The project collects documents
against six fixed categories instead; it asks the client no questions.

### Admin area — nav 5/5, features fewer

Admin navigation is a **1:1 structural match** with the demo (`src/components/shell/nav.ts:33-43`
vs the demo's `aNav*` at `Fiduvia.dc.html:4542`): Accueil, Dossiers, Statistiques,
Périodes, Utilisateurs. The Dossiers prestation-hub pattern is reproduced too
(`src/app/admin/dossiers/page.tsx:18-49`) — five cards, one clickable.

Demo admin capabilities with **no equivalent in the project**:

| Demo feature | Location in demo |
|---|---|
| Automatic dossier distribution | `autoDistribute`, `Fiduvia.dc.html:2948` |
| Dossier reservation ("Réservé par") | admin table, `:7100` |
| Express 48h flag | admin dossier rows |
| Extra-payment request to a client | `sendExtraPay`, `:6067` |
| Paid/unpaid marking | `togglePayment`, `:5934` |
| Revenue KPIs (encaissé / en attente) | `:6659-6660` |
| Per-admin personal vs global stats | demo Accueil vs Statistiques |

The project's admin dashboard shows global figures only, with no revenue card —
`src/app/admin/stats/page.tsx:31` states the reason in a comment.

### Status vocabulary — a real mismatch, and it blocks things

The demo uses **six** statuses (`statusMeta`, `Fiduvia.dc.html:5190-5199`); the
project uses **four** (`src/lib/dossierStatus.ts:9-14`, enum at
`src/db/schema.ts:123-127`).

| Demo | Project |
|---|---|
| `questionnaire` | ≈ `not_started` |
| `encours` | ≈ `in_review` |
| `declaration_transmise` | ≈ `completed` |
| — | `submitted` (no demo equivalent) |
| `demande_piece` | **none** |
| `pieces_recues` | **none** |
| `reclamation` | **none** |

`demande_piece` / `pieces_recues` are load-bearing in the demo: `confirmSubmitAll`
(`:5433`) branches on them to decide the next status. The project has no way to
express "documents requested" or "documents received" as a dossier state — it
approximates the first with a separate notification row
(`dossier_notifications.kind = 'documents_requested'`, `src/db/schema.ts:238-240`).

This is the highest-priority item to settle, because **inline status editing and
the notification feature are both already built on the four-value enum.** Every
week it stays unresolved adds migration cost.

### What the project has that the demo does not

Alignment runs both ways, and the demo is not a superset:

- Real authentication with enforced email 2FA (the demo has none, plus the `:6019` fallthrough)
- Persistence of any kind — Postgres, sessions, audit log
- Real document storage with server-side verification
- Password reset by emailed code
- Rate limiting on login and OTP issuance
- Per-user locale driving transactional email
- Full FR/EN i18n with prefix-free French routing, sitemap, robots, JSON-LD
- Legal pages as routes (`/confidentialite`, `/mentions-legales`)

### Verdict

**Structurally aligned, functionally a subset.** The shell, navigation, hub
pattern, palette and copy follow the demo closely. What differs is scope: the
demo depicts six prestations, a questionnaire, payments and reservation/
distribution workflows; the project implements one prestation end-to-end with
real infrastructure the demo has none of.

**This is the correct outcome, and §8 confirms it.** The client's brief states
that the mockup is a visual foundation whose technical structure need not be
kept. Every gap listed in this section is unrequested work. Treat §7 as a map of
deliberate scope differences, not a backlog.

One consequence worth stating, because it reverses an earlier plan: the status
vocabulary mismatch above was only a problem under mockup-parity. **Under the
brief, the existing four-value enum is adequate** — nothing in the brief requires
`demande_piece`, `pieces_recues` or `reclamation`, and requirement 5's
"request supporting documents" flow is already served by `dossier_notifications`.
No status migration is needed.

## 8. Check against the client's written brief

The client's brief supersedes §7's mockup comparison as the definition of done.
Its own words settle the question §7 left open:

> "The current website is mainly a visual mockup. We built it with Claude to
> define the overall look, structure, and user journey… **We are not necessarily
> looking to keep the current technical structure. The goal is mainly to use the
> existing visual foundation** and turn it into a fully functional, secure
> platform."

That is the brief-binding position, in the client's own words. It also
independently confirms §7's central finding — the demo is a mockup, not a
product.

### Requirement-by-requirement

| # | Client requirement | Status | Where |
|---|---|---|---|
| 1 | Client account creation + secure personal area | **Built** | `src/app/api/auth/signup/route.ts`, `src/app/portal/*`, `src/lib/auth/session.ts` |
| 2 | 2FA by **email** verification code | **Built, enforced** | `src/lib/auth/otp.ts`, `src/app/api/auth/verify-otp/route.ts:48` |
| 3 | Clients submit files, **payment integrated at this stage** | **Partial** — upload built, payment absent | Upload: `src/lib/documents.ts`. Payment: nothing. |
| 4 | Storage on secure Swiss servers, scalable | **Partial** | `src/lib/storage/client.ts` (Infomaniak-ready); not provisioned, no SSE, no bucket backup |
| 5 | Automatic email notification from admin area | **Built** | `src/lib/notifications.ts`, migration `0006`, `NotifyClient.tsx` |
| 6 | Admin dashboard — clients, files, documents | **Built** | `/admin`, `/admin/dossiers`, `/admin/utilisateurs`, `/admin/periodes`, `/admin/stats` |
| 7 | Fix bugs present in the mockup | **Mostly moot** — see below | — |
| 8 | Optimize performance, security, UX, SEO | **Largely built** | `sitemap.ts`, `robots.ts`, `StructuredData.tsx`, migration `0005` indexes, argon2id, rate limiting |

**Five of eight built, two partial, one reframed.** Against the brief — not the
mockup — the platform is roughly three-quarters done.

### Requirement 2 is satisfied exactly as specified

The brief's first version said "SMS or email"; the detailed list narrows it to
"2FA using a verification code sent by email." That is precisely what exists
(`src/lib/auth/otp.ts`), enforced with no bypass. **No SMS provider is needed.**

### Requirement 3 answers the question §4 could not

"The ability for clients to submit their files directly through their account,
**with a payment method integrated at this stage**" fixes the payment trigger
that neither codebase defined: **payment fires at file submission**, gating the
transition out of the client's questionnaire/upload step. That is a concrete,
buildable specification.

### Requirement 7 — "fix the bugs in the mockup" — mostly does not transfer

The client thinks of the mockup as "the website". Because the platform is a
separate implementation, the mockup's defects are not inherited. For the record,
they were: the login backdoor (`Fiduvia.dc.html:6019`), simulated payment state
(`:5277`), the placeholder PDF (`:5617`), and the false "PDF généré" toast
(`:5428`). None exist in the platform.

The defects that *are* real are the ones in §1–3 of this audit — soft-delete
leaving bytes in the bucket, every admin reading every client's documents,
missing signup confirm-password and CGU, duplicate `(client_id, tax_year)` rows,
non-idempotent notifications.

### Not requested anywhere in the brief

Everything §7 listed as a mockup gap: the 8 additional prestations, the 7-page
questionnaire, dossier reservation, automatic distribution, Express 48h,
extra-payment requests, the PDF merge, and invoice generation. **The brief asks
for none of it.** Building it would be months of unrequested work.

### Recommendation on payments (the brief invites one)

Stripe is the right default: CHF support, strong API, and TWINT availability in
Switzerland — worth confirming current terms for the client's account type
before committing. If TWINT is expected to be the *primary* method rather than a
secondary one, **Payrexx** (Swiss, TWINT-native) is the stronger fit; Datatrans
suits higher volume. Stripe can also issue payment receipts automatically, which
partly covers the invoicing the brief omits but a Swiss fiduciary will want.

## Summary

| # | Item | NEW | OLD |
|---|---|---|---|
| 1 | 2FA | **Implemented** — email OTP, enforced, single session-creation path | Not implemented (+ login backdoor at `:6019`) |
| 2 | Password policy | **Partial** — 10-char minimum only, both sides, server authoritative; no confirm field, no CGU, no complexity | Not implemented (non-empty + match + CGU) |
| 3 | Document storage | **Partial** — S3 presigned + server-side verification; no encryption at rest, no retention, bucket not backed up, all admins read all documents | Not implemented (filenames only, bytes discarded) |
| 4 | Payment trigger | **Not implemented** | Not implemented (in-memory toggles; nothing gated on payment) |
| 5 | PDF merge on submit | **Not implemented** | Not a merge — placeholder manifest; manual button, never fires on submit |
| 6 | Invoice email | **Not implemented** | Not implemented |

**Two things in OLD that NEW dropped and should not have:** the signup
confirm-password field (`Fiduvia.dc.html:530`, `:6030`) and the CGU acceptance
checkbox (`:6031`). Both are cheap to restore and the CGU one is likely a legal
requirement for a Swiss fiduciary.

**Three gaps in NEW that are nobody's regression** — they were never built,
in either codebase: encryption at rest, document-bucket backup and retention,
and the entire payment/invoicing surface. Items 4, 5 and 6 are new construction,
not recovery of lost work.

### What this means for the work — settled position

Scope is the **client brief** (§8), not mockup parity (§7). Against the brief the
platform is roughly three-quarters complete: five of eight requirements built,
two partial, one that does not transfer.

**Remaining, in order:**

1. **Defect fixes** — unblocked, start here. Soft-delete leaves objects in the
   bucket (`src/lib/documents.ts:212`); every admin can read every client's
   documents (`:204`); signup lacks confirm-password and CGU; duplicate
   `(client_id, tax_year)` rows; non-idempotent notifications
   (`src/app/api/dossiers/[id]/notifications/route.ts`).
2. **Payment at the file-submission step** (requirement 3) — **blocked** on
   Stripe keys and a decision on what is charged per prestation, when, and the
   refund position.
3. **Infomaniak provisioning** (requirement 4) — **blocked** on the client's
   account. Covers encryption at rest, bucket backup, and a retention policy.

**Not in scope:** everything in §7 — the eight further prestations, the
questionnaire, reservation, automatic distribution, Express 48h, extra-payment
requests, the PDF merge, and invoice generation. Should the client later want
any of it, it is a priced change, not a defect.

**No status-vocabulary migration.** It was required only for mockup parity.
