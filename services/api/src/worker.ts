import { runWithRequestDb } from "@cosimi/adapter-postgres";

import { app } from "./app";
import { runWithAi } from "./lib/embedder";
import type { AiBinding } from "@cosimi/adapter-embed-workers-ai";
import { runWithRateLimit, type RateLimitBinding } from "./lib/rate-limit";
import { stripApiPrefix } from "./lib/worker-url";

/**
 * Minimal Cloudflare Workers ambient types. Defined inline (rather than via
 * `@cloudflare/workers-types`) so the shared `tsc --noEmit` typecheck stays
 * scoped to @types/node globals. wrangler bundles via esbuild and does not
 * typecheck, so these are only for our own editor/CI typecheck.
 */
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
interface WorkerEnv {
  HYPERDRIVE?: { connectionString: string };
  AI?: AiBinding;
  CHAT_LIMIT?: RateLimitBinding;
  [key: string]: unknown;
}

/**
 * Bridge Cloudflare bindings into `process.env` before `loadEnv()` (called
 * lazily by @cosimi/adapter-postgres + the SDK) sees them. The Postgres URL is
 * NOT a secret/var — it's provided at runtime by the Hyperdrive binding.
 * Remaining string-valued bindings (LOG_LEVEL, EMBEDDER, RETRIEVE_*,
 * SSE_DELAY_*, ...) are forwarded verbatim; the Hyperdrive object + the AI
 * binding (non-string) are skipped.
 */
function hoistEnv(env: WorkerEnv): void {
  if (env.HYPERDRIVE?.connectionString) {
    process.env.DATABASE_URL = env.HYPERDRIVE.connectionString;
  }
  for (const [key, value] of Object.entries(env)) {
    if (typeof value === "string") process.env[key] = value;
  }
}

export default {
  async fetch(req: Request, env: WorkerEnv, _ctx: ExecutionContext): Promise<Response> {
    hoistEnv(env);
    // app.fetch's env/ctx args are omitted: the Hono routes read config from
    // process.env (hoisted above), not from c.env.
    //
    // runWithRequestDb installs a request-scoped postgres client (workerd forbids
    // cross-request socket reuse); runWithAi installs the request-scoped
    // Workers-AI binding the embedder reads. createCosimi / resolveEmbedder run
    // inside both scopes, at request time — never at module scope (loadEnv would
    // throw at deploy-time global validation with no DATABASE_URL / bindings).
    // Both scopes ride along to Hono's deferred SSE generator via AsyncLocalStorage.
    return runWithRequestDb(async () => {
      const run = () => app.fetch(stripApiPrefix(req));
      // Carry the CF Rate-Limiting binding request-scoped, like runWithAi. When
      // absent (binding not yet provisioned), skip the scope — rateLimit then
      // falls to the in-memory limiter (ALS store unset) instead of throwing.
      const withRl = env.CHAT_LIMIT ? () => runWithRateLimit(env.CHAT_LIMIT!, run) : run;
      return env.AI ? runWithAi(env.AI, withRl) : withRl();
    });
  },
};
