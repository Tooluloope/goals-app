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

# Run migrations
echo "Running database migrations..."
cd /app/packages/database
npx prisma migrate deploy
echo "Migrations complete!"

# Return to app directory and start the application
cd /app
echo "Starting API server..."
exec "$@"
