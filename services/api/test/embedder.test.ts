import { describe, it, expect } from "vitest";
import { resolveEmbedder } from "../src/lib/embedder";

describe("resolveEmbedder", () => {
  it("defaults to an ollama embedder with dimension 1024", () => {
    delete process.env.EMBEDDER; // default 'ollama'
    const e = resolveEmbedder();
    expect(e.dimension).toBe(1024);
    expect(typeof e.embed).toBe("function");
  });

  it("throws for workers-ai when no AI binding is in scope", () => {
    process.env.EMBEDDER = "workers-ai";
    expect(() => resolveEmbedder()).toThrow(/runWithAi/);
    delete process.env.EMBEDDER;
  });
});
