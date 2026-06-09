import { describe, it, expect, afterAll } from "vitest";

const { sql, closeDb } = await import("@cosimi/adapter-postgres");

afterAll(async () => {
  await closeDb();
});

describe("migration 015 — pairs media columns", () => {
  it("pairs has nullable image_slug and mood text columns", async () => {
    const rows = await sql()<{ column_name: string; is_nullable: string; data_type: string }[]>`
      SELECT column_name, is_nullable, data_type
        FROM information_schema.columns
       WHERE table_name = 'pairs'
         AND column_name IN ('image_slug', 'mood')
       ORDER BY column_name
    `;
    expect(rows.map((r) => r.column_name)).toEqual(["image_slug", "mood"]);
    expect(rows.every((r) => r.is_nullable === "YES")).toBe(true);
    expect(rows.every((r) => r.data_type === "text")).toBe(true);
  });
});
