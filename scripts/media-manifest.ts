/**
 * Curation manifest for scripts/fetch-media.ts. Operator-edited.
 *
 * Reaction GIFs are sourced from Tenor at BUILD time, converted to muted
 * autoplay mp4, and self-hosted under apps/web/public/media/gif/<mood>/.
 * Nothing here is fetched at runtime. Treated as meme-fair-use for a personal
 * portfolio (see spec "Licensing").
 *
 * `slug` becomes the filename: /media/gif/<mood>/<slug>.mp4
 */
export interface GifSource {
  mood: string;
  /** Tenor search query. */
  query: string;
  /** Filename stem (unique within the mood). */
  slug: string;
  /** Which Tenor result index to take (0 = top). Lets you skip a bad top hit. */
  pick?: number;
}

export const GIF_SOURCES: GifSource[] = [
  { mood: "proud", query: "proud of you", slug: "proud-1" },
  { mood: "proud", query: "nailed it proud", slug: "proud-2" },
  { mood: "thinking", query: "thinking hmm", slug: "thinking-1" },
  { mood: "thinking", query: "deep in thought", slug: "thinking-2" },
  { mood: "shrug", query: "shrug i dont know", slug: "shrug-1" },
  { mood: "shrug", query: "shrug whatever", slug: "shrug-2" },
  { mood: "hype", query: "lets go excited", slug: "hype-1" },
  { mood: "hype", query: "celebrate hype", slug: "hype-2" },
  { mood: "wave", query: "wave hello hi", slug: "wave-1" },
  { mood: "wave", query: "friendly wave", slug: "wave-2" },
];
