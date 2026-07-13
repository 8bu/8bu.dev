import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

/**
 * Reveal-on-scroll for `[data-reveal]` elements. Ported from the prototype's
 * IntersectionObserver: elements start translated+transparent and settle when
 * they enter the viewport. Fully bypassed under `prefers-reduced-motion` — the
 * elements are left at their natural (visible) state, no observer created.
 */
export function useReveal(): void {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            const el = en.target as HTMLElement;
            el.style.opacity = "1";
            el.style.transform = "translateY(0)";
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.12 },
    );

    const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
    for (const el of els) {
      el.style.opacity = "0";
      el.style.transform = "translateY(26px)";
      el.style.transition =
        "opacity 0.8s cubic-bezier(0.22,1,0.36,1), transform 0.8s cubic-bezier(0.22,1,0.36,1)";
      io.observe(el);
    }
    return () => io.disconnect();
  }, []);
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
