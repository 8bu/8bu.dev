import { describe, it, expect, beforeEach, afterEach, afterAll } from "vitest";

// Regression guard for the seed-pairs CRITICAL: a document-less seed pair
// (source='seed', audit_status='seed', embedding set, NO chunk_pair_map row)
// must NOT enter the SDK retriever's pair path. The published @cosimi/retriever
// builds pair details with an INNER JOIN chunk_pair_map; a chunk-less pair that
// reached it would crash on undefined. We isolate seed pairs with
// audit_status='seed' (pair_near filters audit_status='pass'). This test proves
// retrieve() neither throws nor returns the seed pair even when that pair is the
// nearest by embedding.

const { sql, closeDb } = await import("@cosimi/adapter-postgres");
const { createCosimi } = await import("@cosimi/sdk");
const { resetCorpus, unitVec, seedSeedPair } = await import("./helpers");

// Inline fake embedder: the query embeds to the SAME vector as the seed pair,
// so the seed pair is the nearest neighbour — the exact condition that would
// trip the INNER JOIN crash if it weren't isolated.
const embedder = {
  dimension: 1024,
  embed: (texts: string[]) => Promise.resolve(texts.map(() => unitVec(7))),
};

describe("seed-pair isolation from the SDK retriever", () => {
  beforeEach(async () => {
    await resetCorpus();
  });
  // Clean up after ourselves too — other test files share this DB and a leftover
  // seed pair would inflate stats.test's embedded-active-pairs count.
  afterEach(async () => {
    await resetCorpus();
  });
  afterAll(async () => {
    await closeDb();
  });

  it("retrieve() does not throw and does not return a chunk-less seed pair", async () => {
    await seedSeedPair("isolated seed question", "ISOLATED SEED ANSWER", unitVec(7));

    const cosimi = createCosimi({ sql, embedder });
    const result = await cosimi.retrieve("anything", { locales: ["en", "und"] });

    // No throw (await resolved) + the seed pair is absent from the hits.
    const answers = result.hits.map((h) => (h.kind === "pair" ? h.response : ""));
    expect(answers).not.toContain("ISOLATED SEED ANSWER");
  });
});
