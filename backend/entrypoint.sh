#!/bin/sh
set -e

echo "🌱 Running database seed..."
npx prisma db seed --schema=src/database/prisma/schema.prisma || echo "⚠️  Seed failed or already up to date, continuing..."

echo "🚀 Starting server..."
exec node dist/main.js
