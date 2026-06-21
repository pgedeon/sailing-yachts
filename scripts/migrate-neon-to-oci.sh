#!/bin/bash
# Migrate data from Neon PostgreSQL to OCI local PostgreSQL
# Run this when Neon quota resets (July 1) or after temporary upgrade
#
# Usage: bash migrate-neon-to-oci.sh
#
# Prerequisites:
# - Neon must be accessible (quota not exhausted)
# - OCI PostgreSQL must be running on localhost:5432

set -euo pipefail

NEON_HOST="ep-dry-wildflower-agwrkfeu-pooler.c-2.eu-central-1.aws.neon.tech"
NEON_DB="neondb"
NEON_USER="neondb_owner"
NEON_PASS="npg_3azLQtYjN0WM"

OCI_HOST="127.0.0.1"
OCI_DB="neondb"
OCI_USER="neondb_owner"
OCI_PASS="sailboats2026"

echo "=== Neon → OCI PostgreSQL Migration ==="
echo ""

# Step 1: Dump from Neon
echo "[1/4] Dumping from Neon..."
PGPASSWORD="$NEON_PASS" pg_dump \
  --no-owner --no-privileges --schema=public --data-only --format=custom \
  "host=$NEON_HOST port=5432 dbname=$NEON_DB user=$NEON_USER sslmode=require" \
  -f /tmp/neon-data.dump
echo "  Dump size: $(du -h /tmp/neon-data.dump | cut -f1)"

# Step 2: Backup current OCI data (just in case)
echo "[2/4] Backing up current OCI data..."
PGPASSWORD="$OCI_PASS" pg_dump \
  --no-owner --no-privileges --schema=public --data-only --format=custom \
  "host=$OCI_HOST port=5432 dbname=$OCI_DB user=$OCI_USER sslmode=disable" \
  -f /tmp/oci-backup-$(date +%Y%m%d).dump
echo "  Backup saved"

# Step 3: Truncate and restore
echo "[3/4] Restoring Neon data to OCI..."
# Disable triggers, truncate all tables, then restore
PGPASSWORD="$OCI_PASS" psql \
  "host=$OCI_HOST port=5432 dbname=$OCI_DB user=$OCI_USER sslmode=disable" \
  -c "SET session_replication_role = replica; TRUNCATE CASCADE;" \
  $(PGPASSWORD="$OCI_PASS" psql "host=$OCI_HOST port=5432 dbname=$OCI_DB user=$OCI_USER sslmode=disable" -t -c "SELECT string_agg tablename, ' ') FROM pg_tables WHERE schemaname='public'")

PGPASSWORD="$OCI_PASS" pg_restore \
  --data-only --no-owner --no-privileges \
  "host=$OCI_HOST port=5432 dbname=$OCI_DB user=$OCI_USER sslmode=disable" \
  /tmp/neon-data.dump || true

# Step 4: Verify
echo "[4/4] Verifying data..."
TABLES=$(PGPASSWORD="$OCI_PASS" psql "host=$OCI_HOST port=5432 dbname=$OCI_DB user=$OCI_USER sslmode=disable" -t -c "SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename")
for table in $TABLES; do
  count=$(PGPASSWORD="$OCI_PASS" psql "host=$OCI_HOST port=5432 dbname=$OCI_DB user=$OCI_USER sslmode=disable" -t -c "SELECT count(*) FROM $table")
  echo "  $table: $count rows"
done

echo ""
echo "=== Migration complete ==="
echo "Don't forget to:"
echo "  1. Restart sailboats-api: sudo systemctl restart sailboats-api"
echo "  2. Redeploy Vercel app to clear ISR cache"
