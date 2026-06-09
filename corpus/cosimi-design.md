---
title: Cosimi - a chatbot without an LLM
topic: portfolio/artifact/cosimi-design
---

This chat is powered by Cosimi. There's no LLM in the request path. Replies come from a curated pair store, scored by a three-tier matching engine that runs entirely against Postgres and a small TypeScript matcher. The corpus is hand-written. The voice is mine. The system either has an answer I wrote, or it tells you it does not.

## Why a chatbot without an LLM

The default move for a portfolio chat is to bolt a hosted LLM onto a "talk to me" surface. That solves the dialogue problem but creates a worse one - the replies are no longer mine, they're the model's prior over what a developer named Long might plausibly say, smoothed over with corporate-safe verbs. If a recruiter asks me something I haven't thought through, I'd rather the answer be silence than a confident hallucination in my voice. Pattern matching makes the failure mode legible: either there's a curated reply, or there isn't. There's a second reason - the corpus IS the writing. Drafting deflections, process notes, and identity statements as YAML seeds forced me to actually have positions on things.

## The matcher

Input flows through three tiers in order; the first to return a non-null result wins. Tier one is exact match - a normalized version of the input (NFC, lowercased, whitespace-collapsed) compared against an accent-stripped form of every stored pattern, returning in single-digit milliseconds. Tier two is Postgres full-text search - the input becomes a tsquery, run against a GIN-indexed tsvector column and ranked with ts_rank, clamped to a configurable threshold. Tier three is trigram similarity via pg_trgm, using the GIST-indexed % operator plus an explicit similarity filter so behavior stays stable across deploys. After ordering by tier, the matcher takes the top K and picks one at random, so the chat feels alive without lying about being alive. There's a fourth tier in practice: session-scoped teaches get first-look priority for ten minutes.

## The corpus discipline

The pair store is the system. Every curated reply lives in seeds/portf/*.yaml, one per topic - identity, stack, process, deflections, hiring. Each pattern has a normalized input and a response that reads like something I'd actually say: terse, technical, no marketing-speak. The seeds run through a CLI that flattens YAML into pairs table rows; every seed run creates one import_batches row, which is the unit of rollback.

## Trade-offs and implementation

The trade is depth-for-honesty: every reply is one I wrote. I'd rather be slow than fluent in someone else's voice. The build is a pnpm + Turbo monorepo - four apps, eight shared packages. apps/api is the public Hono REST + SSE server with no LLM in its dependency graph. packages/matcher is the three-tier engine, pure TypeScript over a postgres.js client. Streaming replies use SSE paced so the reply feels typed - the only part that pretends to be an LLM. The cost is real: long-tail inputs miss and the corpus needs maintenance, because the system pushes the work back onto me. For a portfolio chat that's the right trade.
