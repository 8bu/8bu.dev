/**
 * Seed document-less Q&A pairs into the store via the running admin-api
 * (loopback :3001). Reads seeds/interview.yaml, POSTs the whole set to
 * POST /pairs/seed, which embeds + full-replaces source='seed' pairs. No DB
 * driver here — pure HTTP, same pattern as scripts/ingest-corpus.ts. Works
 * against ANY target DB (local docker OR prod Neon) per admin-api's
 * DATABASE_URL. No Anthropic key needed (no LLM on the seed path).
 *
 *   pnpm exec tsx --env-file=.env scripts/seed-pairs.ts
 */
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { parse } from "yaml";

const ADMIN_BASE = process.env.ADMIN_BASE ?? "http://localhost:3001";
const YAML_PATH = resolve(fileURLToPath(import.meta.url), "../../seeds/interview.yaml");

interface SeedPair {
  input: string;
  response: string;
  topic?: string;
  locale?: string;
  image?: string;
  mood?: string;
}

async function main(): Promise<void> {
  const raw = await readFile(YAML_PATH, "utf8");
  const doc = parse(raw) as Record<string, SeedPair[]>;
  // Flatten topic-grouped sections into a single pairs array.
  const pairs: SeedPair[] = Object.values(doc).flat();
  if (pairs.length === 0) throw new Error("no pairs parsed from seeds/interview.yaml");

  const res = await fetch(`${ADMIN_BASE}/pairs/seed`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ pairs }),
  });
  if (res.status !== 201) {
    throw new Error(`POST /pairs/seed: HTTP ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { batchId: number; inserted: number; replaced: number };
  console.log(
    `✓ seeded ${body.inserted} pairs (replaced ${body.replaced}) — batch ${body.batchId}`,
  );
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
