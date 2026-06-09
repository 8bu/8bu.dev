import { afterEach, expect, it, vi } from "vitest";
import type { EmbeddingPort } from "@cosimi/core";
import { resetCorpus, seedChunk, seedDocument, seedLinkedPair, unitVec } from "./helpers";

vi.mock("../src/lib/embedder", () => ({
  resolveEmbedder: (): EmbeddingPort => ({
    dimension: 1024,
    embed: (t: string[]) => Promise.resolve(t.map(() => unitVec(0))),
  }),
  runWithAi: <T>(_ai: unknown, fn: () => T): T => fn(),
}));

const { app } = await import("../src/app");

afterEach(async () => {
  await resetCorpus();
});

async function post(body: unknown): Promise<Response> {
  return app.fetch(
    new Request("http://localhost/retrieve", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

it("returns ranked hits for an in-corpus query", async () => {
  const doc = await seedDocument("stack");
  const chunk = await seedChunk(doc, 0, unitVec(0), "TypeScript Vue React");
  await seedLinkedPair(chunk, "your stack", "Vue, React, TypeScript.", unitVec(0));

  const res = await post({ query: "your stack" });
  expect(res.status).toBe(200);
  const body = (await res.json()) as { hits: { kind: string; response?: string }[] };
  expect(body.hits.length).toBeGreaterThan(0);
});

it("400s on an invalid body", async () => {
  const res = await post({ nope: 1 });
  expect(res.status).toBe(400);
});

it("logs unanswered(source=retrieve) on an empty result", async () => {
  const { sql } = await import("@cosimi/adapter-postgres");
  // Empty corpus (afterEach reset) + a high floor → zero hits → unanswered upsert.
  const res = await post({ query: "zzzqqq no match plover", minSimilarity: 0.99 });
  expect(res.status).toBe(200);
  const rows = await sql()<{ source: string }[]>`
    SELECT source FROM unanswered WHERE normalized_input = ${"zzzqqq no match plover"}`;
  expect(rows[0]?.source).toBe("retrieve");
});
