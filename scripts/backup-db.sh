#!/usr/bin/env bash
set -euo pipefail

TIMESTAMP=$(date -u +%Y%m%dT%H%M%SZ)
DUMP_FILE="/tmp/fiduvia-${TIMESTAMP}.sql.gz"

pg_dump "${DATABASE_URL}" | gzip > "${DUMP_FILE}"

aws s3 cp "${DUMP_FILE}" "s3://${BACKUP_S3_BUCKET}/db/${TIMESTAMP}.sql.gz" \
  --endpoint-url "${BACKUP_S3_ENDPOINT}"

rm "${DUMP_FILE}"
echo "Backed up to s3://${BACKUP_S3_BUCKET}/db/${TIMESTAMP}.sql.gz"
