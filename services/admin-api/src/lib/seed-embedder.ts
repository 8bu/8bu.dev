import type { EmbeddingPort } from "@cosimi/core";
import { loadEnv } from "@cosimi/core";
import { createOllamaEmbedder } from "@cosimi/adapter-embed-ollama";

/**
 * Node embedder for the document-less seed path (`POST /pairs/seed`). Isolated
 * in its own module (not inlined in the route) so tests can `vi.mock` it with a
 * fake embedder — the same discipline as `ingest-deps.ts`. No LLM/Anthropic key.
 */
export function createSeedEmbedder(): EmbeddingPort {
  const env = loadEnv();
  return createOllamaEmbedder({
    baseUrl: env.OLLAMA_BASE_URL,
    model: env.OLLAMA_EMBED_MODEL,
    dimension: env.EMBEDDING_DIM,
  });
}
