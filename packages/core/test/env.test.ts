import { describe, it, expect } from "vitest";
import { loadEnv } from "@8budev/core";

describe("loadEnv", () => {
  it("defaults port to 3010 and exposes match insights by default", () => {
    const prev = { ...process.env };
    process.env.DATABASE_URL = "postgres://u:p@localhost:5433/portf";
    delete process.env.PORT;
    delete process.env.EXPOSE_MATCH_INSIGHTS;
    const env = loadEnv();
    expect(env.PORT).toBe(3010);
    expect(env.EXPOSE_MATCH_INSIGHTS).toBe(true);
    process.env = prev;
  });

  it("throws on missing DATABASE_URL", () => {
    const prev = { ...process.env };
    delete process.env.DATABASE_URL;
    expect(() => loadEnv()).toThrow();
    process.env = prev;
  });
});
