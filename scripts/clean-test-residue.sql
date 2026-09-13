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
-- The contact limiter counts these per IP over a rolling hour; the tests use
-- the 30.x.x.x range, which is not a real client's address.
DELETE FROM audit_log WHERE action = 'public_contact_sent' AND ip LIKE '30.%';
DELETE FROM invoice_counters WHERE year > 3000;
-- The band the super-admin guard test creates periods in.
DELETE FROM tax_periods WHERE year BETWEEN 2060 AND 2089;
COMMIT;
