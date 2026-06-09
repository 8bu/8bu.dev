#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! docker info >/dev/null 2>&1; then
  echo "✗ Docker is not running. Start Docker and retry." >&2
  exit 1
fi

pnpm db:up
pnpm migrate

# Seed only when pairs is empty (idempotent dev convenience).
count=$(docker exec portf-postgres psql -U postgres -d portf -tAc "SELECT count(*) FROM pairs" 2>/dev/null || echo 0)
if [ "${count// /}" = "0" ]; then
  echo "seeding portf pairs…"
  pnpm seed
fi

turbo run dev --parallel
