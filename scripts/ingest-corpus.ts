/**
 * Bulk-ingest corpus/*.md through the running admin-api (loopback :3001). Topic
 * (artifact deep-link slug) rides in the request body; admin-api stamps
 * documents.topic + upserts by title server-side, so this works against ANY
 * target DB (local docker OR prod Neon — whatever admin-api's DATABASE_URL points
 * at) and scales as the corpus grows. No DB driver here — pure HTTP.
 *
 * Operator convenience over the SAME backend the neolab Ingest UI uses. Run:
 *   pnpm exec tsx --env-file=.env scripts/ingest-corpus.ts            # all docs
 *   pnpm exec tsx --env-file=.env scripts/ingest-corpus.ts wegopro    # just one
 * Requires: admin-api up on ADMIN_BASE, ANTHROPIC_API_KEY in env, ollama running.
 * The key rides the X-Anthropic-Key header (never persisted).
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const ADMIN_BASE = process.env.ADMIN_BASE ?? "http://localhost:3001";
const CORPUS_DIR = resolve(fileURLToPath(import.meta.url), "../../corpus");
const KEY = process.env.ANTHROPIC_API_KEY;

// Excluded from the vector corpus: their conversationally-phrased generated pairs
// out-rank factual pairs on conversational queries (deep-tested — they hijacked
// "tell me about wegopro" / "why hire you"). Greetings live as seed pairs
// (seeds/interview.yaml); off-limits questions are caught by the tier-0 deflect
// guard or fall through to the FE fallback. Files kept.
const SKIP = new Set(["deflections", "smalltalk"]);

function parseFrontmatter(
  raw: string,
  fallbackTitle: string,
): { title: string; topic: string | null; body: string } {
  const m = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(raw);
  if (!m) return { title: fallbackTitle, topic: null, body: raw };
  const [, fm, body] = m;
  const get = (key: string): string | null => {
    const line = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(fm!);
    return line ? line[1]!.trim().replace(/^["']|["']$/g, "") : null;
  };
  return { title: get("title") ?? fallbackTitle, topic: get("topic"), body: (body ?? "").trim() };
}

interface Job {
  status: "running" | "done" | "error";
  stage: string;
  error?: string | null;
  documentId?: string | null;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

async function ingestOne(title: string, topic: string | null, body: string): Promise<void> {
  const res = await fetch(`${ADMIN_BASE}/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json", "X-Anthropic-Key": KEY! },
    body: JSON.stringify({
      title,
      content: body,
      locale: "en",
      ...(topic ? { topic } : {}),
    }),
  });
  if (res.status !== 202) {
    throw new Error(`POST /ingest ${title}: HTTP ${res.status} ${await res.text()}`);
  }
  const { jobId } = (await res.json()) as { jobId: string };

  for (;;) {
    await sleep(1500);
    const j = (await (await fetch(`${ADMIN_BASE}/ingest/jobs/${jobId}`)).json()) as Job;
    if (j.status === "error") throw new Error(`ingest ${title} failed @${j.stage}: ${j.error}`);
    if (j.status === "done") {
      console.log(`  ✓ ${title}${topic ? ` (topic=${topic})` : ""}`);
      return;
    }
    process.stdout.write(`\r  … ${title} [${j.stage}]    `);
  }
}

interface Stats {
  total_active: number;
  total_deleted: number;
  total_unanswered: number;
}

async function main(): Promise<void> {
  if (!KEY) throw new Error("ANTHROPIC_API_KEY missing (add to .env).");

  const health = await fetch(`${ADMIN_BASE}/healthz`).catch(() => null);
  if (!health?.ok) throw new Error(`admin-api not reachable at ${ADMIN_BASE} - run \`pnpm dev\`.`);

  // Optional CLI filter: only the named files (basename, with or without .md).
  const only = process.argv.slice(2).map((a) => a.replace(/\.md$/, ""));
  let files = (await readdir(CORPUS_DIR))
    .filter((f) => f.endsWith(".md"))
    .filter((f) => !SKIP.has(f.replace(/\.md$/, "")))
    .toSorted();
  if (only.length > 0) files = files.filter((f) => only.includes(f.replace(/\.md$/, "")));
  if (files.length === 0) throw new Error(`no matching .md in ${CORPUS_DIR}`);

  console.log(`ingesting ${files.length} docs via ${ADMIN_BASE} …`);
  for (const file of files) {
    const { title, topic, body } = parseFrontmatter(
      await readFile(resolve(CORPUS_DIR, file), "utf8"),
      file.replace(/\.md$/, ""),
    );
    try {
      await ingestOne(title, topic, body);
    } catch (err) {
      console.log(`\n  ✗ ${file}: ${err instanceof Error ? err.message : err}`);
    }
  }

  const stats = (await (await fetch(`${ADMIN_BASE}/stats`)).json()) as Stats;
  console.log(`\ndone. active pairs in target DB = ${stats.total_active}`);
}

await main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
