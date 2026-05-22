#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy --schema=src/database/prisma/schema.prisma

echo "Starting server..."
exec node dist/main.js
