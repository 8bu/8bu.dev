import { useEffect, type RefObject } from "react";
import { useNavigate } from "@tanstack/react-router";

/**
 * Reveal-on-scroll for `[data-reveal]` elements + editorial smooth-scroll.
 * Ported from the prototype's IntersectionObserver.
 *
 * Reveal is driven by a **class toggle**, never inline styles: the hidden
 * state lives in CSS behind `.ed-js` (added here on mount) so no-JS / SSR
 * renders content visible (SEO-safe), and the `.ed-in` reveal class settles it.
 * Crucially this leaves each element's CSS `transition` intact — an inline
 * `transition` here would override authored hovers (e.g. the work-row indent).
 *
 * Smooth-scroll is set on `<html>` for the lifetime of the home route only, so
 * anchor jumps glide (prototype `html { scroll-behavior: smooth }`) without
 * leaking into the chat pane's programmatic autoscroll.
 *
 * Under `prefers-reduced-motion` everything is bypassed: no `.ed-js`, no
 * observer, no smooth-scroll — elements stay at their natural visible state.
 */
export function useReveal(rootRef: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const de = document.documentElement;
    const prevScroll = de.style.scrollBehavior;
    de.style.scrollBehavior = "smooth";
    root.classList.add("ed-js");

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("ed-in");
            io.unobserve(en.target);
          }
        }
      },
      { threshold: 0.12 },
    );
    for (const el of root.querySelectorAll("[data-reveal]")) io.observe(el);

    return () => {
      io.disconnect();
      de.style.scrollBehavior = prevScroll;
      root.classList.remove("ed-js");
    };
  }, [rootRef]);
}

/**
 * Global "open Ask" shortcuts on the editorial home: ⌘K / Ctrl-K or a bare `/`
 * navigate to the chat surface (branded "Ask"). Ignored while the user is
 * typing in a field. The chat route stays the real destination (ADR-0001).
 */
export function useAskShortcuts(): void {
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing =
        !!t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      const cmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k";
      const slash = e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey;
      if (cmdK || slash) {
        e.preventDefault();
        void navigate({ to: "/chat" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);
}
