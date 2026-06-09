import { readFile } from "node:fs/promises";
import { extname } from "node:path";
import { parseArgs } from "node:util";
import type { Source } from "@8budev/core";
import { parse as parseYaml } from "yaml";
import { closeDb } from "../client";
import { createBatch, setBatchCount } from "../repositories/import_batches";
import { insertManyPairs } from "../repositories/pairs";

type Pair = { input: string; response: string; topic?: string };

const VALID_SOURCES = new Set<Source>(["seed", "user", "chat", "llm"]);

// portf seeds are all yaml-flat lists; json/jsonl supported for convenience.
function detect(file: string): "json" | "jsonl" | "yaml-flat" {
  const ext = extname(file).toLowerCase();
  if (ext === ".json") return "json";
  if (ext === ".jsonl") return "jsonl";
  return "yaml-flat";
}

function parseJsonArray(text: string): Pair[] {
  const data = JSON.parse(text);
  if (!Array.isArray(data)) throw new Error("expected top-level JSON array");
  return data as Pair[];
}

function parseJsonl(text: string): Pair[] {
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => JSON.parse(l) as Pair);
}

function parseYamlFlat(text: string): Pair[] {
  const data = parseYaml(text);
  if (!Array.isArray(data)) throw new Error("expected top-level YAML list");
  return data as Pair[];
}

async function loadFile(file: string): Promise<Pair[]> {
  const text = await readFile(file, "utf8");
  switch (detect(file)) {
    case "json":
      return parseJsonArray(text);
    case "jsonl":
      return parseJsonl(text);
    case "yaml-flat":
      return parseYamlFlat(text);
  }
}

async function seedFile(
  file: string,
  source: Source,
  topicOverride?: string,
  locale?: string,
): Promise<void> {
  const pairs = await loadFile(file);
  const batchId = await createBatch(source, topicOverride, `seed from ${file}`);
  const rows = pairs.map((p) => ({
    input: p.input,
    response: p.response,
    source,
    topic: topicOverride ?? p.topic ?? null,
    batch_id: batchId,
    locale,
  }));
  const count = await insertManyPairs(rows);
  await setBatchCount(batchId, count);
  console.log(
    `seeded ${count} pairs from ${file} under batch #${batchId} (locale=${locale ?? "und"})`,
  );
}

async function main(): Promise<void> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      source: { type: "string", default: "seed" },
      topic: { type: "string" },
      locale: { type: "string" },
    },
    allowPositionals: true,
  });

  if (positionals.length === 0) {
    console.error(
      "usage: seed <file> [<file> ...] [--source=seed|user|chat|llm] [--topic=...] [--locale=en|vi|...]",
    );
    process.exit(2);
  }

  const source = values.source as Source;
  if (!VALID_SOURCES.has(source)) {
    console.error(`invalid --source=${source}; expected one of: ${[...VALID_SOURCES].join(",")}`);
    process.exit(2);
  }

  for (const file of positionals) {
    await seedFile(file, source, values.topic, values.locale);
  }
}

try {
  await main();
  process.exit(0);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
} finally {
  await closeDb();
}
