# Fiduvia Platform — Foundation

Sub-project 1 of 7 in the Fiduvia platform rebuild. Establishes the framework,
database, hosting, and account/authentication system that every other
sub-project (document storage, client portal, payments, admin dashboard,
notifications, marketing/SEO) builds on top of.

## Context

Fiduvia is launching a fully online accounting/fiduciary firm in Switzerland.
An initial visual mockup (`Fiduvia.dc.html`) was built with Claude to define
look, structure, and client journey, and deployed to fiduvia.ch. A technical
audit of that live mockup (2026-08-25) found it is a static, client-side-only
export with no real backend: the "login" accepts any credentials, and the
super-admin password plus two real personal admin accounts are hardcoded in
plaintext in the publicly served page source. The site also has a self-signed
TLS certificate combined with an HSTS header (a lockout risk), no HTTPS
enforcement on port 80, missing deployed assets, no security headers, and no
SEO fundamentals.

This spec starts the real rebuild. The mockup's domain modelling (client
portal sections, admin portal sections, Super Admin vs. Admin roles) is
carried forward as the intended feature set; the implementation is new.

**Decomposition.** The full platform was broken into seven independent
sub-projects, each getting its own design → spec → plan cycle:

1. **Foundation** (this document) — framework, database, hosting, accounts, 2FA
2. Document storage — Swiss-hosted, encrypted, tied to accounts
3. Client portal — tax-declaration workflow, wired to real data and uploads
4. Payments — Stripe at the document-submission step
5. Admin dashboard — client/dossier management, RBAC, on real data
6. Notifications — admin-triggered client emails
7. Marketing site + French SEO

**Constraints gathered before design:**

- Claude Code is the implementer for the full build, not a spec for a hired
  freelancer.
- No existing hosting account. Client data must be hosted in Switzerland per
  the client's brief; Infomaniak was recommended and accepted.
- Expected scale: the client described year-one ambitions as "very big."
  Budget: lean, under ~CHF 200/month for infrastructure (hosting, database,
  storage, email — excluding Stripe fees). These two constraints together
  mean the architecture must scale by upgrading managed-service tiers later,
  not by being rewritten — it should not be provisioned for large scale on
  day one.
- Stack choice was left to Claude's judgment.

## Goals

- A working Next.js application with real accounts, password auth, and
  mandatory email-delivered 2FA on every login (client, admin, and super
  admin) — directly replacing the mockup's fake, credential-less login.
- A Postgres schema and session model that the later sub-projects (documents,
  portal, payments, admin, notifications) can build on without schema
  churn.
- A deployment pipeline (local dev → CI → production on Infomaniak) with
  real TLS, security headers, and backups from day one.
- No secrets — of any kind — committed to the repository or shipped to the
  client.

## Non-goals (deferred to later sub-projects)

- Document upload/storage, the tax-declaration questionnaire, Stripe
  checkout, the admin dashboard's client/dossier screens, and outbound
  notification emails are out of scope here. This sub-project produces the
  accounts and infrastructure they will be built on, plus a bare
  authenticated shell (login, 2FA, an empty client home, an empty admin
  home) to prove the pipeline end-to-end.
- Marketing site content/SEO is out of scope; the existing mockup copy is
  not touched in this sub-project.

## Architecture

- **Application**: Next.js 15 (App Router), TypeScript. One codebase will
  eventually serve the marketing site, client portal, and admin dashboard;
  this sub-project only builds the auth shell.
- **Database**: PostgreSQL 16. Chosen over a document store because the
  platform's core data (clients, dossiers, documents, payments) is
  inherently relational, and financial/tax records benefit from real
  transactions and strong consistency.
- **ORM**: Drizzle — full TypeScript inference, SQL-like query API, no
  separate query-engine binary to containerize (lighter to deploy than
  Prisma).
- **File storage**: not provisioned in this sub-project. Infomaniak
  S3-compatible Object Storage is the intended target (sub-project 2); the
  storage client is stubbed behind an interface so it can be added without
  touching auth code.
- **Email**: Infomaniak's mail infrastructure, sent through a thin
  `sendEmail(to, template, data)` abstraction so the provider can be swapped
  later without touching call sites. Used for OTP codes in this sub-project;
  reused for notifications in sub-project 6.
- **Hosting**: a single Infomaniak Public Cloud compute instance running the
  app as a Docker container behind Caddy, which handles Let's Encrypt TLS
  automatically. Postgres runs either on the same instance or Infomaniak's
  managed database service — decided during implementation once current
  Infomaniak pricing is checked against the CHF 200/month ceiling. The app
  itself is stateless (no in-memory session state — sessions live in
  Postgres and in the session cookie), so scaling up later means a bigger
  instance, a managed DB tier, or adding a load balancer in front of
  multiple instances — not a rewrite.
- **Environments**: local dev uses Docker Compose (Postgres + MinIO as a
  local S3-compatible stand-in + a mail catcher) so nothing touches real
  Infomaniak resources or sends real email while developing. CI runs against
  the same Docker Compose stack. Production is the Infomaniak instance
  described above. No separate staging environment yet — add one once real
  client traffic starts.

## Data model

Only the tables needed to support accounts, sessions, and 2FA. Later
sub-projects add their own tables (dossiers, documents, payments, etc.)
without needing to change these.

```
users
  id                uuid primary key
  email             text unique not null
  password_hash     text not null
  role              text not null  -- 'client' | 'admin' | 'super_admin'
  first_name        text not null
  last_name         text not null
  phone             text
  email_verified_at timestamptz
  disabled_at       timestamptz
  created_at        timestamptz not null default now()
  updated_at        timestamptz not null default now()

sessions
  id          uuid primary key
  user_id     uuid not null references users(id)
  token_hash  text not null
  user_agent  text
  ip          text
  expires_at  timestamptz not null
  created_at  timestamptz not null default now()

otp_codes
  id             uuid primary key
  user_id        uuid not null references users(id)
  purpose        text not null  -- 'login' | 'signup' | 'password_reset'
  code_hash      text not null
  attempt_count  int not null default 0
  expires_at     timestamptz not null
  consumed_at    timestamptz
  created_at     timestamptz not null default now()

audit_log
  id              uuid primary key
  actor_user_id   uuid references users(id)  -- null for system actions
  action          text not null
  target_type     text
  target_id       uuid
  metadata        jsonb
  ip              text
  created_at      timestamptz not null default now()
```

`role` is a plain text/enum column rather than a separate roles table —
three fixed roles (client, admin, super_admin) matches the mockup's existing
model and doesn't need the flexibility of a join table.

## Auth & 2FA flow

1. **Signup** (client-initiated): email + password. Row created in `users`
   with `email_verified_at` null.
2. **Every login**, for every role, no exceptions: email + password checked
   first (argon2id hash comparison). On success, a 6-digit OTP is generated,
   hashed, stored in `otp_codes` with a 10-minute expiry, and emailed. No
   session is created yet.
3. **OTP verification**: user submits the code; server checks it against the
   hash, confirms not expired, not already consumed, and `attempt_count`
   under the limit (5). On success: `otp_codes.consumed_at` set, a `sessions`
   row created, `email_verified_at` set if this was the first successful
   login, and an httpOnly/secure/sameSite session cookie issued. This also
   serves as email verification — there is no separate "verify your email"
   step.
4. **Rate limiting**: max 5 OTP attempts per code (then it's invalidated and
   a new one must be requested); max 5 login attempts per 15 minutes per
   account+IP pair. All auth error responses are generic ("incorrect email
   or password" / "incorrect or expired code") — the flow never reveals
   whether an email exists, or whether the password or the code was wrong.
5. **Password reset**: same OTP mechanism with `purpose = 'password_reset'`,
   requested from a "forgot password" form; successful verification allows
   setting a new password and invalidates all existing sessions for that
   user.
6. **What's intentionally excluded**: "remember this device" (skip OTP for
   N days). The client's brief asks for a code on every login; skipping it
   is a convenience feature, not a requirement, and adds meaningful
   complexity (device fingerprinting/trust storage) for no immediate need.
   Can be added later as its own small piece of work.

RBAC is a straightforward `role` check in server-side route/middleware
guards — no separate permissions table needed for three fixed roles.
`super_admin` is distinguished from `admin` only by which admin actions are
authorized (e.g. managing other admin accounts) — enforced the same way.

## Error handling

- Every server-side error is logged (structured, via `pino`) with enough
  context to debug (route, user id if authenticated, request id) and never
  returns a stack trace or internal message to the client — auth failures
  and unexpected errors alike return generic, user-safe messages.
- Next.js `error.tsx` boundaries at the root and portal-section level so a
  single failing page doesn't take down the whole app shell.
- OTP/session/rate-limit failures are modeled as expected outcomes (typed
  results), not thrown exceptions — only genuinely unexpected failures
  (DB unreachable, etc.) hit the error-boundary path.

## Security baseline

- Headers set from the start: CSP, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, a locked-down
  `Permissions-Policy`, `frame-ancestors 'none'`.
- HSTS is the one header **not** enabled by default. It's a go-live
  checklist item, turned on only after confirming automatic TLS renewal is
  working reliably in production — the audit's core TLS finding was HSTS
  enabled over a broken (self-signed) certificate, which can hard-lock
  browsers out; this ordering exists specifically to prevent repeating that.
- Nightly automated Postgres backups to a separate (non-document) storage
  bucket, rolling retention.
- No secret (DB credentials, session signing key, Infomaniak API keys, SMTP
  credentials) is ever committed to the repo; all are environment variables
  injected at deploy time via CI secrets.

## Testing

- **Unit** (Vitest): password hashing/verification, OTP generation and
  validation (including expiry and attempt-limit edge cases), RBAC guard
  helpers.
- **End-to-end** (Playwright): signup → OTP verify → reach client home;
  login → OTP verify → reach client home; admin login → OTP verify → reach
  admin home; wrong password; wrong/expired OTP; OTP attempt-limit lockout;
  login rate-limit lockout.
- CI (GitHub Actions) runs lint, type-check, unit, and E2E on every PR, and
  blocks merging on failure.

## Open questions to resolve during implementation

- Exact Infomaniak instance/database sizing against the CHF 200/month
  ceiling — needs current pricing, not guessed numbers.
- Whether Postgres runs on the same instance as the app initially or on
  Infomaniak's managed database service from day one — a cost/operational
  trade-off to make once pricing is confirmed, not an architectural one
  (either is a drop-in swap of a connection string).
