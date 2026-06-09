import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

// Deterministic embedder: every input → distinct unit vector by index, so we can
// assert embeddings are stored without ollama running.
const spies = vi.hoisted(() => ({ createSeedEmbedder: vi.fn() }));
vi.mock("../src/lib/seed-embedder", () => ({ createSeedEmbedder: spies.createSeedEmbedder }));

const { closeDb, sql } = await import("@cosimi/adapter-postgres");
const { app } = await import("../src/app");
const { postJson, resetDb } = await import("./helpers");

function unitVec(idx: number, dim = 1024): number[] {
  const v = Array.from({ length: dim }, () => 0);
  v[idx % dim] = 1;
  return v;
}
function fakeEmbedder(fail = false) {
  return {
    dimension: 1024,
    embed: (texts: string[]) =>
      fail
        ? Promise.reject(new Error("embed boom"))
        : Promise.resolve(texts.map((_, i) => unitVec(i))),
  };
}

describe("POST /pairs/seed", () => {
  beforeEach(async () => {
    await resetDb();
    spies.createSeedEmbedder.mockReset();
    spies.createSeedEmbedder.mockImplementation(() => fakeEmbedder());
  });
  afterAll(async () => {
    await closeDb();
  });

  it("AC1: inserts seed pairs with source/audit/embedding/topic", async () => {
    const res = await postJson(app, "/pairs/seed", {
      pairs: [
        {
          input: "where do you live",
          response: "Ho Chi Minh City.",
          topic: "portfolio/artifact/longnguyen-2026",
        },
        { input: "are you available", response: "From ~July 2026." },
      ],
    });
    expect(res.status).toBe(201);
    const body = (await res.json()) as { batchId: number; inserted: number; replaced: number };
    expect(body.inserted).toBe(2);

    const rows = await sql()<
      {
        source: string;
        audit_status: string;
        topic: string | null;
        has_emb: boolean;
        source_chunk: string | null;
      }[]
    >`
      SELECT source, audit_status, topic, (embedding IS NOT NULL) AS has_emb, source_chunk
      FROM pairs WHERE deleted_at IS NULL ORDER BY id ASC
    `;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      source: "seed",
      audit_status: "seed",
      has_emb: true,
      source_chunk: null,
    });
    expect(rows[0]!.topic).toBe("portfolio/artifact/longnguyen-2026");
  });

  it("AC2: full-replace soft-deletes prior seed pairs, leaves non-seed intact", async () => {
    await postJson(app, "/pairs/seed", { pairs: [{ input: "old q", response: "old a" }] });
    // a non-seed pair must survive
    await sql()`INSERT INTO pairs (input, normalized_input, response, source) VALUES ('keep', 'keep', 'kept', 'user')`;

    await postJson(app, "/pairs/seed", { pairs: [{ input: "new q", response: "new a" }] });

    const live = await sql()<{ input: string; source: string }[]>`
      SELECT input, source FROM pairs WHERE deleted_at IS NULL ORDER BY id ASC
    `;
    expect(live.map((r) => r.input).sort()).toEqual(["keep", "new q"]);
    const deadSeed = await sql()<{ n: number }[]>`
      SELECT COUNT(*)::int AS n FROM pairs WHERE source = 'seed' AND deleted_at IS NOT NULL
    `;
    expect(deadSeed[0]!.n).toBe(1);
  });

  it("AC3: rejects invalid body with 400 and no writes", async () => {
    const res = await postJson(app, "/pairs/seed", { pairs: [{ input: "", response: "x" }] });
    expect(res.status).toBe(400);
    const n = await sql()<{ n: number }[]>`SELECT COUNT(*)::int AS n FROM pairs`;
    expect(n[0]!.n).toBe(0);
  });

  it("AC4: embed failure leaves the store untouched (no soft-delete, no insert)", async () => {
    await sql()`INSERT INTO pairs (input, normalized_input, response, source, audit_status, embedding)
                VALUES ('seeded', 'seeded', 'a', 'seed', 'seed', ${`[${unitVec(0).join(",")}]`}::vector)`;
    spies.createSeedEmbedder.mockImplementationOnce(() => fakeEmbedder(true));

    const res = await postJson(app, "/pairs/seed", { pairs: [{ input: "x", response: "y" }] });
    expect(res.status).toBe(500);
    const rows = await sql()<{ input: string; deleted_at: string | null }[]>`
      SELECT input, deleted_at FROM pairs ORDER BY id ASC
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ input: "seeded", deleted_at: null });
  });
});
