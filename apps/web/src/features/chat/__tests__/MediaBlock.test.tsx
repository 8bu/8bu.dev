import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MediaBlock } from "../components/MediaBlock";
import type { MediaCatalog } from "../media/catalog";

const CAT: MediaCatalog = {
  imageBySlug: { hero: "/media/img/hero.webp" },
  imageByTopic: {},
  gifsByMood: { proud: ["/media/gif/proud/a.webp"] },
};

describe("MediaBlock", () => {
  it("renders a content image from imageSlug", () => {
    const { container } = render(
      <MediaBlock imageSlug="hero" mood={null} topic={null} seedKey="m1" catalog={CAT} />,
    );
    const img = container.querySelector("img");
    expect(img?.getAttribute("src")).toBe("/media/img/hero.webp");
  });

  it("renders a reaction GIF video from mood", () => {
    const { container } = render(
      <MediaBlock imageSlug={null} mood="proud" topic={null} seedKey="m1" catalog={CAT} />,
    );
    const src = container.querySelector("video source");
    expect(src?.getAttribute("src")).toBe("/media/gif/proud/a.webp");
  });

  it("renders nothing when neither resolves", () => {
    const { container } = render(
      <MediaBlock imageSlug="nope" mood="nope" topic={null} seedKey="m1" catalog={CAT} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("only ever emits /media/-rooted srcs", () => {
    const { container } = render(
      <MediaBlock imageSlug="hero" mood="proud" topic={null} seedKey="m1" catalog={CAT} />,
    );
    for (const el of container.querySelectorAll("[src]")) {
      expect(el.getAttribute("src")!.startsWith("/media/")).toBe(true);
    }
  });
});
