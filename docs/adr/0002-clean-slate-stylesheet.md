# Clean-slate stylesheet: drop the token/theme/device-frame system

## Status

accepted (2026-07-14) — implementation pending owner confirmation of the plan.

## Context

The current design system (`portfolio.css`, ~2300 lines) is a **multi-theme
wireframe token layer**: ~30 `[data-theme]` palettes over `--canvas/--ink/--coral`
variables, plus device-frame chrome (`.frame-desktop`, `.win-chrome`, `.mob-notch`)
and hatched placeholder styling. In production it is **locked to one theme**
(`data-theme="press"`); the switching machinery and other 29 themes are dead
weight. The prototype has a **single fixed look**, no switcher, no device frame.

## Decision

Author a **clean-slate stylesheet** from the prototype rather than re-pointing
the old tokens. Styles are **hand-written semantic CSS classes** (`.hero-name`,
`.work-row`, `.ask-grid`), Tailwind kept minimal (reset/preflight only).

Deleted: the ~30 themes, the `data-theme` switcher, the persisted theme
preference, the device-frame/window-chrome/wireframe-placeholder styling, and
the `--canvas/--ink/--coral` token vocabulary.

Introduced: the fixed **editorial palette** (canvas `#F4EFE2`, ink `#1F2A9E`,
accent `#FF4D2E`), fonts **Newsreader** + **Space Grotesk**, and the print
motifs (film grain, name **misregistration**, marquee, drop-caps).

## Consequences

- Every currently-styled component (chat bubbles, chips, sidebar, artifacts-index
  cards, `Wordmark`, `PortfShell`) must be **re-styled from scratch** — the old
  `var(--*)` references all break. Blast radius is a known, bounded file set.
- `store/preferences.ts` loses theme state; `__root` / `PortfShell` lose
  `data-theme`.
- Trade-off: chose faithfulness to the prototype + deletion of dead theming over
  the lower-churn path of re-valuing the existing tokens.
