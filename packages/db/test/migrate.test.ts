import { describe, it, expect, afterAll } from "vitest";
import { sql, closeDb, insertManyPairs } from "../src/index";

afterAll(async () => {
  await closeDb();
});

describe("schema + write path", () => {
  it("has the lexical search indexes", async () => {
    const idx = await sql()<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes WHERE tablename = 'pairs'`;
    const names = idx.map((r) => r.indexname);
    expect(names).toContain("pairs_fts_idx");
    expect(names).toContain("pairs_trgm_idx");
    expect(names).toContain("pairs_normalized_unaccented_idx");
  });

  it("inserts pairs and materializes normalized_unaccented", async () => {
    await insertManyPairs([
      {
        input: "Where do you work?",
        response: "WegoPro",
        source: "seed",
        locale: "en",
      },
    ]);
    const rows = await sql()<{ nu: string }[]>`
      SELECT normalized_unaccented AS nu FROM pairs WHERE response = 'WegoPro'`;
    expect(rows[0]?.nu).toBe("where do you work?");
  });
});
