/**
 * Per-client rate limiter for POST /chat. Fixed window 20 req / 60s.
 *
 * Prod uses the Cloudflare Rate-Limiting binding (carried request-scoped via
 * AsyncLocalStorage, like runWithAi). Node/dev/test and a binding-less Worker
 * isolate use the in-memory fallback below. Selection is by binding PRESENCE,
 * never an env flag — mirrors resolveEmbedder()'s EMBEDDER gate.
 *
 * RATE_LIMIT must equal the binding's `simple.limit` and RATE_WINDOW_SEC must
 * equal the binding's `period` (only 10 or 60 are legal — see wrangler.toml),
 * so the dev fallback never admits one more/fewer than prod.
 */
import { AsyncLocalStorage } from "node:async_hooks";
import type { MiddlewareHandler } from "hono";

export const RATE_LIMIT = 20;
export const RATE_WINDOW_SEC = 60;

export interface LimitResult {
  success: boolean;
  /** Seconds the client should wait. 0 < n <= RATE_WINDOW_SEC. */
  retryAfter: number;
}

export interface Limiter {
  check(key: string): LimitResult;
}

interface Window {
  count: number;
  resetAt: number; // epoch ms
}

/**
 * In-memory fixed-window limiter. `now` is injectable for deterministic tests;
 * defaults to Date.now. The Nth check where N <= RATE_LIMIT succeeds; N = 21 is
 * the first reject — matching the CF binding's counting exactly (spec §3.3).
 *
 * Prune-on-read: every check first deletes expired entries, so the map tracks
 * only keys active within the last window (bounded growth, no timers — §8.1).
 */
export function createMemoryLimiter(now: () => number = Date.now): Limiter & {
  size(): number;
} {
  const windows = new Map<string, Window>();

  return {
    check(key: string): LimitResult {
      const t = now();

      // Prune on read.
      for (const [k, w] of windows) {
        if (w.resetAt <= t) windows.delete(k);
      }

      const existing = windows.get(key);
      if (!existing || existing.resetAt <= t) {
        windows.set(key, { count: 1, resetAt: t + RATE_WINDOW_SEC * 1000 });
        return { success: true, retryAfter: RATE_WINDOW_SEC };
      }

      existing.count += 1;
      if (existing.count <= RATE_LIMIT) {
        return { success: true, retryAfter: RATE_WINDOW_SEC };
      }
      return {
        success: false,
        retryAfter: Math.ceil((existing.resetAt - t) / 1000),
      };
    },
    size(): number {
      return windows.size;
    },
  };
}

/**
 * Minimal shape of a Cloudflare Rate-Limiting binding. Defined inline (same
 * discipline as the inline WorkerEnv/AiBinding ambient types in worker.ts) so
 * the shared `tsc --noEmit` stays scoped to @types/node.
 */
export interface RateLimitBinding {
  limit(opts: { key: string }): Promise<{ success: boolean }>;
}

// The binding lives on the Worker's `env`, only available inside fetch. We
// carry it request-scoped via AsyncLocalStorage — identical discipline to
// runWithAi (services/api/src/lib/embedder.ts). Store SET → use the binding;
// store UNSET → use the in-memory fallback (Node entry + binding-less isolate).
const limiterStore = new AsyncLocalStorage<RateLimitBinding>();

/** Run `fn` with the CF Rate-Limiting binding in scope (Worker entry only). */
export function runWithRateLimit<T>(binding: RateLimitBinding, fn: () => T): T {
  return limiterStore.run(binding, fn);
}

// One in-memory limiter per isolate (per spec §3.3 it is module-scoped). Used
// whenever the ALS store is unset (Node entry + binding-less Worker isolate).
const memoryLimiter = createMemoryLimiter();

/**
 * Normalize the active limiter to a single `check(key) → Promise<LimitResult>`
 * shape. Store SET → CF binding (maps {success} → fixed Retry-After 60, since
 * the binding does not expose remaining-window — spec §5/§8.7). Store UNSET →
 * the in-memory fallback.
 */
function selectCheck(): (key: string) => Promise<LimitResult> {
  const binding = limiterStore.getStore();
  if (binding) {
    return async (key) => {
      const { success } = await binding.limit({ key });
      return { success, retryAfter: RATE_WINDOW_SEC };
    };
  }
  return (key) => Promise.resolve(memoryLimiter.check(key));
}

/**
 * Hono middleware. Resolves the client key (CF-Connecting-IP → sessionId),
 * runs the active limiter, and either calls next() (success) or returns a plain
 * JSON 429 + Retry-After (reject). NEVER invokes runChat on reject, so no
 * embedding occurs. Fails OPEN if the limiter throws (spec §8.8): a limiter
 * outage must not take down chat.
 *
 * Mounted AFTER withSession so c.get("sessionId") (the dev/test fallback key)
 * is always set (spec §4). Cheap: header read + one map/binding lookup, no DB,
 * no body parse of its own (withSession already cached the body).
 */
export const rateLimit: MiddlewareHandler = async (c, next) => {
  const key = c.req.header("CF-Connecting-IP") ?? c.get("sessionId");

  let result: LimitResult;
  try {
    result = await selectCheck()(key);
  } catch (err) {
    // Fail open — log to console (visible in `wrangler tail`, per CLAUDE.md).
    console.warn("rate-limit check failed, allowing request:", err);
    return next();
  }

  if (result.success) return next();

  c.header("Retry-After", String(result.retryAfter));
  return c.json({ error: "rate_limited" }, 429);
};
