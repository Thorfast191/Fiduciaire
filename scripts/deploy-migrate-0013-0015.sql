-- Applies migrations 0013–0015 to a production database, and records them in
-- drizzle's journal so a later `npm run db:migrate` agrees with reality.
--
-- Why this file exists: the production image carries no dev dependencies, so
-- drizzle-kit cannot run there, and Postgres is not published off the compose
-- network so it cannot be reached from a laptop either. This is the same DDL
-- drizzle would emit, wrapped so it can be piped into psql inside the
-- container.
--
-- Safe to run twice: every step is guarded on the journal, so a second run is
-- a no-op rather than an error. All three migrations are additive — new
-- nullable columns, one new table, indexes and foreign keys. Nothing is
-- dropped and no existing row is rewritten.
--
--   sudo docker compose -f docker-compose.prod.yml --env-file .env.production \
--     exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
--     < scripts/deploy-migrate-0013-0015.sql

BEGIN;

CREATE SCHEMA IF NOT EXISTS drizzle;
CREATE TABLE IF NOT EXISTS drizzle."__drizzle_migrations" (
  id SERIAL PRIMARY KEY,
  hash text NOT NULL,
  created_at bigint
);

-- 0013_huge_falcon — an admin can reserve a dossier.
DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM drizzle."__drizzle_migrations"
    WHERE hash = '5cb29d762a6f8ef968da0be492d9b841f6315c0644c902b01001996661058b35'
  ) THEN
    ALTER TABLE "dossiers" ADD COLUMN "reserved_by" uuid;
    ALTER TABLE "dossiers" ADD COLUMN "reserved_at" timestamp with time zone;
    ALTER TABLE "dossiers" ADD CONSTRAINT "dossiers_reserved_by_users_id_fk"
      FOREIGN KEY ("reserved_by") REFERENCES "public"."users"("id")
      ON DELETE no action ON UPDATE no action;
    CREATE INDEX "dossiers_reserved_by_idx" ON "dossiers" USING btree ("reserved_by");

    INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
    VALUES ('5cb29d762a6f8ef968da0be492d9b841f6315c0644c902b01001996661058b35', 1789158773827);
    RAISE NOTICE 'applied 0013_huge_falcon';
  ELSE
    RAISE NOTICE 'skipped 0013_huge_falcon (already recorded)';
  END IF;
END
$mig$;

-- 0014_fresh_betty_brant — internal team comments on a dossier.
DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM drizzle."__drizzle_migrations"
    WHERE hash = '29b687f8434b825332375fac0b4114a8e64c63a526eea14085f3e5e9a93915ca'
  ) THEN
    CREATE TABLE "dossier_comments" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "dossier_id" uuid NOT NULL,
      "author_id" uuid NOT NULL,
      "body" text NOT NULL,
      "created_at" timestamp with time zone DEFAULT now() NOT NULL
    );
    ALTER TABLE "dossier_comments" ADD CONSTRAINT "dossier_comments_dossier_id_dossiers_id_fk"
      FOREIGN KEY ("dossier_id") REFERENCES "public"."dossiers"("id")
      ON DELETE no action ON UPDATE no action;
    ALTER TABLE "dossier_comments" ADD CONSTRAINT "dossier_comments_author_id_users_id_fk"
      FOREIGN KEY ("author_id") REFERENCES "public"."users"("id")
      ON DELETE no action ON UPDATE no action;
    CREATE INDEX "dossier_comments_dossier_idx"
      ON "dossier_comments" USING btree ("dossier_id","created_at");

    INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
    VALUES ('29b687f8434b825332375fac0b4114a8e64c63a526eea14085f3e5e9a93915ca', 1789220564744);
    RAISE NOTICE 'applied 0014_fresh_betty_brant';
  ELSE
    RAISE NOTICE 'skipped 0014_fresh_betty_brant (already recorded)';
  END IF;
END
$mig$;

-- 0015_new_vulcan — the postal address collected at signup.
DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM drizzle."__drizzle_migrations"
    WHERE hash = 'be05ab813b72de959d45e7fa5d3e12b887250aa6a71e60850e20b70b8cd69a33'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "street" text;
    ALTER TABLE "users" ADD COLUMN "postal_code" text;
    ALTER TABLE "users" ADD COLUMN "city" text;

    INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
    VALUES ('be05ab813b72de959d45e7fa5d3e12b887250aa6a71e60850e20b70b8cd69a33', 1789232624266);
    RAISE NOTICE 'applied 0015_new_vulcan';
  ELSE
    RAISE NOTICE 'skipped 0015_new_vulcan (already recorded)';
  END IF;
END
$mig$;

COMMIT;

-- What the database should now report.
SELECT id, hash, created_at FROM drizzle."__drizzle_migrations" ORDER BY id;
