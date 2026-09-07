# Running Fiduvia locally

Everything below was executed against this repo on 2026-09-06 and works. If a
step fails, it is a real problem, not a stale doc.

## What this project is

A Next.js 16 app (App Router, React 19, TypeScript) for a Swiss online
fiduciary. Postgres via Drizzle, documents in S3-compatible object storage,
transactional email over SMTP. Clients sign up, open a dossier per tax year,
upload supporting documents, and submit; admins review dossiers, change status,
and notify clients.

**Not to be confused with `Fiduvia.dc.html`** at the repo root — that is the
client's visual mockup (and is byte-for-byte what fiduvia.ch serves). It has no
backend and makes zero network calls. The real application is `src/`.

## Prerequisites

- Node 22 (CI pins this)
- Docker Desktop running — `open -a Docker` if the daemon is asleep

## First-time setup

```bash
cp .env.example .env          # defaults already match docker-compose
npm ci
docker compose up -d          # postgres + minio + minio-init + mailhog
npm run db:migrate            # applies migrations 0000–0008
npm run seed:admin -- admin@fiduvia.test a-long-enough-password
```

`seed:admin` creates a **super_admin** with its email pre-verified. Run it again
with different arguments to make more admins; it takes `<email> <password>`.

## Running it

```bash
npm run dev                   # http://localhost:3000
```

## Local services

| Service | URL | Credentials |
|---|---|---|
| App | http://localhost:3000 | see below |
| **MailHog** (catches all outbound mail) | http://localhost:8025 | none |
| MinIO console (object storage) | http://localhost:9001 | `fiduvia` / `fiduvia123` |
| MinIO API | http://localhost:9000 | — |
| Postgres | `localhost:5432` | `fiduvia` / `fiduvia` / db `fiduvia` |

## Credentials

Both accounts below are verified working in the local database.

| Role | Email | Password |
|---|---|---|
| Super admin | `admin@fiduvia.test` | `a-long-enough-password` |
| Client | `client@fiduvia.test` | `a-long-enough-password` |

These are **local development fixtures only**. Never use them anywhere else.

## The part that catches everyone: you cannot log in without MailHog

**Email 2FA is enforced.** There is no bypass, no "remember this device", and no
admin exemption — `createSession` has exactly one call site, in
`src/app/api/auth/verify-otp/route.ts`. A correct password alone gets you
nothing but an emailed code.

So the login flow is always:

1. Go to http://localhost:3000/login, enter email + password, submit.
2. You land on `/verify`, which is waiting for a 6-digit code.
3. **Open http://localhost:8025** — the code is in the newest message.
4. Type it in. Now you have a session.

Admins land on `/admin`, clients on `/portal`.

The code expires after **10 minutes**, allows **5 wrong attempts**, and is
single-use — requesting a new one invalidates the previous.

## Making a new client account

Sign up through the UI at http://localhost:3000/signup. It needs first name,
last name, email, password (min 10 characters), the password confirmation, and
the CGVU checkbox. Then collect the verification code from MailHog as above.

The terms checkbox is not decorative: `acceptTerms: true` is required by the API
(`z.literal(true)`), and the acceptance time is stored on `users.terms_accepted_at`.
Any script that posts to `/api/auth/signup` must send it.

## Tests

```bash
npm test                      # 169 unit tests (vitest)
npm run test:e2e              # 11 end-to-end tests (playwright)
npx tsc --noEmit              # typecheck
npm run lint
npm run build
```

Unit tests run against the **real** Postgres and MinIO, not mocks — the
containers must be up. Playwright starts the dev server itself
(`reuseExistingServer: true`, so an already-running one is fine).

## Project map

```
src/app/(public)/[lang]/   Marketing site. "/" is French (canonical, prerendered),
                           "/en" English, "/fr" redirects to "/".
src/app/(auth)/            login, signup, verify, forgot/reset password
src/app/portal/            Client area — dossiers, documents, contacts
src/app/admin/             Admin — dashboard, dossiers, stats, périodes, utilisateurs
src/app/api/               Route handlers
src/lib/auth/              password (argon2id), OTP, sessions, rate limiting
src/lib/documents.ts       Upload/confirm/list/delete + server-side verification
src/lib/storage/client.ts  S3 client (MinIO locally, Infomaniak in production)
src/lib/i18n/              FR/EN bundles; fr.ts is the source of truth for shape
src/db/schema.ts           Drizzle schema
src/db/migrations/         SQL migrations
src/proxy.ts               Locale routing
```

## Gotchas worth knowing before they cost you an hour

**OTP issuance is rate-limited to 5 per 15 minutes per user+purpose.** Running
the E2E suite two or three times back to back exhausts `admin@fiduvia.test`, and
the failures are confusing rather than obvious: the UI never redirects to
`/verify`, or login returns 200 but no valid session is set. There is no reset —
wait out the window. Check it with:

```sql
SELECT count(*) FROM audit_log a JOIN users u ON u.id = a.actor_user_id
WHERE u.email = 'admin@fiduvia.test' AND a.action = 'otp_issued'
  AND a.created_at > now() - interval '15 minutes';
```

**The login limiter counts rows in `audit_log`, which only ever grows.** Tests
that log in should use a fresh IP per run — see the comment at the top of
`tests/unit/routes/login.test.ts`.

**Shared constants must not live in `"use client"` modules.** A server component
importing a value from a client module gets a client-reference proxy, not the
value. This crashed the admin dashboard once with `STATUS_ORDER.reduce is not a
function`; that is why `src/lib/dossierStatus.ts` exists.

**`.disp` sets `color: var(--text-strong)` and ties with Tailwind's `text-white`
on specificity**, rendering near-invisible text on the dark petrol sidebar. Use
`font-display` + `text-white` on dark backgrounds.

**Prefer `getByLabel` over `getByPlaceholder` in tests.** Placeholder copy is
treated as changeable polish and has already invalidated tests. Note the signup
page now has two password labels, so it needs
`getByLabel("Mot de passe", { exact: true })` to avoid also matching
"Confirmer le mot de passe".

## One security note

The development database also contains `contact@fiduvia.ch` / `Fiduvia2002_`,
copied from the client's mockup. **That password is publicly readable in
fiduvia.ch's page source** and must never be used in production or reused
anywhere. See `AUDIT.md` for the disclosure detail.

## Production deployment

See `docs/deployment/foundation.md`. Note that two items in the brief are still
unbuilt and blocked on the client: Stripe payments (needs keys and a pricing
model) and Infomaniak provisioning (encryption at rest, document-bucket backup).
`AUDIT.md` §8 tracks the full requirement status.
