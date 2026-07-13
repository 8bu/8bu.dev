# UI Revamp — editorial redesign migration plan

Migrate the live UI + design system to the [`8bu Portfolio.dc.html`](https://claude.ai/design/p/99499d0b-430a-4f5e-aaca-b327bf01b078)
prototype. Produced via a grilling / domain-modeling session. See
`CONTEXT.md` (glossary) and `docs/adr/0001–0003`.

## Confirmed decisions (owner-approved during grilling)

1. **Full IA + design adoption** — editorial scroll home + relocate chat to
   Ask. (ADR-0001)
2. **Clean-slate stylesheet** — drop the ~30-theme token layer + device-frame
   chrome; hand-written semantic CSS classes; minimal Tailwind. (ADR-0002)
3. **Ask = route** (path stays `/chat`), not an overlay. Shortcuts navigate.
4. **Artifacts = standalone pages only**; no in-chat split-pane. (ADR-0003)
5. **"Ask" is a UI label only** — code/route vocabulary stays `chat`.

## Provisional decisions (confirmed by owner 2026-07-14)

- **P1 · Data sources.** Home sections bind to existing real data, no mock:
  Selected Work ← `projectsForGallery()` (**all 6 projects**, auto No.01–06),
  Writing ← `essaysForGallery()`, Ask chips ← `SUGGESTION_CHIPS`, Contact CV ←
  `resumeForGallery().url`. About copy = prototype's bio text. **Stack** grid is
  the one new content source → add `features/home/stack.ts`.
- **P2 · Fonts.** Replace `GOOGLE_FONTS_HREF` in `__root.tsx` with **Newsreader**
  + **Space Grotesk**; drop Inter/Fraunces/Source Serif/Caveat/JetBrains/
  Silkscreen/Press Start.
- **P3 · Migration shape.** Single feature branch, phased commits, land together.
- **P4 · Tests.** Keep presentation-agnostic tests (streamChat, sse-parser,
  threads/messages/sessions stores, router). Rewrite component tests per phase;
  delete tests for removed features (split-pane `?artifact=` open, theme
  preference).
- **P5 · Preferences.** Remove theme state from `store/preferences.ts`; retain
  any non-theme prefs (e.g. reduced-motion) if present.

## Resolved owner questions (2026-07-14)

- **Q-A · `Concepts.dc.html`** → **skip** (scratch/alternatives, ignored).
- **Q-B · Selected Work count** → **all 6 projects** (incl.
  `figma-resume-template` as No.06).
- **Q-C · Motion budget** → **drop the marquee**; keep grain, misregistration,
  drift, reveal-on-scroll, chip-rail scroll-mask (all under
  `prefers-reduced-motion`).
- **Q-D · Work images** → **styled placeholder** (no picsum, no real
  screenshots).
- **Q-E · `apps/neolab`** → **out of scope**.

## Phased sequence (single branch)

1. **Foundation** — new global stylesheet + editorial palette + fonts; strip
   `data-theme`, device-frame, theme preference. Establish semantic class base.
2. **Editorial home** — Hero (misregistration name, vertical rail; no marquee),
   Selected Work (hover-expand rows), About, Writing, Stack, Contact. Bind to
   real data (P1). Replaces `HomePane`.
3. **Ask route** — re-skin `/chat` to the prototype's threads-rail + single
   column; reuse `streamChat` / stores / `ChatComposer` / `ChatChips`
   unchanged; nav + ⌘K/`/`/ESC wiring.
4. **Artifacts** — re-skin standalone `/artifact/$kind/$slug` + `/artifacts`
   index editorial; remove split-pane; retarget `match.ts` deep-links.
5. **Teardown** — delete `portfolio.css` theme/frame/wireframe blocks, dead
   Wordmark variants, unused tokens.
6. **Tests + gates** — rewrite/prune tests; run `pnpm -r typecheck`, `pnpm lint`,
   `pnpm format:check`, `pnpm -r --workspace-concurrency=1 test`.

## Blast radius (files touching removed tokens/theme)

`components/PortfShell.tsx`, `components/Wordmark.tsx`, `routes/__root.tsx`,
`store/preferences.ts`, `features/sidebar/components/ThreadList.tsx`,
`features/artifacts-index/components/{CvDetail,CvSlab,ArtifactsGallery}.tsx`,
`styles/portfolio.css`, `styles/layout.css` — all re-styled in the phase that
owns them.

## Reused unchanged (presentation-only revamp)

`lib/streamChat.ts`, `lib/sse-parser.ts`, `store/{messages,threads,sessions}.ts`,
`features/chat/media/*`, the artifacts MDX catalog + frontmatter schema, the
GraphRAG chat backend (`services/api`).
