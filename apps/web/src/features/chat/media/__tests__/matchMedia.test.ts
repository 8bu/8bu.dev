import { describe, it, expect } from "vitest";
import { matchMedia, pickGif } from "../matchMedia";
import type { MediaCatalog } from "../catalog";

const CAT: MediaCatalog = {
  imageBySlug: { "hcmc-skyline": "/media/img/hcmc-skyline.webp" },
  imageByTopic: { "portfolio/artifact/wegopro": "/media/img/wegopro.webp" },
  gifsByMood: { proud: ["/media/gif/proud/a.webp", "/media/gif/proud/b.webp"] },
};

describe("matchMedia (content image)", () => {
  it("resolves imageSlug first", () => {
    expect(matchMedia({ imageSlug: "hcmc-skyline", topic: null, catalog: CAT })).toBe(
      "/media/img/hcmc-skyline.webp",
    );
  });
  it("falls back to topic when no imageSlug", () => {
    expect(matchMedia({ imageSlug: null, topic: "portfolio/artifact/wegopro", catalog: CAT })).toBe(
      "/media/img/wegopro.webp",
    );
  });
  it("returns null when nothing matches", () => {
    expect(matchMedia({ imageSlug: "nope", topic: "nope", catalog: CAT })).toBeNull();
    expect(matchMedia({ imageSlug: null, topic: null, catalog: CAT })).toBeNull();
  });
});

describe("pickGif (reaction)", () => {
  it("picks a clip from the mood pool", () => {
    const clip = pickGif("proud", "msg-1", CAT);
    expect(CAT.gifsByMood.proud).toContain(clip);
  });
  it("is deterministic for the same seedKey", () => {
    expect(pickGif("proud", "msg-1", CAT)).toBe(pickGif("proud", "msg-1", CAT));
  });
  it("varies across the pool by seedKey", () => {
    const picks = new Set(["a", "b", "c", "d", "e", "f"].map((k) => pickGif("proud", k, CAT)));
    expect(picks.size).toBeGreaterThan(1);
  });
  it("returns null for unknown mood, null mood, or empty pool", () => {
    expect(pickGif("unknown", "msg-1", CAT)).toBeNull();
    expect(pickGif(null, "msg-1", CAT)).toBeNull();
    expect(pickGif("proud", "msg-1", { ...CAT, gifsByMood: { proud: [] } })).toBeNull();
  });
});
