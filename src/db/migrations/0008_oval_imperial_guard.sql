-- One dossier per client per tax year.
--
-- Existing duplicates must be resolved before the unique index can be built.
-- The survivor is the MOST ADVANCED dossier, not the newest: in the development
-- data 22 of 55 duplicate groups had a newer `in_review` row shadowing an older
-- `completed` one, so "newest wins" would have discarded finished work.
-- Recency only breaks ties between rows at the same status.
--
-- Documents and notifications are re-pointed onto the survivor before the
-- losers are removed, so nothing referencing a dossier is orphaned. Note that
-- `audit_log.target_id` has no foreign key and is deliberately left alone —
-- history should keep naming the row that the event actually happened to.
CREATE TEMP TABLE dossier_dedupe ON COMMIT DROP AS
WITH ranked AS (
  SELECT
    id,
    client_id,
    tax_year,
    row_number() OVER (
      PARTITION BY client_id, tax_year
      ORDER BY
        CASE status
          WHEN 'completed'   THEN 4
          WHEN 'in_review'   THEN 3
          WHEN 'submitted'   THEN 2
          WHEN 'not_started' THEN 1
          ELSE 0
        END DESC,
        created_at DESC,
        id DESC
    ) AS rn
  FROM dossiers
)
SELECT
  loser.id AS loser_id,
  winner.id AS survivor_id
FROM ranked AS loser
JOIN ranked AS winner
  ON winner.client_id = loser.client_id
 AND winner.tax_year  = loser.tax_year
 AND winner.rn = 1
WHERE loser.rn > 1;
--> statement-breakpoint
UPDATE documents
SET dossier_id = d.survivor_id
FROM dossier_dedupe d
WHERE documents.dossier_id = d.loser_id;
--> statement-breakpoint
UPDATE dossier_notifications
SET dossier_id = d.survivor_id
FROM dossier_dedupe d
WHERE dossier_notifications.dossier_id = d.loser_id;
--> statement-breakpoint
DELETE FROM dossiers
USING dossier_dedupe d
WHERE dossiers.id = d.loser_id;
--> statement-breakpoint
DROP INDEX "dossiers_client_id_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "dossiers_client_tax_year_idx" ON "dossiers" USING btree ("client_id","tax_year");
