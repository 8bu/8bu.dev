---
title: Migrating a 4-year Nuxt 2 codebase to Vue 3
topic: portfolio/artifact/nuxt-migration
---

The hard part of migrating Nuxt 2 to Vue 3 is not Vue 3. It's the four years of accreted decisions you have to ship alongside it: every legacy module, every i18n string, every Vuex store still humming in the background. The framework upgrade is a weekend of release notes. The codebase upgrade is a year of carrying two runtimes on the same page without anyone noticing. This is a post-mortem on doing that at WegoPro.

## The starting state

A Nuxt 2 application on Vue 2.7, around 150k lines of TypeScript, two surfaces in a monorepo: a customer-facing app with heavy SSR and SEO needs, and a back-office dashboard for internal operators. Vuex for state, vue-i18n for translations, a custom SCSS design system, in-house Nuxt modules hooked into request lifecycle. The product roadmap did not pause for the migration - every PR still had to ship a feature or fix a bug, so the migration had to be additive.

## What the bridge unlocked

The unlock was Vue 3 web components. New features were authored in Vue 3, compiled as custom elements via defineCustomElement, and embedded inside the still-running Nuxt 2 host. The host owns layout, navigation, and auth context; the island owns its data fetching, reactive state, and DOM. The two runtimes share a page through DOM attributes and CustomEvents. No big-bang rewrite, no flag-flip cutover at 2am. It let the team keep velocity - people could pick "ship in Vue 3 or stay in Vue 2" per surface, and the migration order ended up matching the natural seams of the app.

## The slowdowns nobody planned for

The bridge was the easy part. i18n strings lived in one big shared tree and didn't move per-component. SCSS design tokens lived in a shared _variables.scss, and Vue 3 web components compile with shadow DOM by default, so I built a token-export step. Vuex stores with action-sequencing assumptions had to be reached through thin adapters or round-tripped via CustomEvents.

## What I would undo

The bridge taught the team to defer the hard cleanup - it made living in the in-between cheap, so the in-between stretched. Next time I'd budget a "delete week" upfront with named owners per legacy module. I'd also start the back-office migration first rather than in parallel; it had a cleaner boundary and moved separately as a solo migration to Nuxt 4 + Nuxt UI. Doing it first would have taught us the patterns before applying them to the harder codebase.

## What worked

Two things mattered more than any technical decision. First, the same person holding the architectural line for the whole stretch, saying no to shortcuts that broke the island/host boundary. Second, a written record - each migrated surface got a one-page doc of what moved, what stayed, and the known sharp edges. The migration is technically complete now. The framework upgrade was the easy part. The four years of decisions were the hard part. They always are.
