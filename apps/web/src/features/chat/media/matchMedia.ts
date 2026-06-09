import { MEDIA_CATALOG, type MediaCatalog } from "./catalog";

interface MatchMediaArgs {
  imageSlug: string | null | undefined;
  topic: string | null | undefined;
  catalog?: MediaCatalog;
}

/**
 * Resolve a content-image asset path. imageSlug (explicit, per-pair) wins;
 * else the answer topic (long-tail map). Returns null when neither resolves —
 * including when the slug exists in YAML but has no catalog asset yet (graceful
 * blank, never a broken <img>).
 */
export function matchMedia(args: MatchMediaArgs): string | null {
  const cat = args.catalog ?? MEDIA_CATALOG;
  const bySlug = args.imageSlug ? cat.imageBySlug[args.imageSlug] : undefined;
  if (bySlug) return bySlug;
  const byTopic = args.topic ? cat.imageByTopic[args.topic] : undefined;
  if (byTopic) return byTopic;
  return null;
}

/** FNV-1a 32-bit — small, stable, dependency-free string hash. */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Deterministic reaction-GIF pick from a mood pool, seeded on the persisted
 * bot message id → stable across re-renders, varied across the pool. Unknown
 * mood / null / empty pool → null.
 */
export function pickGif(
  mood: string | null | undefined,
  seedKey: string,
  catalog: MediaCatalog = MEDIA_CATALOG,
): string | null {
  if (!mood) return null;
  const pool = catalog.gifsByMood[mood];
  if (!pool || pool.length === 0) return null;
  return pool[hash(seedKey) % pool.length] ?? null;
}
