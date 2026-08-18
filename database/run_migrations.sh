#!/usr/bin/env bash
# =============================================================================
# run_migrations.sh
# Executes all migrations in order against a target PostgreSQL database.
#
# Usage:
#   ./run_migrations.sh [--env <dev|staging|prod>]
#
# Requires the following environment variables (or a .env file):
#   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
# =============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/migrations"

# ---------------------------------------------------------------------------
# Load .env if present
# ---------------------------------------------------------------------------
if [[ -f "$SCRIPT_DIR/../.env" ]]; then
    export $(grep -v '^#' "$SCRIPT_DIR/../.env" | xargs)
fi

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-inventory_db}"
DB_USER="${DB_USER:-postgres}"
export PGPASSWORD="${DB_PASSWORD:-}"

echo "=== Inventory Management System — DB Migration Runner ==="
echo "Target: $DB_USER@$DB_HOST:$DB_PORT/$DB_NAME"
echo ""

# ---------------------------------------------------------------------------
# Enable pg_trgm extension (required for fuzzy product name search)
# ---------------------------------------------------------------------------
psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;" \
    -c "CREATE EXTENSION IF NOT EXISTS pgcrypto;"

# ---------------------------------------------------------------------------
# Run each migration file in numeric order
# ---------------------------------------------------------------------------
for migration in "$MIGRATIONS_DIR"/[0-9]*.sql; do
    filename=$(basename "$migration")
    echo "▶  Applying: $filename"
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --single-transaction \
        -f "$migration"
    echo "   ✓ Done"
done

echo ""
echo "✅  All migrations applied successfully."
