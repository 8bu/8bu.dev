/**
 * Local media manifest. EVERY path here is under /media/ — the only origin
 * MediaBlock will render. Starts empty (Deliverable A ships with no visible
 * media); Deliverable B fills it as assets land in apps/web/public/media/.
 */
export interface MediaCatalog {
  /** image slug → /media/img/<file> */
  imageBySlug: Record<string, string>;
  /** answer topic → /media/img/<file> (long-tail content image) */
  imageByTopic: Record<string, string>;
  /** mood tag → ordered clip pool (each /media/gif/...) */
  gifsByMood: Record<string, string[]>;
}

export const MEDIA_CATALOG: MediaCatalog = {
  imageBySlug: {
    chihuahua: "/media/img/chihuahua.webp",
    wedding: "/media/img/wedding.webp",
    nhi: "/media/img/nhi.webp",
  },
  imageByTopic: {},
  // Reaction clips: muted autoplay mp4, sourced via scripts/fetch-media.ts.
  gifsByMood: {
    proud: ["/media/gif/proud/proud-1.mp4", "/media/gif/proud/proud-2.mp4"],
    thinking: ["/media/gif/thinking/thinking-1.mp4", "/media/gif/thinking/thinking-2.mp4"],
    shrug: ["/media/gif/shrug/shrug-1.mp4", "/media/gif/shrug/shrug-2.mp4"],
    hype: ["/media/gif/hype/hype-1.mp4", "/media/gif/hype/hype-2.mp4"],
    wave: ["/media/gif/wave/wave-1.mp4", "/media/gif/wave/wave-2.mp4"],
  },
};

/** Every value must be a /media/-rooted path (safety invariant). */
export function allCatalogPaths(c: MediaCatalog = MEDIA_CATALOG): string[] {
  return [
    ...Object.values(c.imageBySlug),
    ...Object.values(c.imageByTopic),
    ...Object.values(c.gifsByMood).flat(),
  ];
}
