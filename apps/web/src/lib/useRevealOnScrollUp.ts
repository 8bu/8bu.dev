import { useCallback, useRef, useState } from "react";

/**
 * Auto-hide-on-scroll-down / reveal-on-scroll-up for a header inside a
 * scrolling container. Returns `[setRef, hidden]`: attach `setRef` to the
 * scroll container; `hidden` is true while the user scrolls down (so the
 * consumer can translate its header out of view) and false the moment they
 * scroll up — or when at the very top.
 *
 * `threshold` debounces jitter: direction only flips after that many px of
 * travel, so tiny scroll noise doesn't toggle the header.
 */
export function useRevealOnScrollUp<T extends HTMLElement>(
  threshold = 8,
): [(el: T | null) => void, boolean] {
  const [hidden, setHidden] = useState(false);
  const elRef = useRef<T | null>(null);
  const lastY = useRef(0);

  const onScroll = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    const y = el.scrollTop;
    const dy = y - lastY.current;
    if (y <= 0) {
      setHidden(false);
    } else if (dy > threshold) {
      setHidden(true); // scrolling down
    } else if (dy < -threshold) {
      setHidden(false); // scrolling up
    }
    lastY.current = y;
  }, [threshold]);

  const setRef = useCallback(
    (el: T | null) => {
      const prev = elRef.current;
      if (prev) prev.removeEventListener("scroll", onScroll);
      elRef.current = el;
      if (el) {
        lastY.current = el.scrollTop;
        el.addEventListener("scroll", onScroll, { passive: true });
      }
    },
    [onScroll],
  );

  return [setRef, hidden];
}
