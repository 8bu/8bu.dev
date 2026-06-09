import { Link } from "@tanstack/react-router";
import type { ResumeGalleryItem } from "@/features/artifacts-index/data";

/**
 * Small CV slab in the right column of the "All" view. The title is a
 * `<Link>` to the standalone résumé route; the .PDF control is a SIBLING
 * `<a download>` (not nested inside the Link — nested anchors are invalid
 * HTML). Both sit in a flex `space-between` row, so the layout is unchanged.
 */
interface CvSlabProps {
  resume: ResumeGalleryItem;
}

export function CvSlab({ resume }: CvSlabProps) {
  return (
    <div className="artx-cv">
      <div className="artx-col-label" style={{ margin: 0, marginBottom: 8 }}>
        <span>Curriculum Vitae</span>
        <span className="n">01</span>
      </div>
      <div className="artx-cv-row">
        <Link to={resume.href} className="artx-cv-link" aria-label={`Open résumé ${resume.title}`}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 600, fontSize: 13 }}>
              Long NGUYỄN - 2026
            </div>
            <div className="kbd" style={{ marginTop: 3, color: "var(--ink-4)" }}>
              {resume.title} · {resume.period}
            </div>
          </div>
        </Link>
        {resume.url && (
          <a
            href={resume.url}
            download
            className="artifact-action"
            aria-label="Download résumé PDF"
          >
            ↓ .PDF
          </a>
        )}
      </div>
    </div>
  );
}
