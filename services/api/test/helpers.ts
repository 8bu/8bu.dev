import { sql, insertManyPairs } from "@cosimi/adapter-postgres";

/** A `dim`-length unit vector with 1.0 at `idx`, else 0 — deterministic, orthogonal. */
export function unitVec(idx: number, dim = 1024): number[] {
  const v = Array.from({ length: dim }, () => 0);
  v[idx] = 1;
  return v;
}

/** pgvector literal for a JS number[]. */
export function vlit(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/** Insert a document (optionally with a topic); returns its id. */
export async function seedDocument(title = "kb", topic: string | null = null): Promise<string> {
  const [row] = await sql()<{ id: string }[]>`
    INSERT INTO documents (title, mime_type, storage_key, topic)
    VALUES (${title}, 'text/markdown', ${title + ".md"}, ${topic}) RETURNING id
  `;
  return row!.id;
}

/** Insert one chunk with an embedding; returns its id. */
export async function seedChunk(
  documentId: string,
  chunkIndex: number,
  vec: number[],
  content = "chunk content",
  sectionTitle = "Section",
): Promise<string> {
  const [row] = await sql()<{ id: string }[]>`
    INSERT INTO chunks (document_id, content, chunk_index, section_title, embedding)
    VALUES (${documentId}, ${content}, ${chunkIndex}, ${sectionTitle}, ${vlit(vec)}::vector)
    RETURNING id
  `;
  return row!.id;
}

/** Insert a pair, set its embedding + source_chunk, link it to a chunk. Returns pair id. */
export async function seedLinkedPair(
  chunkId: string,
  input: string,
  response: string,
  vec: number[],
): Promise<number> {
  await insertManyPairs([{ input, response, source: "llm" }]);
  const [row] = await sql()<{ id: number }[]>`
    SELECT id::int AS id FROM pairs WHERE input = ${input} ORDER BY id DESC LIMIT 1
  `;
  const id = row!.id;
  await sql()`
    UPDATE pairs SET embedding = ${vlit(vec)}::vector, audit_status = 'pass', source_chunk = ${chunkId}
    WHERE id = ${id}
  `;
  await sql()`INSERT INTO chunk_pair_map (chunk_id, pair_id) VALUES (${chunkId}, ${id})`;
  return id;
}

/** Insert a document-less seed pair (source='seed', audit_status='seed') with an embedding + topic. */
export async function seedSeedPair(
  input: string,
  response: string,
  vec: number[],
  topic: string | null = null,
): Promise<number> {
  const [row] = await sql()<{ id: number }[]>`
    INSERT INTO pairs (input, normalized_input, response, source, audit_status, topic, locale, embedding)
    VALUES (${input}, ${input}, ${response}, 'seed', 'seed', ${topic}, 'en', ${vlit(vec)}::vector)
    RETURNING id::int AS id
  `;
  return row!.id;
}

/** Truncate the GraphRAG corpus tables between tests. */
export async function resetCorpus(): Promise<void> {
  await sql()`TRUNCATE documents CASCADE`;
  await sql()`DELETE FROM pairs`;
  await sql()`DELETE FROM unanswered`;
}
