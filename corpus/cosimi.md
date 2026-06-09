---
title: Cosimi - a chatbot without an LLM
topic: portfolio/artifact/cosimi
---

This chat is powered by Cosimi, a GraphRAG engine I built. There's no LLM in the request path. Your question is embedded, a vector search seeds from the nearest chunks and pairs, the engine walks a graph for context, ranks, and returns - all deterministic, against Postgres with pgvector. The corpus it answers from is grounded on documents I wrote. The system either has an answer it built from my source, or it tells you it doesn't.

## Why a chatbot without a live LLM

The default move for a portfolio chat is to bolt a hosted LLM onto a "talk to me" surface. That solves the dialogue problem but creates a worse one - the replies are no longer mine, they're the model's prior over what a developer named Long might plausibly say, smoothed over with corporate-safe verbs. If a recruiter asks me something I haven't thought through, I'd rather the answer be silence than a confident hallucination in my voice. Keeping generation out of the live path makes the failure mode legible: either there's a grounded reply, or there isn't.

## The build-time pipeline

The LLM does almost all the labor, but offline, before anyone is watching. The ingest pipeline runs on my machine: it takes my source documents, chunks them into a graph, generates question-answer pairs with one Claude model, audits every pair with a second model, and embeds the survivors into Postgres with pgvector (bge-m3, 1024-dim, HNSW index). Chunks and pairs are model-generated, none hand-typed. Then it freezes. The model that wrote the answers never sees the question that retrieves them.

## Retrieval

At request time there is no model. The query is embedded; a vector search seeds from the nearest chunks and pairs by cosine similarity; the engine walks the chunk-relation graph for surrounding context; it ranks and returns the best answer. Same question, same data, same answer, every time, at zero per-reply token cost on the edge. A small hand-written canonical layer sits in front for the questions I want answered exactly - chip labels and common openers - and the long tail falls through to the retriever.

## Trade-offs and implementation

The trade is depth-for-honesty: every reply is grounded on source I wrote and gated by an audit, not improvised live. What I own isn't the generated corpus - it's the source it's grounded on, the audit gate, and the canonical layer. The build is a pnpm + Turbo monorepo. The public API is a Hono server running on a Cloudflare Worker at the edge, with no LLM in its dependency graph; the GraphRAG retrieval is a TypeScript SDK over a postgres.js client. Streaming replies are SSE paced so the reply feels typed - the only part that pretends to be live. The cost is real: long-tail inputs miss and the corpus needs maintenance. For a portfolio chat that speaks as me, that's the right trade.
