#!/usr/bin/env bash
set -euo pipefail

echo "==> Running Prisma deploy migrations"
pnpm --filter backend exec prisma migrate deploy

echo "==> Regenerating Prisma client"
pnpm --filter backend exec prisma generate

echo "==> Production migrations completed"
