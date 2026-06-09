import postgres from "postgres";
import { applyMigrations } from "@8budev/db";

export default async function setup() {
  process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5434/portf_test";
  // Deterministic, instant streaming in tests.
  process.env.SSE_DELAY_BASE_MS = "0";
  process.env.SSE_DELAY_JITTER_MS = "0";
  const db = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  await db`DROP SCHEMA public CASCADE`;
  await db`CREATE SCHEMA public`;
  await applyMigrations(db);
  await db.end();
}
