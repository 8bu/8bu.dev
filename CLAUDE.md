# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Personal portfolio at **8bu.dev**: a TanStack Start web app + a chat backend that
answers questions about the owner from a curated corpus. Chat is **deterministic
GraphRAG** — embed the query, retrieve ranked pairs/chunks via the `@cosimi/sdk`
retriever, stream the top answerable hit. **No LLM at query time.**

> ⚠️ `README.md` describes an older "lexical cascade (`exact → fts → trigram`),
> no pgvector, semantic-later" design. That is **stale**. The live system uses
> `@cosimi/*` embeddings + pgvector. Trust this file and the code over the README
> on architecture.

## Monorepo layout

```
apps/web/          @8budev/web   — TanStack Start portfolio: chat UI + MDX artifacts + OG gen
apps/neolab/       internal Ingest/admin UI (talks to admin-api)
services/api/      @8budev/api   — Hono chat backend; Node entry (index.ts) + Workers entry (worker.ts)
services/admin-api/              — ingest backend (LLM pair-generation, embedding, upsert); loopback :3001
packages/core/     @8budev/core  — chat DTOs, valibot env schema, normalize(), request-scoped sql accessor
packages/db/       @8budev/db    — postgres adapter, migrations + idempotent migrate CLI, seed
packages/logger/   @8budev/logger— pino + redactInput, lazy/Workers-safe
corpus/*.md        long-form source docs → ingested into documents/chunks/pairs
seeds/interview.yaml             — document-less curated Q&A (source='seed')
```

Tech: Node 22 · pnpm 11 · Turbo 2 · TS 5.7 · Hono · postgres.js · Postgres 16 +
**pgvector** · valibot · pino · oxlint/oxfmt · vitest · Vite 7 · TanStack
Start/Router · Tailwind v4 · Cloudflare Pages + Workers + Hyperdrive → VPS Postgres
(prod DB self-hosted via cloudflared tunnel; migrated off Neon 2026-07-11).

## Commands

```bash
pnpm dev          # Docker guard → PG (:5434) → migrate → seed-if-empty → web (:5174) + api (:3010)
pnpm build        # turbo build (web prebuild runs OG generation)

# Gates (run all before claiming done):
pnpm -r typecheck
pnpm lint                                  # oxlint
pnpm format:check                          # oxfmt
pnpm -r --workspace-concurrency=1 test     # DB tests RACE when parallel — keep concurrency 1

# Single workspace / single test:
pnpm --filter @8budev/api test
pnpm --filter @8budev/web exec vitest run src/store/__tests__/chat.test.ts
pnpm --filter @8budev/api exec vitest run -t "deflect"   # by name

# DB:
pnpm migrate            # apply migrations (idempotent, tracked in _migrations)
pnpm seed               # seed seeds/interview.yaml into local PG
pnpm db:reset           # nuke volume + re-up
```

The web dev server proxies `/api/*` → `localhost:3010` (path-stripped), mirroring
the prod Worker route `8bu.dev/api/*`.

## Chat answer cascade (services/api/src/services/chat-handler.ts)

`runChat` tries layers in order, returning on first hit. **There is no canonical
layer** (`canonical.ts` was removed — chip labels / common questions are now seed
pairs matched semantically, not exact-key lookups):

1. **Tier-0 deflect guard** (`deflect.ts`, `deflectInput`) — deterministic screen
   run BEFORE any embedding. Catches slurs/insults (whole-token match after
   leet/repeat normalization) and sensitive-topic questions (sexuality, religion,
   politics, substances, crude — phrase/framed regex). Precedence: hate slur >
   insult > sensitive scope. **Sensitive topics live ONLY here, never as seed
   pairs** — a seed pair below `SEED_MIN` would fall through to retrieve() and
   could leak a personal fact. Emits a fixed deflection, tier `exact`.
2. **Seed pairs** (`seedAnswer`) — document-less `source='seed'` pairs, matched by
   **own embedding cosine** (the SDK retriever can't serve chunk-less pairs). Hit
   at/above `SEED_MIN = 0.70` answers; reads `pairs.topic` directly for the
   deep-link and `pairs.image_slug`/`pairs.mood` for media. Tier id `2` (same class
   as retrieve()).
3. **SDK retrieve()** — `createCosimi({ sql, embedder }).retrieve()`. First
   answerable hit ≥ `DEFLECT_BELOW = 0.55` answers; topic derived from the hit's
   source `documents.topic`. No per-pair media (FE may still map a content image by
   topic). Tier id `2`.
4. **No match** — upsert `unanswered`, emit `no_match` (FE streams a deflection).

`LOW_CONFIDENCE_BELOW = 0.55` flags a weak hit so the FE softens its badge. These
three thresholds are **module consts** — tune in `chat-handler.ts`, not env.
`EXPOSE_MATCH_INSIGHTS` (env, default true) gates whether tier/confidence/score/
topic/locale leak to the client; **media (`imageSlug`/`mood`) is never gated** —
it's content. Note: a non-null `tier` is required or the FE suppresses the artifact
deep-link (`features/artifacts/match.ts`).

Seed pair media: `seeds/interview.yaml` entries carry `image:`/`mood:` keys
(mapped to the `image_slug`/`mood` columns on upsert); `mood` resolves to a
self-hosted reaction mp4, `image` to `/media/img/<slug>.webp`.

## Embedder

`resolveEmbedder()` (`services/api/src/lib/embedder.ts`) picks by `EMBEDDER` env:
- `ollama` (default) — Node dev/test/SDK dimension guard; needs ollama running.
- `workers-ai` (prod) — request-scoped binding carried via AsyncLocalStorage
  (`runWithAi`), mirroring the request-scoped sql client. Throws loudly if the
  binding is absent. Dimension must match `EMBEDDING_DIM` and the `pairs.embedding`
  / chunk vectors in the DB.

## Cloudflare Workers constraints (worker.ts)

- **No import-time `loadEnv()`** — it would throw at deploy-time global validation
  (no `DATABASE_URL`/bindings yet). All DB/embed work runs at request time.
- `hoistEnv(env)` bridges bindings into `process.env` before lazy `loadEnv()` runs:
  Hyperdrive `connectionString` → `DATABASE_URL`; all string bindings forwarded
  verbatim; non-string bindings (Hyperdrive object, `AI`) skipped.
- Every request wraps in `runWithRequestDb` (workerd forbids cross-request socket
  reuse) and, when `env.AI` is present, `runWithAi`. Both ALS scopes ride along to
  Hono's deferred SSE generator.
- The logger is a lazy `Proxy`; use `console.*` for anything that must surface in
  `wrangler tail`.

## Content pipeline (offline operator tools, never run at request time)

- **Corpus ingest:** `pnpm exec tsx --env-file=.env scripts/ingest-corpus.ts [doc]`
  POSTs `corpus/*.md` to admin-api (loopback `:3001`), which generates pairs (LLM),
  embeds, and upserts `documents`/`chunks`/`pairs` server-side. Pure HTTP — works
  against any DB admin-api points at (local or prod Neon). Needs admin-api up +
  `ANTHROPIC_API_KEY` (rides `X-Anthropic-Key`, never persisted) + ollama. Some
  corpus files are intentionally **excluded** from the vector corpus (their chatty
  generated pairs hijack factual queries) — see the script header.
- **Seed pairs:** `scripts/seed-pairs.ts` POSTs `seeds/interview.yaml` to
  `POST /pairs/seed`, which embeds + full-replaces all `source='seed'` pairs. No
  LLM key needed.
- **Reaction GIFs:** `scripts/fetch-media.ts` + `scripts/media-manifest.ts` query
  Tenor at build time, convert to muted-autoplay mp4 (h264/yuv420p/240px), and
  self-host under `apps/web/public/media/gif/<mood>/`. Needs `ffmpeg` + `curl`.
  Runtime makes no third-party calls.

## Deploy

Manual, all-Cloudflare: `pnpm deploy` (interactive menu in `deploy.sh`). Pages
project `portf` → `8bu.dev`; Worker `portf-api` (route `8bu.dev/api/*`) → Hyperdrive
`portf-hd-vps` (`41297ec8…`) → Access app `db` (`db.8bu.dev`) → cloudflared tunnel
`portal-db` → **VPS Postgres** (`ssh 71z`, bare-metal PG16, db `portf`, role
`portf_app`). The DB moved off Neon 2026-07-11; the old Neon Hyperdrive
`portf-hd` (`7994710a…`) is kept intact as rollback (swap the id in
`services/api/wrangler.toml` + redeploy). **Migrate the VPS DB before deploying
the Worker** when a release adds migrations — the DB is localhost-only, so reach
it over an SSH tunnel (`ssh -L 5433:localhost:5432 71z`) and point the migrate CLI
at `postgresql://portf_app:…@localhost:5433/portf`.
