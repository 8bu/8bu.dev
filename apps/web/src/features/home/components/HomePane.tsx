import { useRef } from "react";
import { Wordmark } from "@/components/Wordmark";
import { ChipRow } from "./ChipRow";
import { Composer, type ComposerHandle } from "./Composer";
import { SpotlightHeadline } from "./SpotlightHeadline";
import { useSampledChips } from "../use-sampled-chips";

/**
 * V2 spotlight composition root.
 *
 * Shape ported from the design source's `V2Desktop`
 * (`docs/superpowers/artifacts/cosimi2/project/variations-1-2.jsx` line
 * 140-189) for desktop, and `V2Mobile` (line 193-219) for ≤768px: layout
 * lives in `.home-*` classes in layout.css (base = desktop values, a mobile
 * `@media` block matches the compact V2Mobile prototype). Inline styles were
 * removed so the mobile overrides can win — inline styles can't be media-scoped.
 */
export function HomePane() {
  const composerRef = useRef<ComposerHandle>(null);
  const chips = useSampledChips(5);

  return (
    <main className="home-pane">
      {/* Top bar - Wordmark left, "open for roles" status right. */}
      <div className="home-topbar">
        <Wordmark />
        <div className="home-status">
          <span className="home-status__dot" />
          <span className="home-status__full">Open for senior roles · Q3 '26</span>
          <span className="home-status__short">open</span>
        </div>
      </div>

      {/* Middle - centered headline + composer column. */}
      <div className="home-middle">
        <SpotlightHeadline />
        <div className="home-col">
          <Composer ref={composerRef} />
          <div className="home-chips">
            <ChipRow
              chips={chips}
              onPick={(label) => composerRef.current?.runChipAnimation(label)}
            />
          </div>
          <div className="home-hint">
            try · "show me your CV" · "what have you been writing?" · "give me your stack"
          </div>
        </div>
      </div>
    </main>
  );
}
