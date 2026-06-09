import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { MEDIA_CATALOG, allCatalogPaths } from "../catalog";

const PUBLIC_DIR = resolve(fileURLToPath(import.meta.url), "../../../../../../public");

describe("media catalog", () => {
  it("every asset path is rooted under /media/ (no external origins)", () => {
    for (const p of allCatalogPaths()) {
      expect(p.startsWith("/media/")).toBe(true);
    }
  });

  it("no mood maps to an empty pool", () => {
    for (const [mood, pool] of Object.entries(MEDIA_CATALOG.gifsByMood)) {
      expect(pool.length, `mood "${mood}" has an empty pool`).toBeGreaterThan(0);
    }
  });

  it("every catalog asset exists on disk (no broken slugs — AC11)", () => {
    for (const p of allCatalogPaths()) {
      const onDisk = resolve(PUBLIC_DIR, p.replace(/^\//, ""));
      expect(existsSync(onDisk), `missing asset: ${p}`).toBe(true);
    }
  });
});
