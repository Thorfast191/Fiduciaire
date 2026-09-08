#!/usr/bin/env bash
#
# Nightly Postgres dump for Fiduvia.
#
# Writes a compressed custom-format dump (restorable selectively with
# pg_restore, unlike a plain SQL file) and prunes anything older than the
# retention window. Intended to run from cron on the host:
#
#   0 3 * * *  /root/fiduvia/scripts/backup-db.sh >> /var/log/fiduvia-backup.log 2>&1
#
# Client documents live in object storage and are not covered here — this is
# users, dossiers, questionnaire answers, payments and the audit log.

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/fiduvia}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_NAME="${DB_NAME:-fiduvia}"
DB_USER="${DB_USER:-fiduvia}"
DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"

stamp="$(date -u +%Y%m%dT%H%M%SZ)"
target="${BACKUP_DIR}/fiduvia-${stamp}.dump"

mkdir -p "$BACKUP_DIR"

# --format=custom is compressed and selectively restorable.
# Failure must be loud: a backup that silently produces nothing is worse than
# no backup at all, because it looks like one.
pg_dump \
  --host="$DB_HOST" \
  --port="$DB_PORT" \
  --username="$DB_USER" \
  --dbname="$DB_NAME" \
  --format=custom \
  --no-owner \
  --file="$target"

size=$(stat -c%s "$target" 2>/dev/null || stat -f%z "$target")
if [ "$size" -lt 1024 ]; then
  echo "$(date -u +%FT%TZ) FAILED: dump is only ${size} bytes" >&2
  rm -f "$target"
  exit 1
fi

chmod 600 "$target"
echo "$(date -u +%FT%TZ) ok: ${target} (${size} bytes)"

# Prune old dumps last, so a failure above never deletes a good backup.
find "$BACKUP_DIR" -name 'fiduvia-*.dump' -type f -mtime "+${RETENTION_DAYS}" -delete
echo "$(date -u +%FT%TZ) retained: $(find "$BACKUP_DIR" -name 'fiduvia-*.dump' | wc -l | tr -d ' ') dumps"
