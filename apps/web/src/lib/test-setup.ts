import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Vitest 3 doesn't auto-unmount renders between tests (same trap apps/web
// and apps/admin document). cleanup() in afterEach is mandatory.
afterEach(() => {
  cleanup();
});

// jsdom implements neither matchMedia nor IntersectionObserver; the editorial
// home's reveal + reduced-motion hooks touch both. Minimal no-op stubs so
// effects run without throwing (matches:false → observer path exercised).
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}
if (typeof globalThis !== "undefined" && !("IntersectionObserver" in globalThis)) {
  class IO {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
  }
  (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO;
}
