import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import type { ChatStreamEvent } from "@8budev/core";

// Deterministic embedder: maps any text to a fixed unit vector so the seeded
// pair's vector is the nearest neighbor. embed() returns unitVec(0) for any text.
vi.mock("../src/lib/embedder", async () => {
  const { unitVec } = await import("./helpers");
  return {
    resolveEmbedder: () => ({
      dimension: 1024,
      embed: (texts: string[]) => Promise.resolve(texts.map(() => unitVec(0))),
    }),
    runWithAi: <T>(_ai: unknown, fn: () => T): T => fn(),
  };
});

const { sql, closeDb } = await import("@cosimi/adapter-postgres");
const { runChat } = await import("../src/services/chat-handler");
const { seedDocument, seedChunk, seedLinkedPair, resetCorpus, unitVec } = await import("./helpers");

async function collect(message: string): Promise<ChatStreamEvent[]> {
  const events: ChatStreamEvent[] = [];
  await runChat({
    sessionId: "00000000-0000-4000-8000-000000000000",
    message,
    locales: ["en", "und"],
    locale: "en",
    emit: async (e) => {
      events.push(e);
    },
  });
  return events;
}

beforeEach(async () => {
  await resetCorpus();
});
afterAll(async () => {
  await closeDb();
});

describe("runChat (GraphRAG)", () => {
  it("hit: session → metadata(tier '2', topic, pairId null) → token(s) = pair response", async () => {
    const docId = await seedDocument("wegopro", "portfolio/artifact/wegopro");
    const chunkId = await seedChunk(docId, 0, unitVec(0), "WegoPro is a B2B travel platform.");
    await seedLinkedPair(
      chunkId,
      "the b2b travel platform you built",
      "WegoPro — B2B corporate travel.",
      unitVec(0),
    );

    // A non-canonical query so it exercises the retrieve() path (not the override).
    const ev = await collect("the b2b travel platform you built");
    expect(ev[0]).toEqual({ type: "session", session_id: expect.any(String) });

    const meta = ev.find((e) => e.type === "metadata") as Extract<
      ChatStreamEvent,
      { type: "metadata" }
    >;
    expect(meta).toBeTruthy();
    expect(meta.tier).toBe("2");
    expect(meta.pairId).toBeNull();
    expect(meta.topic).toBe("portfolio/artifact/wegopro");
    expect(typeof meta.confidence).toBe("number");

    const text = ev
      .filter((e): e is Extract<ChatStreamEvent, { type: "token" }> => e.type === "token")
      .map((e) => e.content)
      .join("");
    expect(text).toBe("WegoPro — B2B corporate travel.");
  });

  it("hit on a non-artifact doc: metadata.topic is null", async () => {
    const docId = await seedDocument("stack", null);
    const chunkId = await seedChunk(docId, 0, unitVec(0), "TypeScript, Vue, React.");
    await seedLinkedPair(chunkId, "your stack", "Vue/Nuxt, React/Next, TypeScript.", unitVec(0));

    const ev = await collect("your stack");
    const meta = ev.find((e) => e.type === "metadata") as Extract<
      ChatStreamEvent,
      { type: "metadata" }
    >;
    expect(meta.topic).toBeNull();
  });

  it("canonical override: chip question answers deterministically (tier exact) before retrieve", async () => {
    // No corpus seeded — proves the canonical map answers without touching retrieve().
    const ev = await collect("What is WegoPro");
    const meta = ev.find((e) => e.type === "metadata") as Extract<
      ChatStreamEvent,
      { type: "metadata" }
    >;
    expect(meta.tier).toBe("exact");
    expect(meta.topic).toBe("portfolio/artifact/wegopro");
    const text = ev
      .filter((e): e is Extract<ChatStreamEvent, { type: "token" }> => e.type === "token")
      .map((e) => e.content)
      .join("");
    expect(text.toLowerCase()).toContain("wegopro");
    expect(ev.some((e) => e.type === "no_match")).toBe(false);
  });

  it("miss: empty corpus → session → no_match + unanswered upsert (source chat)", async () => {
    const ev = await collect("zzzqqq plover");
    expect(ev.some((e) => e.type === "no_match")).toBe(true);
    const row = await sql()<{ count: number; source: string }[]>`
      SELECT count, source FROM unanswered WHERE normalized_input = ${"zzzqqq plover"}`;
    expect(row[0]?.count).toBe(1);
    expect(row[0]?.source).toBe("chat");
  });
});

// cosine(v, unitVec(0)) === c. The mocked embedder returns unitVec(0) for every
// query, so a pair seeded with this vector lands at exactly similarity c.
function vecAtCosine(c: number, dim = 1024): number[] {
  const v = Array.from({ length: dim }, () => 0);
  v[0] = c;
  v[1] = Math.sqrt(1 - c * c);
  return v;
}

describe("runChat confidence floor", () => {
  it("deflects (no_match) when the best answerable hit is below the floor", async () => {
    const docId = await seedDocument("kb", "portfolio/artifact/longnguyen-2026");
    const chunkId = await seedChunk(docId, 0, vecAtCosine(0.48), "weakish chunk");
    await seedLinkedPair(chunkId, "obscure q", "weakish answer", vecAtCosine(0.48));

    const ev = await collect("some unanswered question");
    expect(ev.some((e) => e.type === "no_match")).toBe(true);
    expect(ev.some((e) => e.type === "token")).toBe(false);
  });

  it("does NOT deflect a confident hit above the floor", async () => {
    const docId = await seedDocument("kb", "portfolio/artifact/longnguyen-2026");
    const chunkId = await seedChunk(docId, 0, vecAtCosine(0.7), "good chunk");
    await seedLinkedPair(chunkId, "good q", "good answer", vecAtCosine(0.7));

    const ev = await collect("a good question");
    expect(ev.some((e) => e.type === "no_match")).toBe(false);
    expect(ev.some((e) => e.type === "token")).toBe(true);
  });
});
