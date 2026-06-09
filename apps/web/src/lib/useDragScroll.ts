import { useCallback, useRef } from "react";

/**
 * Mouse drag-to-scroll for a horizontally-scrolling element. Native touch
 * scroll already works via `overflow-x: auto`; this adds click-and-drag on
 * pointers that don't (mouse/trackpad-click). Returns a ref to attach to the
 * scroll container.
 *
 * A movement threshold keeps real clicks working: a press that moves less than
 * `THRESHOLD`px never enters drag mode, so chip `onClick` still fires. Once
 * dragging, a `click` capture listener swallows the trailing click so the chip
 * under the pointer isn't activated at drag-end.
 */
const THRESHOLD = 6;

export function useDragScroll<T extends HTMLElement>(): (el: T | null) => void {
  const elRef = useRef<T | null>(null);
  const state = useRef({ down: false, dragging: false, startX: 0, startLeft: 0 });

  const onPointerDown = useCallback((e: PointerEvent) => {
    // Primary button / mouse only; let touch use native scrolling.
    if (e.pointerType === "touch" || e.button !== 0) return;
    state.current = {
      down: true,
      dragging: false,
      startX: e.clientX,
      startLeft: elRef.current?.scrollLeft ?? 0,
    };
  }, []);

  const onPointerMove = useCallback((e: PointerEvent) => {
    const s = state.current;
    const el = elRef.current;
    if (!s.down || !el) return;
    const dx = e.clientX - s.startX;
    if (!s.dragging && Math.abs(dx) < THRESHOLD) return;
    if (!s.dragging) {
      s.dragging = true;
      el.classList.add("is-dragging");
      el.setPointerCapture?.(e.pointerId);
    }
    el.scrollLeft = s.startLeft - dx;
  }, []);

  const endDrag = useCallback((e: PointerEvent) => {
    const s = state.current;
    const el = elRef.current;
    s.down = false;
    if (!el) return;
    if (s.dragging) {
      el.classList.remove("is-dragging");
      // Swallow the click that fires at the end of a drag.
      const swallow = (ev: Event) => {
        ev.stopPropagation();
        ev.preventDefault();
        el.removeEventListener("click", swallow, true);
      };
      el.addEventListener("click", swallow, true);
      el.releasePointerCapture?.(e.pointerId);
    }
    s.dragging = false;
  }, []);

  return useCallback(
    (el: T | null) => {
      const prev = elRef.current;
      if (prev) {
        prev.removeEventListener("pointerdown", onPointerDown);
        prev.removeEventListener("pointermove", onPointerMove);
        prev.removeEventListener("pointerup", endDrag);
        prev.removeEventListener("pointerleave", endDrag);
      }
      elRef.current = el;
      if (el) {
        el.addEventListener("pointerdown", onPointerDown);
        el.addEventListener("pointermove", onPointerMove);
        el.addEventListener("pointerup", endDrag);
        el.addEventListener("pointerleave", endDrag);
      }
    },
    [onPointerDown, onPointerMove, endDrag],
  );
}
