import { matchMedia, pickGif } from "@/features/chat/media/matchMedia";
import { MEDIA_CATALOG, type MediaCatalog } from "@/features/chat/media/catalog";

interface MediaBlockProps {
  imageSlug: string | null | undefined;
  mood: string | null | undefined;
  topic: string | null | undefined;
  /** Persisted bot message id — deterministic GIF seed. */
  seedKey: string;
  /** Injectable for tests; production reads MEDIA_CATALOG. */
  catalog?: MediaCatalog;
}

/**
 * Renders chat media below the bubble text. Controlled component over LOCAL
 * /media/ slugs only — never a raw URL from corpus text, so MarkdownBubble's
 * img-strip stays intact. Reserved-ratio box (CSS `.media-block`, max-width
 * 480px) so load causes no layout shift. Renders null when nothing resolves.
 */
export function MediaBlock({
  imageSlug,
  mood,
  topic,
  seedKey,
  catalog = MEDIA_CATALOG,
}: MediaBlockProps) {
  const image = matchMedia({ imageSlug, topic, catalog });
  const gif = pickGif(mood, seedKey, catalog);
  if (!image && !gif) return null;

  return (
    <div className="media-block">
      {image ? <img className="media-image" src={image} alt="" loading="lazy" /> : null}
      {gif ? (
        <video className="media-gif" autoPlay loop muted playsInline>
          <source src={gif} type="video/mp4" />
        </video>
      ) : null}
    </div>
  );
}
