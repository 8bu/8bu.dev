import type postgres from "postgres";
import { normalize, type Source } from "@8budev/core";
import { sql } from "../client";

// The pair write-path DTO. `normalized_unaccented` is intentionally absent —
// it's a GENERATED ALWAYS ... STORED column (migrations/002_pairs.sql) and
// Postgres rejects explicit values. Missing `locale` → 'und' (universal).
export interface InsertPairInput {
  input: string;
  response: string;
  source: Source;
  topic?: string | null;
  batch_id?: number | null;
  flagged?: boolean;
  locale?: string;
}

// postgres.Sql is the pool client; postgres.TransactionSql is the .begin()
// handle. Accepting either keeps the canonical write path reusable inside
// transactions (e.g. POST /pairs deleting matching unanswered rows atomically).
type Executor = postgres.Sql | postgres.TransactionSql;

// `RETURNING id::int AS id` casts BIGSERIAL away from postgres.js's default
// string representation so wire/JSON shapes stay numeric.
export async function insertPair(p: InsertPairInput, tx?: Executor): Promise<{ id: number }> {
  const db = tx ?? sql();
  const normalized = normalize(p.input);
  const [row] = await db<{ id: number }[]>`
    INSERT INTO pairs (input, normalized_input, response, source, topic, batch_id, flagged, locale)
    VALUES (
      ${p.input},
      ${normalized},
      ${p.response},
      ${p.source},
      ${p.topic ?? null},
      ${p.batch_id ?? null},
      ${p.flagged ?? false},
      ${p.locale ?? "und"}
    )
    RETURNING id::int AS id
  `;
  return row!;
}

export async function insertManyPairs(rows: InsertPairInput[], tx?: Executor): Promise<number> {
  if (!rows.length) return 0;
  const db = tx ?? sql();
  const prepared = rows.map((r) => ({
    input: r.input,
    normalized_input: normalize(r.input),
    response: r.response,
    source: r.source,
    topic: r.topic ?? null,
    batch_id: r.batch_id ?? null,
    flagged: r.flagged ?? false,
    locale: r.locale ?? "und",
  }));
  // postgres.js bulk-insert helper: `db(rows, ...cols)` interpolates a multi-row
  // VALUES block. The column list never includes the generated column.
  await db`
    INSERT INTO pairs ${db(
      prepared,
      "input",
      "normalized_input",
      "response",
      "source",
      "topic",
      "batch_id",
      "flagged",
      "locale",
    )}
  `;
  return prepared.length;
}
