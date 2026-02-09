#!/bin/sh
set -e

echo "=== Goals API Entrypoint ==="

# Default values
DB_HOST=${DB_HOST:-postgres}
DB_PORT=${DB_PORT:-5432}

# Wait for database to be ready
echo "Waiting for database at $DB_HOST:$DB_PORT..."
MAX_RETRIES=30
RETRY_COUNT=0

while ! nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "ERROR: Database not available after $MAX_RETRIES attempts"
    exit 1
  fi
  echo "Database not ready (attempt $RETRY_COUNT/$MAX_RETRIES), waiting..."
  sleep 2
done

echo "Database is ready!"

# Fix failed migration and run pending migrations
MIGRATION_NAME="20260205142830_add_habit_workspace_and_project_link"
MIGRATION_FILE="/app/packages/database/prisma/migrations/$MIGRATION_NAME/migration.sql"

cd /app/packages/database

echo "Checking migration status..."
MIGRATION_STATUS=$(npx prisma migrate status 2>&1 || true)

if echo "$MIGRATION_STATUS" | grep -q "failed"; then
  echo "Found failed migration: $MIGRATION_NAME"
  echo "Running migration SQL directly (idempotent)..."
  npx prisma db execute --file "$MIGRATION_FILE" --schema ./prisma/schema.prisma
  echo "Marking migration as applied..."
  npx prisma migrate resolve --applied "$MIGRATION_NAME"
  echo "Failed migration resolved!"
elif echo "$MIGRATION_STATUS" | grep -q "not yet been applied"; then
  echo "Found pending migration: $MIGRATION_NAME"
  echo "Running migration SQL directly (idempotent)..."
  npx prisma db execute --file "$MIGRATION_FILE" --schema ./prisma/schema.prisma
  echo "Marking migration as applied..."
  npx prisma migrate resolve --applied "$MIGRATION_NAME"
  echo "Pending migration applied!"
else
  echo "Migration $MIGRATION_NAME already applied, skipping."
fi

# Run any remaining migrations normally
echo "Running database migrations..."
npx prisma migrate deploy
echo "Migrations complete!"

# Return to app directory and start the application
cd /app
echo "Starting API server..."
exec "$@"
