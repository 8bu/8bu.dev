# Artifacts as standalone pages only — drop the in-chat split-pane

## Status

accepted (2026-07-14) — implementation pending owner confirmation of the plan.

## Context

Today, artifacts (CV / project cases / essays, authored as MDX) render in a
**third-column split-pane** inside `/chat` when `?artifact=<slug>` is set
(`ChatShell` + `ArtifactPane`), and also as standalone `/artifact/$kind/$slug`
pages. Chat matches deep-link into the split-pane. The prototype's Ask view is a
clean single conversation column with **no artifact pane**.

## Decision

Artifacts render **only** as standalone `/artifact/$kind/$slug` pages, styled
editorial. Remove the in-chat split-pane: the `?artifact=` search-param branch,
`ArtifactPane` mounting inside `ChatShell`, and the split-pane grid. Chat-match
deep-links and the Selected Work "View case →" / Writing rows **navigate** to the
standalone page instead of opening a side pane.

## Consequences

- `ChatShell` simplifies to the single-column Ask layout (threads rail +
  conversation).
- `features/artifacts/match.ts` deep-link target changes from a `?artifact=`
  search param to a route navigation; its tests update accordingly.
- Trade-off: gives up side-by-side chat+artifact reading in exchange for the
  prototype's clean Ask surface and a simpler shell.
