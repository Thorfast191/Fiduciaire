-- Removes every row a unit/e2e run left behind. Test accounts always use the
-- @example.test domain, so the domain is the whole selector.
BEGIN;
CREATE TEMP TABLE t AS SELECT id FROM users WHERE email LIKE '%@example.test';
CREATE TEMP TABLE td AS SELECT id FROM dossiers WHERE client_id IN (SELECT id FROM t);

DELETE FROM dossier_notifications WHERE dossier_id IN (SELECT id FROM td) OR sent_by IN (SELECT id FROM t);
DELETE FROM dossier_comments WHERE dossier_id IN (SELECT id FROM td) OR author_id IN (SELECT id FROM t);
DELETE FROM documents WHERE dossier_id IN (SELECT id FROM td) OR owner_id IN (SELECT id FROM t) OR uploaded_by IN (SELECT id FROM t);
DELETE FROM payments WHERE dossier_id IN (SELECT id FROM td) OR client_id IN (SELECT id FROM t);
DELETE FROM assistance_subscriptions WHERE client_id IN (SELECT id FROM t);
DELETE FROM dossiers WHERE id IN (SELECT id FROM td) OR reserved_by IN (SELECT id FROM t);
DELETE FROM audit_log WHERE actor_user_id IN (SELECT id FROM t);
DELETE FROM otp_codes WHERE user_id IN (SELECT id FROM t);
DELETE FROM sessions WHERE user_id IN (SELECT id FROM t);
DELETE FROM users WHERE id IN (SELECT id FROM t);

-- The invoice tests allocate against synthetic years far outside any real one.
-- Left behind, those counters make the next run's random year start above 1.
DELETE FROM invoice_counters WHERE year > 3000;
COMMIT;
