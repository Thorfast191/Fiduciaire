# Deploying Fiduvia

Everything below was executed against this repo on 2026-09-08. The image builds,
starts, serves every public route and talks to a real database — that much is
verified. What is *not* done is any outward-facing deploy: no host has been
provisioned and nothing has been pushed anywhere.

> **Before you pick a hostname.** `fiduvia.ch` currently serves the client's
> static mockup (`Fiduvia.dc.html`). Deploying this app there replaces it. Use a
> staging hostname for client testing.

## What you need first

Values only you have. The app refuses to start without them.

| Variable | What it is |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Public origin. **Baked in at build time** — see below. |
| `SITE_ADDRESS` | What Caddy answers on (usually the same host) |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Database credentials |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Transactional email |
| `CONTACT_EMAIL` | Where both contact forms deliver |
| `STORAGE_*` | Infomaniak S3 endpoint, bucket, keys, region |

**Email is not optional.** Every login requires a code sent by email — there is
no bypass (`createSession` has exactly one call site, in
`src/app/api/auth/verify-otp/route.ts`). If SMTP is misconfigured, nobody can
sign in, including you.

## 1. Configure

```bash
cp .env.production.example .env.production
$EDITOR .env.production          # fill in every value
```

## 2. Build

`NEXT_PUBLIC_SITE_URL` is inlined into the bundle by Next, so it is a **build
argument**, not a runtime variable. It ends up in canonical URLs, `sitemap.xml`
and `robots.txt`; building with the wrong value means rebuilding, not restarting.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://staging.example.ch
```

Every other variable is read at runtime. The build stage sets throwaway
placeholders for them (`Dockerfile`), because `src/lib/env.ts` validates the
environment on import and `next build` imports every route to collect page data.
A missing variable at *runtime* still fails fast at startup, which is what you
want.

## 3. Start the database, then migrate

Migrations do **not** run automatically, and the app image cannot run them:
`drizzle-kit` is a dev dependency and the runtime image carries none.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d postgres

# From a checkout with dev dependencies installed, pointed at the same database.
# Publish 5432 temporarily, or run this on the host itself.
DATABASE_URL='postgres://USER:PASS@HOST:5432/fiduvia' npm run db:migrate
```

Applies `0000`–`0009`. `0009` adds `service_type` to `dossiers` and replaces the
`(client_id, tax_year)` unique index with `(client_id, tax_year, service_type)`;
existing rows default to `declaration`.

## 4. Create the first admin

```bash
DATABASE_URL='postgres://USER:PASS@HOST:5432/fiduvia' \
  npm run seed:admin -- admin@yourdomain.ch 'a-long-enough-password'
```

Creates a `super_admin` with its email pre-verified. Run it again with different
arguments for more admins. **Use a real address you can receive mail at** — you
will need the emailed code to log in.

## 5. Bring everything up

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

Caddy obtains and renews TLS certificates automatically, and adds
`Strict-Transport-Security`. The app deliberately does not send HSTS itself
(there is a test asserting its absence) — it is served over plain HTTP in
development and only the proxy knows TLS is really terminated.

Neither the app nor Postgres publishes a port; Caddy is the only way in.

## 6. Check it came up

```bash
curl -sI https://staging.example.ch/login | grep -iE 'x-frame|content-security|strict-transport'
```

Then, in a browser: open a period under **Périodes** (clients cannot request
anything until one is active), and run one login all the way through the emailed
code.

## Opening a tax period

A fresh database has no periods, so the client portal offers nothing. As an
admin, go to **Périodes** and create the year, then activate it. Only active
periods are offered to clients; admins can still open a dossier for a closed
year, which is deliberate — see `src/app/api/dossiers/route.ts`.

## Updating

```bash
git pull
docker compose -f docker-compose.prod.yml --env-file .env.production build \
  --build-arg NEXT_PUBLIC_SITE_URL=https://staging.example.ch
# run any new migrations first, then:
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

## Backups — not configured

`docker-compose.prod.yml` keeps Postgres in a named volume (`pgdata`) and
nothing backs it up. Client documents live in Infomaniak's S3, so they are
outside this stack, but the database holding users, dossiers and the audit log
is not. Set up `pg_dump` on a schedule before real client data goes in.

## Known gaps at this point

- **Assistance** and **Paiements** are still greyed "bientôt" in the client
  sidebar. Every other prestation is live.
- The mockup's multi-page declaration questionnaire does not exist; the portal
  collects documents against fixed categories instead.
- Dossier statuses are the project's four (`not_started`, `submitted`,
  `in_review`, `completed`), not the mockup's six — `demande_piece` and
  `pieces_recues` are expressed as notifications instead. See `AUDIT.md` §7.
