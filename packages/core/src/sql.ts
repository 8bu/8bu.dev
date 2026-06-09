import type postgres from "postgres";

// The postgres client accessor (a function, NOT the client instance) so that on
// Cloudflare Workers the request-scoped ALS resolution happens at call time —
// exactly as the adapter's own `sql()` does.
export type SqlAccessor = () => ReturnType<typeof postgres>;
