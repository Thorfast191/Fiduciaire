# Deploying the Foundation

## One-time Infomaniak setup

1. Create an Infomaniak Public Cloud project and a small compute instance
   (Debian or Ubuntu image). Note its public IP.
2. Point fiduvia.ch and www.fiduvia.ch DNS A records at that IP.
3. On the instance: install Docker and Caddy. Configure the instance's
   firewall (Infomaniak security group / iptables) to only expose ports
   80 and 443 publicly — port 3000 must not be internet-facing; the app
   binds to `127.0.0.1:3000` and is reached only via Caddy's reverse proxy.
4. Create an Infomaniak Object Storage bucket dedicated to database backups
   (separate from the sub-project-2 documents bucket). Generate an
   access/secret key pair for it and run `aws configure` on the instance.
5. Either install PostgreSQL on the same instance, or provision Infomaniak's
   managed database service and use its connection string — confirm current
   pricing against the CHF 200/month ceiling before choosing (see the
   Foundation spec's open questions).

## Environment variables (production)

Set on the instance (e.g. in a `.env` file readable only by the app's
service user, permissions `600`, never committed):

- `DATABASE_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`,
  `SMTP_PASS`, `SMTP_FROM` — from Infomaniak's real mail service, not
  Mailhog.

## Deploy

1. Build the production app image (or build directly on the instance):
   `docker build -t fiduvia-app .`
   and the build-stage image for migrations and admin setup (contains devDependencies):
   `docker build --target build -t fiduvia-app:build .`
2. Run migrations: `docker run --rm --env-file .env fiduvia-app:build npm run db:migrate`
3. Create the real admin account: `docker run --rm --env-file .env fiduvia-app:build npm run seed:admin -- admin@fiduvia.ch a-real-strong-password`
   (Replace the email and password with real production credentials.)
4. Run the app: `docker run -d --name fiduvia-app --env-file .env -p 127.0.0.1:3000:3000 --restart unless-stopped fiduvia-app`
5. Place the `Caddyfile` at `/etc/caddy/Caddyfile` and reload Caddy — this
   is what obtains the real TLS certificate.
6. Schedule the backup script via cron, nightly: add a crontab entry
   `0 3 * * * DATABASE_URL=... BACKUP_S3_BUCKET=... BACKUP_S3_ENDPOINT=... /path/to/scripts/backup-db.sh`.

## Go-live checklist

- [ ] Confirm `https://fiduvia.ch` loads with a trusted certificate (no
      browser warning) — check from a real browser, not just `curl -k`.
- [ ] Confirm certificate auto-renewal is working (Caddy handles this, but
      verify the instance can reach Let's Encrypt on port 80/443).
- [ ] Only once the above are both confirmed: enable HSTS by adding
      `Strict-Transport-Security: max-age=31536000` back into
      `next.config.ts`'s headers (Task 19 deliberately left it out). This
      ordering is the direct fix for the audit's cert/HSTS finding.
- [ ] Confirm the production admin account created in Deploy step 3 can log
      in and access the admin panel before real client traffic arrives.
