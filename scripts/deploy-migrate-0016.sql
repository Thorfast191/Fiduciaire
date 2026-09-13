-- Applies migration 0016 to production and records it in drizzle's journal.
-- Same approach as scripts/deploy-migrate-0013-0015.sql: the runtime image has
-- no drizzle-kit and Postgres is not reachable off the compose network, so the
-- DDL is piped into psql inside the container and the journal row is written
-- by hand with drizzle's own hash.
--
-- Additive and nullable, so the previous release runs fine against it.
-- Guarded, so running it twice is a no-op.
--
--   ssh ... 'sudo docker exec -i fiduvia-postgres-1 psql -U fiduvia -d fiduvia -v ON_ERROR_STOP=1' < scripts/deploy-migrate-0016.sql

BEGIN;

DO $mig$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM drizzle."__drizzle_migrations" WHERE hash = '2f7e5dec9c515413865bf22c0c53ab37dc9b84bab8b56b0eb828c155a2a18594'
  ) THEN
    ALTER TABLE "dossier_notifications" ADD COLUMN "requested_documents" jsonb;
    INSERT INTO drizzle."__drizzle_migrations" (hash, created_at)
    VALUES ('2f7e5dec9c515413865bf22c0c53ab37dc9b84bab8b56b0eb828c155a2a18594', 1789322176780);
    RAISE NOTICE 'applied 0016_powerful_medusa';
  ELSE
    RAISE NOTICE 'skipped 0016_powerful_medusa (already recorded)';
  END IF;
END
$mig$;

COMMIT;

SELECT count(*) AS migrations FROM drizzle."__drizzle_migrations";
