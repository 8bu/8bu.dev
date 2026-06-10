---
title: My tech stack
---

TypeScript is my primary language, across the stack. On the client side I work in Vue/Nuxt and React/Next; on the server side I've used Nest, Express, and Hono. For styling I reach for Tailwind and SCSS. For state I've shipped Vuex/Pinia on the Vue side and Redux/Zustand on the React side.

## Web frameworks

Vue is across my CV - Multiplier (Vue 2 to Vue 3 migration), SuperLauncher (Vue 3), WegoPro (Nuxt 2 to Nuxt 4 migration), and Motorist (Nuxt 2). I've worked Vue 2 and Vue 3, Nuxt 2 through 4, with Vuex on Vue 2 projects and Pinia on Vue 3. React/Next is also on my resume, alongside Redux and Zustand. UI libraries I've used include Antd (Multiplier), ElementUI (SuperLauncher), Vuetify and Buefy (WegoPro and Multiplier), and Storybook.

## Styling

Tailwind across WegoPro, Multiplier, and SuperLauncher. SCSS across the resume. UnoCSS on Multiplier and SuperLauncher. Stylus in the WegoPro stack.

## Backend and infra

Nest, Express, and Hono - I'm using Hono in Cosimi, deployed on a Cloudflare Worker. Express goes back to the BlockDevs years, where I built the DeFi backends: REST/RPC APIs, auth and sessions, PostgreSQL schemas and queries, and The Graph subgraphs with GraphQL for on-chain indexing. On infrastructure I've worked AWS via the Serverless framework at WegoPro - self-managed serverless deployments - plus Cloudflare, and Stripe for billing.

## Data and AI

Postgres with pgvector is the retrieval substrate behind Cosimi - a GraphRAG engine I built: documents chunked into a graph, embedded (bge-m3, 1024-dim) into pgvector, and retrieved by vector search plus a graph walk at request time. The AI work is build-time: I use the Anthropic Claude SDK to generate the question-answer corpus and audit it with a second model before it's embedded - no LLM in the live request path. It's where I've gone fullstack: schema and migrations, the ingest pipeline, and the edge API, not just the UI.

## Testing

Jest and Cypress at WegoPro, Vitest in Cosimi. ESLint on every project. I'm pragmatic about it - I test what's worth protecting.

## Dev environment and AI tools

Ghostty for the terminal, Fish for the shell, Lazygit for git. For AI-assisted development I use Claude Code, Codex, Cursor, and OpenCode, plus LMStudio and Ollama for local models, and n8n for automation. For ops and collaboration: Notion, Linear, Jira, Figma, Figjam, tldraw, and Obsidian for personal notes.
