# Editorial redesign: chat-first → editorial-scroll IA

## Status

accepted (2026-07-14) — implementation pending owner confirmation of the plan.

## Context

The site launched **chat-first**: `/` was the chat composer (`HomePane`), and
`/chat/*` the full conversation. The [`8bu Portfolio.dc.html`](https://claude.ai/design/p/99499d0b-430a-4f5e-aaca-b327bf01b078)
prototype inverts this into an **editorial magazine** presence.

## Decision

Adopt the prototype's information architecture wholesale:

- `/` becomes the **editorial home** — a single-page scroll: Hero → Selected
  Work → About → Writing → Stack → Contact.
- The chat surface is **relocated** off the homepage into **Ask** (branded "Ask
  the Editor"), reached from the nav / ⌘K / `/`.
- **Ask stays route-based** (path `/chat`, `/chat/$threadId`), not the
  prototype's in-component view-state. This preserves shareable/deep-linkable
  thread URLs, SSR, and the existing TanStack Router + store tests. The
  keyboard shortcuts navigate between routes.
- "Ask" is a **UI label only** — route path, `ChatShell`, `streamChat`, and the
  chat stores keep the `chat` vocabulary. No `/chat` URL breakage.

## Consequences

- `HomePane` (chat-on-home) is replaced by the editorial home; its composer/chip
  logic moves into the Ask route.
- Home sections bind to **existing real data** — Selected Work ←
  `projectsForGallery()`, Writing ← `essaysForGallery()`, Ask chips ←
  `SUGGESTION_CHIPS`, Contact CV ← `resumeForGallery().url`. No mock content.
  Only the **Stack** grid needs a new small static data module.
