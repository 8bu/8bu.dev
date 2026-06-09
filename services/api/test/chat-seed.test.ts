import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from "vitest";
import type { ChatStreamEvent } from "@8budev/core";

// Deterministic embedder: message text → unit vector by a lookup table so we
// control which seed pair is nearest. Default → unitVec(0).
// Use a phrase NOT in canonical.ts so the seed step (not canonical) handles it.
const VEC_BY_TEXT: Record<string, number> = { "which city are you based in": 5, far: 99 };
vi.mock("../src/lib/embedder", async () => {
  const { unitVec } = await import("./helpers");
  return {
    resolveEmbedder: () => ({
      dimension: 1024,
      embed: (texts: string[]) => Promise.resolve(texts.map((t) => unitVec(VEC_BY_TEXT[t] ?? 0))),
    }),
    runWithAi: <T>(_ai: unknown, fn: () => T): T => fn(),
  };
});

const { sql, closeDb } = await import("@cosimi/adapter-postgres");
const { runChat } = await import("../src/services/chat-handler");
const { resetCorpus, unitVec, seedSeedPair } = await import("./helpers");

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
function text(events: ChatStreamEvent[]): string {
  return events
    .filter((e) => e.type === "token")
    .map((e) => (e as { content: string }).content)
    .join("");
}

describe("runChat seed step", () => {
  beforeEach(async () => {
    await resetCorpus();
  });
  afterEach(async () => {
    await resetCorpus();
  });
  afterAll(async () => {
    await closeDb();
  });

  it("AC5: answers from the nearest seed pair + emits its topic", async () => {
    await seedSeedPair(
      "which city are you based in",
      "Ho Chi Minh City, GMT+7.",
      unitVec(5),
      "portfolio/artifact/longnguyen-2026",
    );
    const events = await collect("which city are you based in");
    expect(text(events)).toContain("Ho Chi Minh City");
    const meta = events.find((e) => e.type === "metadata") as { topic: string | null } | undefined;
    expect(meta?.topic).toBe("portfolio/artifact/longnguyen-2026");
  });

  it("AC6: a far seed pair does not answer (below SEED_MIN) → no_match", async () => {
    await seedSeedPair("where do you live", "HCMC.", unitVec(5));
    const events = await collect("far"); // unitVec(99), orthogonal → similarity 0
    expect(events.some((e) => e.type === "no_match")).toBe(true);
  });
});
