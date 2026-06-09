import postgres from "postgres";
import { applyMigrations } from "../src/apply-migrations";

// Drop + replay the full migration sequence against the shared test DB.
export default async function setup() {
  process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5434/portf_test";
  const db = postgres(process.env.DATABASE_URL, { max: 1, onnotice: () => {} });
  await db`DROP SCHEMA public CASCADE`;
  await db`CREATE SCHEMA public`;
  await applyMigrations(db);
  await db.end();
}
