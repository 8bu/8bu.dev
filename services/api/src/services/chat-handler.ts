import { normalize, loadEnv, type Env } from "@8budev/core";
import { sql } from "@cosimi/adapter-postgres";
import { createCosimi } from "@cosimi/sdk";
import type { PairHit, ChunkHit } from "@cosimi/sdk";

import { canonicalAnswer } from "../canonical";
import { deflectInput } from "../deflect";
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

// Below this similarity, even an "answerable" hit is too weak to trust — route to
// the no_match deflection path (logs unanswered + FE streams a deflection) instead
// of surfacing a wrong nearest pair. The high-value interview openers + deflections
// answer via canonical (above), so they never reach this gate; it governs only the
// genuinely-unknown long tail. Tuned against post-interview-ingest similarities.
const DEFLECT_BELOW = 0.55;

// Seed pairs (document-less, source='seed') are retrieved by their own embedding
// in an app-level step BEFORE the SDK retriever (which can't serve chunk-less
// pairs). A hit at/above this cosine answers directly; below it we fall through
// to retrieve(). Tuned at 0.70 against the ~220-pair interview corpus: real
// paraphrases land ≥0.75, while off-topic noise (e.g. "do you like pizza") sits
// ≤0.66 — a higher floor than DEFLECT_BELOW because the dense pair pool makes
// spurious near-neighbors more likely.
const SEED_MIN = 0.7;

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

  // Tier-0 lexical guard: slurs / profanity / insults are screened BEFORE the
  // embedding pipeline. Vector search has no notion of "don't answer this" — a
  // hostile token would otherwise embed near some personal pair and hijack its
  // answer. Whole-token match, so clean words never trip it.
  const deflection = deflectInput(args.message);
  if (deflection) {
    const exposeD = env.EXPOSE_MATCH_INSIGHTS;
    await args.emit({
      type: "metadata",
      tier: exposeD ? "exact" : null,
      confidence: exposeD ? 1 : null,
      pairId: null,
      score: exposeD ? 1 : null,
      lowConfidence: false,
      locale: exposeD ? (args.locale ?? null) : null,
      topic: null,
      imageSlug: null,
      mood: null,
    });
    await streamTokens(deflection.response, args.emit, env);
    return;
  }

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
      // Media is user-facing content, not a match-internals tell — never gated.
      imageSlug: canon.image ?? null,
      mood: canon.mood ?? null,
    });
    await streamTokens(canon.response, args.emit, env);
    return;
  }

  // Seed override: document-less curated pairs (source='seed'), retrieved by
  // their own embedding before the SDK retriever (which can't serve chunk-less
  // pairs). Topic rides on the pair row for the deep-link.
  const seed = await seedAnswer(args.message);
  if (seed) {
    const exposeS = env.EXPOSE_MATCH_INSIGHTS;
    await args.emit({
      type: "metadata",
      // Seed retrieval is a vector/embedding match — same class as retrieve() —
      // so it reuses the semantic tier id "2" rather than growing the legacy
      // MatchTier union. tier must stay non-null or the FE suppresses the
      // artifact deep-link (features/artifacts/match.ts: tier === null → null).
      tier: exposeS ? "2" : null,
      confidence: exposeS ? seed.similarity : null,
      pairId: null,
      score: exposeS ? seed.similarity : null,
      lowConfidence: seed.similarity < LOW_CONFIDENCE_BELOW,
      locale: exposeS ? (args.locale ?? null) : null,
      topic: exposeS ? (seed.topic ?? null) : null,
      imageSlug: seed.image_slug,
      mood: seed.mood,
    });
    await streamTokens(seed.response, args.emit, env);
    return;
  }

  const locales = args.locales && args.locales.length > 0 ? args.locales : undefined;
  const cosimi = createCosimi({ sql, embedder: resolveEmbedder() });
  const { hits } = await cosimi.retrieve(args.message, { locales });

  const candidate = firstAnswerable(hits);
  const answerable = candidate && candidate.similarity >= DEFLECT_BELOW ? candidate : undefined;
  if (!answerable) {
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

  const topic = await deriveTopic(answerable);
  const expose = env.EXPOSE_MATCH_INSIGHTS;
  await args.emit({
    type: "metadata",
    tier: expose ? "2" : null,
    confidence: expose ? answerable.similarity : null,
    pairId: null,
    score: expose ? answerable.similarity : null,
    lowConfidence: answerable.similarity < LOW_CONFIDENCE_BELOW,
    locale: expose ? (args.locale ?? null) : null,
    topic: expose ? topic : null,
    // Long tail has no per-pair media; FE may still map a content image by topic.
    imageSlug: null,
    mood: null,
  });
  await streamTokens(answerOf(answerable), args.emit, env);
}

interface SeedHit {
  response: string;
  topic: string | null;
  similarity: number;
  image_slug: string | null;
  mood: string | null;
}

/**
 * Nearest document-less seed pair by cosine. Reads pairs.topic directly (the SDK
 * retriever can't, since a seed pair has no source document). Returns undefined
 * when the store has no seed pair clearing SEED_MIN.
 */
async function seedAnswer(message: string): Promise<SeedHit | undefined> {
  const [embedding] = await resolveEmbedder().embed([message]);
  if (!embedding) return undefined;
  const lit = `[${embedding.join(",")}]`;
  const [row] = await sql()<SeedHit[]>`
    SELECT response, topic, image_slug, mood,
           1 - (embedding <=> ${lit}::vector) AS similarity
      FROM pairs
     WHERE source = 'seed' AND deleted_at IS NULL AND embedding IS NOT NULL
     ORDER BY embedding <=> ${lit}::vector ASC
     LIMIT 1
  `;
  if (!row || row.similarity < SEED_MIN) return undefined;
  return row;
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
