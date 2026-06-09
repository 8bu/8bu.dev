<p align="center">
  <img src="apps/web/public/8bu-logo.svg" width="140" alt="8BU" />
</p>

<h1 align="center">8bu.dev</h1>

<p align="center">
  Personal portfolio with a chat that answers questions about me —
  <strong>deterministic GraphRAG, no LLM at query time</strong>.
</p>

---

A [TanStack Start](https://tanstack.com/start) web app plus a Hono chat backend.
Ask it something; it embeds the query, retrieves ranked Q&A pairs and document
chunks from a curated corpus, and streams the top answerable hit over SSE. No
generation, no hallucination — every reply traces to a source pair.

## Cosimi

Retrieval runs on **cosimi** — my GraphRAG SDK (`@cosimi/*`). The
chat embeds a query, walks pgvector-indexed pairs/chunks, and returns the
best-grounded match deterministically. `createCosimi({ sql, embedder }).retrieve()`
is the whole query path; a canonical override + seed-pair layer sit in front for
curated, on-topic answers. Ingest (LLM pair-generation, embedding, upsert) is an
offline operator step, never run at request time.

## Layout

```
apps/web/        TanStack Start portfolio — chat UI + MDX artifacts + OG gen
services/api/    Hono chat backend — Node (index.ts) + Workers (worker.ts) entries
services/admin-api/  ingest backend — pair-generation, embedding, upsert
packages/core/   chat DTOs, valibot env, normalize(), request-scoped sql
packages/db/     postgres adapter, migrations, migrate CLI, seed
packages/logger/ pino + redactInput, Workers-safe
corpus/*.md      long-form docs → documents/chunks/pairs
seeds/           curated Q&A pairs (YAML)
```

## Tech

Node 22 · pnpm 11 · Turbo 2 · TS 5.7 · Hono · postgres.js · Postgres 16 +
**pgvector** · valibot · pino · oxlint/oxfmt · vitest · Vite 7 · TanStack
Start/Router · Tailwind v4 · Cloudflare Pages + Workers + Hyperdrive + Neon.

## Develop

```bash
pnpm install
pnpm dev     # Docker → PG (:5434) → migrate → seed → web (:5174) + api (:3010)
```

The web dev server proxies `/api/*` → `localhost:3010`, mirroring the prod Worker
route `8bu.dev/api/*`.

## Gates

```bash
pnpm -r typecheck
pnpm lint
pnpm format:check
pnpm -r --workspace-concurrency=1 test   # DB tests race when parallel
```

See [`CLAUDE.md`](CLAUDE.md) for the full architecture, answer cascade, and
deploy flow.
