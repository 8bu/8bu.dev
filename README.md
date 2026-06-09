# 8bu.dev

Personal portfolio — a TanStack Start web app backed by a SimSimi-style chat
service that answers from a curated `pairs` corpus via a lexical match cascade
(`exact → fts → trigram`) over SSE. LLM-free at query time. Extracted from the
cosimi monorepo; severed from `@cosimi/*`.

## Layout

```
apps/web/        @8budev/web — TanStack Start portfolio (chat UI + MDX artifacts + OG gen)
services/api/    @8budev/api — Hono chat backend (Node + Cloudflare Workers entries)
packages/
  core/          @8budev/core — chat DTOs + valibot env schema + normalize + SqlAccessor
  db/            @8budev/db   — postgres adapter (request-scoped sql + ALS), migrations, migrate CLI, seed
  logger/        @8budev/logger — pino + redactInput (lazy, Workers-safe)
  tsconfig/      @8budev/tsconfig
  oxlint-config/ @8budev/oxlint-config
seeds/portf/     curated portfolio Q&A (YAML) — 459 pairs
```

## Tech

Node 22 · pnpm 11 · Turbo 2 · TypeScript 5.7 · Hono · postgres.js · Postgres 16
(`pg_trgm` + `unaccent`, no pgvector) · valibot · pino · oxlint/oxfmt · vitest ·
Vite 7 · TanStack Start/Router · Tailwind v4 · Cloudflare Pages + Workers +
Hyperdrive + Neon.

## Develop

```bash
pnpm install
pnpm dev          # Docker guard → Postgres (:5434) → migrate → seed-if-empty → web (:5174) + api (:3010)
```

The web dev server proxies `/api/*` → `http://localhost:3010` (path-stripped),
mirroring the production Worker route `8bu.dev/api/*`.

## Gates

```bash
pnpm -r typecheck
pnpm lint
pnpm format:check
pnpm -r --workspace-concurrency=1 test   # DB tests race when parallel
```

## Architecture notes

- **Lexical cascade now; semantic later.** The matcher runs `exact → fts →
  trigram`; a `SemanticRetriever` port is mocked (`services/api/src/semantic/`)
  and will be backed by the published `@cosimi/sdk` `retrieve()` once available.
  The live corpus has no embeddings — the mock degrades to lexical.
- **Read-only.** No `/teach`, no sessions table, no votes. `POST /chat` (SSE) +
  `GET /healthz` only. Misses upsert `unanswered` for review.
- **Workers constraints.** No import-time `loadEnv()`; the logger is a lazy
  `Proxy`; every DB-touching path runs inside `runWithRequestDb` (request-scoped
  ALS client); the Hyperdrive binding is hoisted into `process.env.DATABASE_URL`
  at request time. `console.*` for anything that must surface in `wrangler tail`.

## Deploy

Manual, all-Cloudflare: `pnpm deploy` (interactive menu). Pages project `portf`
→ `8bu.dev`; Worker `portf-api` (route `8bu.dev/api/*`) → Hyperdrive `portf-hd`
→ Neon `portf`. Migrations are idempotent (tracked in `_migrations`).
