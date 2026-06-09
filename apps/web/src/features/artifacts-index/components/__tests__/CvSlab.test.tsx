import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { CvSlab } from "@/features/artifacts-index/components/CvSlab";
import type { ResumeGalleryItem } from "@/features/artifacts-index/data";

// Render <Link> as a plain <a> in jsdom (router root isn't mounted) — mirrors
// the ArtifactsGallery test's mock. We only need href + nesting to assert intent.
vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
    [k: string]: unknown;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const resume: ResumeGalleryItem = {
  slug: "longnguyen-2026",
  title: "longnguyen-2026.pdf",
  period: "2026",
  summary: "Résumé",
  url: "/longnguyen-2026.pdf",
  href: "/artifact/resume/longnguyen-2026",
};

afterEach(() => cleanup());

describe("CvSlab", () => {
  it("renders the download anchor OUTSIDE the résumé link (no nested anchors)", () => {
    const { container } = render(<CvSlab resume={resume} />);
    const anchors = [...container.querySelectorAll("a")];
    // No anchor may have another anchor as an ancestor.
    for (const a of anchors) {
      expect(a.parentElement?.closest("a")).toBeNull();
    }
  });

  it("download anchor targets the PDF url with the download attribute", () => {
    render(<CvSlab resume={resume} />);
    const dl = screen.getByLabelText("Download résumé PDF") as HTMLAnchorElement;
    expect(dl.getAttribute("href")).toBe("/longnguyen-2026.pdf");
    expect(dl.hasAttribute("download")).toBe(true);
  });

  it("title link points to the résumé artifact route", () => {
    render(<CvSlab resume={resume} />);
    const open = screen.getByLabelText("Open résumé longnguyen-2026.pdf") as HTMLAnchorElement;
    expect(open.getAttribute("href")).toBe("/artifact/resume/longnguyen-2026");
  });

  it("omits the download anchor when resume.url is null", () => {
    render(<CvSlab resume={{ ...resume, url: null }} />);
    expect(screen.queryByLabelText("Download résumé PDF")).toBeNull();
  });
});
