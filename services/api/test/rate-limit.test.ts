import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";

import { createMemoryLimiter, RATE_LIMIT, RATE_WINDOW_SEC } from "../src/lib/rate-limit";
import { runWithRateLimit } from "../src/lib/rate-limit";
import type { RateLimitBinding } from "../src/lib/rate-limit";
import { withSession } from "../src/lib/session";

describe("createMemoryLimiter — fixed window boundary", () => {
  it("admits the first RATE_LIMIT (20) checks for one key", () => {
    const limiter = createMemoryLimiter();
    for (let i = 0; i < RATE_LIMIT; i++) {
      const r = limiter.check("ip-a");
      expect(r.success).toBe(true);
    }
  });

  it("rejects the 21st check within the window with retryAfter in (0, 60]", () => {
    const limiter = createMemoryLimiter();
    for (let i = 0; i < RATE_LIMIT; i++) limiter.check("ip-a");
    const r = limiter.check("ip-a");
    expect(r.success).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
    expect(r.retryAfter).toBeLessThanOrEqual(RATE_WINDOW_SEC);
  });

  it("isolates distinct keys (A exhausted does not throttle B)", () => {
    const limiter = createMemoryLimiter();
    for (let i = 0; i < RATE_LIMIT + 1; i++) limiter.check("ip-a");
    expect(limiter.check("ip-b").success).toBe(true);
  });

  it("resets the key after the window elapses (injected clock)", () => {
    let nowMs = 1_000_000;
    const limiter = createMemoryLimiter(() => nowMs);
    for (let i = 0; i < RATE_LIMIT; i++) limiter.check("ip-a");
    expect(limiter.check("ip-a").success).toBe(false);
    nowMs += RATE_WINDOW_SEC * 1000 + 1; // past resetAt
    expect(limiter.check("ip-a").success).toBe(true);
  });

  it("prunes expired keys on read (map does not retain dead keys)", () => {
    let nowMs = 1_000_000;
    const limiter = createMemoryLimiter(() => nowMs);
    limiter.check("stale"); // creates entry, resetAt = now + 60s
    nowMs += RATE_WINDOW_SEC * 1000 + 1; // expire it
    limiter.check("fresh"); // a read on a different key → prune pass deletes "stale"
    expect(limiter.size()).toBe(1); // only "fresh" remains
  });
});

describe("runWithRateLimit — ALS scope", () => {
  it("runs fn and returns its value (composes like runWithAi)", async () => {
    const binding: RateLimitBinding = {
      limit: () => Promise.resolve({ success: true }),
    };
    const out = await runWithRateLimit(binding, () => Promise.resolve("ran"));
    expect(out).toBe("ran");
  });
});

// Build a throwaway app that mounts the real withSession + rateLimit before a
// trivial handler. Driving it with app.fetch exercises real Hono context.
async function makeApp() {
  const { rateLimit } = await import("../src/lib/rate-limit");
  const app = new Hono();
  app.post("/t", withSession, rateLimit, (c) => c.text("ok"));
  return app;
}

function post(app: Hono, headers: Record<string, string> = {}) {
  return app.fetch(
    new Request("http://localhost/t", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ message: "hi" }),
    }),
  );
}

describe("rateLimit middleware — in-memory path (ALS unset)", () => {
  beforeEach(() => vi.resetModules());

  it("21st request from one sessionId key → 429 + Retry-After, handler not run", async () => {
    const app = await makeApp();
    const sid = "00000000-0000-4000-8000-000000000000";
    for (let i = 0; i < 20; i++) {
      const ok = await post(app, { "X-Session-Id": sid });
      expect(ok.status).toBe(200);
      expect(await ok.text()).toBe("ok");
    }
    const limited = await post(app, { "X-Session-Id": sid });
    expect(limited.status).toBe(429);
    const ra = Number(limited.headers.get("Retry-After"));
    expect(ra).toBeGreaterThanOrEqual(1);
    expect(ra).toBeLessThanOrEqual(60);
    expect(await limited.json()).toEqual({ error: "rate_limited" });
  });

  it("keys off CF-Connecting-IP when present (distinct IPs are isolated)", async () => {
    const app = await makeApp();
    // Exhaust ip-a; ip-b must still pass — proves the bucket keys off the IP,
    // not the per-request minted sessionId.
    for (let i = 0; i < 21; i++) await post(app, { "CF-Connecting-IP": "10.0.0.1" });
    const other = await post(app, { "CF-Connecting-IP": "10.0.0.2" });
    expect(other.status).toBe(200);
    const same = await post(app, { "CF-Connecting-IP": "10.0.0.1" });
    expect(same.status).toBe(429);
  });
});

describe("rateLimit middleware — binding path (ALS set)", () => {
  beforeEach(() => vi.resetModules());

  it("binding success:false → 429 with Retry-After 1..60", async () => {
    const { runWithRateLimit } = await import("../src/lib/rate-limit");
    const app = await makeApp();
    const binding = { limit: () => Promise.resolve({ success: false }) };
    const res = await runWithRateLimit(binding, () =>
      post(app, { "CF-Connecting-IP": "10.0.0.9" }),
    );
    expect(res.status).toBe(429);
    const ra = Number(res.headers.get("Retry-After"));
    expect(ra).toBeGreaterThanOrEqual(1);
    expect(ra).toBeLessThanOrEqual(60);
  });

  it("binding success:true → handler runs (200 ok)", async () => {
    const { runWithRateLimit } = await import("../src/lib/rate-limit");
    const app = await makeApp();
    const binding = { limit: () => Promise.resolve({ success: true }) };
    const res = await runWithRateLimit(binding, () =>
      post(app, { "CF-Connecting-IP": "10.0.0.9" }),
    );
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ok");
  });

  it("fail-open: binding.limit() rejects → handler runs, console.warn emitted", async () => {
    const { runWithRateLimit } = await import("../src/lib/rate-limit");
    const app = await makeApp();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const binding = { limit: () => Promise.reject(new Error("CF transient")) };
    const res = await runWithRateLimit(binding, () =>
      post(app, { "CF-Connecting-IP": "10.0.0.9" }),
    );
    expect(res.status).toBe(200);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
