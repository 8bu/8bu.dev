import { normalize, loadEnv, type Env } from "@8budev/core";
import { sql } from "@cosimi/adapter-postgres";
import { createCosimi } from "@cosimi/sdk";
import type { PairHit, ChunkHit } from "@cosimi/sdk";

import { canonicalAnswer } from "../canonical";
import { resolveEmbedder } from "../lib/embedder";
import type { Emitter } from "../lib/sse";
import { tokenize, jitterMs, sleep } from "../lib/tokenizer";

export interface RunChatArgs {
  sessionId: string;
  message: string;
  emit: Emitter;
  locales?: string[];
  locale?: string;
}

// Hits already cleared RETRIEVE_MIN_SIMILARITY (0.45). Flag the weaker tail so
// the web can soften the badge. Module const (not env) — tune here if needed.
const LOW_CONFIDENCE_BELOW = 0.55;

type Hit = PairHit | ChunkHit;

/**
 * One /chat turn over an SSE emitter (read-only portf). Deterministic GraphRAG:
 * embed the query, retrieve ranked pairs+chunks, stream the top answerable hit's
 * response. No LLM at query time. metadata.topic is derived from the hit's source
 * document (documents.topic); pairId is always null (retrieve() exposes no id).
 */
export async function runChat(args: RunChatArgs): Promise<void> {
  const env = loadEnv();
  await args.emit({ type: "session", session_id: args.sessionId });

  // Canonical override: chip labels + common questions get deterministic, on-topic
  // answers BEFORE the GraphRAG retriever (whose ranking over short personal facts
  // is noisy). The long tail falls through to retrieve().
  const canon = canonicalAnswer(args.message);
  if (canon) {
    const exposeC = env.EXPOSE_MATCH_INSIGHTS;
    await args.emit({
      type: "metadata",
      tier: exposeC ? "exact" : null,
      confidence: exposeC ? 1 : null,
      pairId: null,
      score: exposeC ? 1 : null,
      lowConfidence: false,
      locale: exposeC ? (args.locale ?? null) : null,
      topic: exposeC ? (canon.topic ?? null) : null,
    });
    await streamTokens(canon.response, args.emit, env);
    return;
  }

  const locales = args.locales && args.locales.length > 0 ? args.locales : undefined;
  const cosimi = createCosimi({ sql, embedder: resolveEmbedder() });
  const { hits } = await cosimi.retrieve(args.message, { locales });

  const top = firstAnswerable(hits);
  if (!top) {
    const normalized = normalize(args.message);
    await sql()`
      INSERT INTO unanswered (input, normalized_input, source, count, last_seen)
      VALUES (${args.message}, ${normalized}, 'chat', 1, NOW())
      ON CONFLICT (normalized_input) DO UPDATE SET
        count     = unanswered.count + 1,
        last_seen = NOW()
    `;
    await args.emit({ type: "no_match" });
    return;
  }

  const topic = await deriveTopic(top);
  const expose = env.EXPOSE_MATCH_INSIGHTS;
  await args.emit({
    type: "metadata",
    tier: expose ? "2" : null,
    confidence: expose ? top.similarity : null,
    pairId: null,
    score: expose ? top.similarity : null,
    lowConfidence: top.similarity < LOW_CONFIDENCE_BELOW,
    locale: expose ? (args.locale ?? null) : null,
    topic: expose ? topic : null,
  });
  await streamTokens(answerOf(top), args.emit, env);
}

/** First hit that yields an answer string: any PairHit, or a ChunkHit with ≥1 linked pair. */
function firstAnswerable(hits: Hit[]): Hit | undefined {
  return hits.find((h) => h.kind === "pair" || h.pairs.length > 0);
}

/** Answer text: a PairHit's response, or a ChunkHit's nearest linked pair response. */
function answerOf(hit: Hit): string {
  return hit.kind === "pair" ? hit.response : hit.pairs[0]!.response;
}

/**
 * Resolve the artifact topic from the hit's source document.
 *   - PairHit: its source chunk rides in `context` at hops:0 (carries documentId).
 *   - ChunkHit: the chunk's own documentId.
 * Then look up documents.topic. Returns null when no source doc / no topic.
 */
async function deriveTopic(hit: Hit): Promise<string | null> {
  const documentId =
    hit.kind === "pair" ? hit.context.find((c) => c.hops === 0)?.documentId : hit.chunk.documentId;
  if (!documentId) return null;
  const [row] = await sql()<{ topic: string | null }[]>`
    SELECT topic FROM documents WHERE id = ${documentId}
  `;
  return row?.topic ?? null;
}

async function streamTokens(text: string, emit: Emitter, env: Env): Promise<void> {
  for (const tok of tokenize(text, env.SSE_DELAY_MODE)) {
    const delay = jitterMs(env.SSE_DELAY_BASE_MS, env.SSE_DELAY_JITTER_MS);
    if (delay > 0) await sleep(delay);
    await emit({ type: "token", content: tok });
  }
}
