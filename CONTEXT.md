# 8bu.dev

Personal portfolio at **8bu.dev**: an editorial-magazine web presence with a
deterministic GraphRAG chat surface. This glossary fixes the language of the
site's information architecture and its visual design system.

## Site surfaces

**Editorial home**:
The single-page scroll site at `/` — Hero, Selected Work, About, Writing,
Stack, Contact. The primary surface; replaced the former chat-first landing.
_Avoid_: landing, homepage-chat.

**Ask**:
The chat surface, branded "Ask the Editor" in the UI. A real route (path stays
`/chat`, `/chat/$threadId`), reached from the nav ASK button or ⌘K / `/`.
Threads rail + single conversation column. "Ask" is a **display label only** —
code, route, and store vocabulary remain `chat`.
_Avoid_: renaming code to `ask`.

**Artifact**:
A CV, project case, or essay rendered from MDX as its own **standalone page**
(`/artifact/$kind/$slug`). Chat matches and the Work/Writing lists deep-link to
these pages. There is no in-chat artifact split-pane.
_Avoid_: artifact pane, split-pane, third column.

## Home sections

**Selected Work**:
The ranked list of five project cases on the editorial home (No.01–05). A row
expands on hover to a preview panel; "View case →" links to the project
Artifact.
_Avoid_: portfolio grid, projects section.

**Writing**:
The list of essays/notes on the editorial home. Rows link to essay Artifacts.
_Avoid_: blog, posts.

**Stack**:
The "type-case" grid of tools grouped by area (Data/infra, Languages,
Front-end, Back-end, Web3, Testing & AI).

## Design language

**Editorial palette**:
The single fixed palette — canvas `#F4EFE2`, ink `#1F2A9E` (deep blue),
accent `#FF4D2E` (coral). No theme switcher, no runtime theming.
_Avoid_: cream/coral tokens (old vocabulary), theme, `data-theme`.

**Misregistration**:
The coral offset ghost behind the ink hero name — an animated print
mis-registration motif. Disabled under `prefers-reduced-motion`.
_Avoid_: name shadow, text-shadow.

The prototype's Hero **marquee** (scrolling capability strip) is intentionally
**dropped** in production.
