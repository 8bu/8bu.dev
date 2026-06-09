import { normalize } from "@8budev/core";

/** A curated, deterministic answer for a canonical question (chip labels + common Qs). */
export interface CanonicalAnswer {
  response: string;
  /** Artifact deep-link slug, e.g. "portfolio/artifact/wegopro". Omit for non-artifact answers. */
  topic?: string;
}

/**
 * Keyed by `normalize(label)` (NFC + lowercase + collapsed whitespace, punctuation
 * kept). Checked before the GraphRAG retriever so chip labels + canonical questions
 * get exact, on-topic answers. The long tail falls through to retrieve().
 */
const ENTRIES: Record<string, CanonicalAnswer> = {
  // --- Identity ---
  "introduce yourself": {
    response:
      "I'm Long - a senior web developer with 10+ years of experience, based in Ho Chi Minh City. I ship production web apps in Vue/Nuxt, React/Next, and TypeScript across SaaS, DeFi, and design systems. I work on the product, not the task.",
  },
  "who are you": {
    response:
      "I'm Long - online I go by 8bu. Senior web developer, 10+ years, Vue/Nuxt and React/Next with TypeScript. Currently four years into WegoPro, a B2B corporate travel and expense platform.",
  },
  "what does 8bu mean": {
    response:
      '8bu means "8-bit user". One byte didn\'t sound as cool, and 8 bits feels atomic to me - the smallest unit that means something. It fits how I learn: take something complex and reduce it to its simplest form.',
  },
  "how old are you": {
    response: "I'm 30, born in 1996.",
  },
  "where do you live": {
    response: "Ho Chi Minh City - born and raised, still based here, on GMT+7.",
  },
  education: {
    response:
      "I studied Computational and Applied Mathematics at Ton Duc Thang University in HCMC from 2013 to 2016. I left in my third year to work - family was in heavy debt - so no degree.",
  },
  "how did you start coding": {
    response:
      "Through the vBulletin forum trend - that's where I picked up basic JS and PHP. I loved doing the UI, so I went HTML, JS, and CSS all the way and stayed frontend.",
  },
  "what languages do you speak": {
    response:
      "Vietnamese is my native language, and I use English daily for work. I'm self-studying Mandarin, still at a beginner level.",
  },

  // --- Career ---
  "walk me through your career": {
    response:
      "Freelance from 2013, full-time since 2016. Letterink (agency, 2016-17), Motorist.sg (SaaS, 2017-19, my first Nuxt), BlockDevs (DeFi, 2019-22), and WegoPro since 2022 - B2B travel and expense, my longest tenure at four years.",
  },
  "how many years experience": {
    response: "10+ years of professional experience - freelance from 2013, full-time since 2016.",
  },

  // --- Hiring ---
  "why hire you": {
    response:
      "I migrate live production codebases without halting delivery - Nuxt 2 to 4, Vue 2 to 3 - and I own frontend technical direction while mentoring the team. 10+ years across SaaS, DeFi, and design systems. I work on the product, not the task.",
  },
  "why should i hire you": {
    response:
      "I migrate live production codebases without halting delivery - Nuxt 2 to 4, Vue 2 to 3 - and I own frontend technical direction while mentoring the team. 10+ years across SaaS, DeFi, and design systems. I work on the product, not the task.",
  },
  "what makes you different": {
    response:
      "Most developers avoid legacy migrations. I lead them - on live products - and own the frontend direction end-to-end, keeping the product shipping while I modernize it underneath. Breadth plus depth: SaaS, DeFi, and design systems over a decade.",
  },
  "your strengths": {
    response:
      "Two things: migrating live stacks cleanly without breaking the business - Nuxt 2 to 4, Vue 2 to 3 - and working on the product rather than the ticket. Vue and Nuxt are where I'm deepest, with React/Next alongside.",
  },
  "what value do you bring": {
    response:
      "I modernize legacy frontends without stalling delivery, own technical direction, and level up the team through code review and mentoring. I treat the product as mine, not a queue of tickets.",
  },
  "are you looking for a job": {
    response:
      "Yes - I wrap up at WegoPro in April 2026 and take a roughly two-month break, so a realistic start date is around July 2026. I'm open to early conversations now. Reach me at hvanlong@pm.me or linkedin.com/in/8bu.",
  },
  "available for hire": {
    response:
      "I finish at WegoPro in April 2026 and take a roughly two-month break before the next role - a realistic start is around July 2026. Open to early conversations now: hvanlong@pm.me or linkedin.com/in/8bu.",
  },
  "when can you start": {
    response:
      "Realistically around July 2026. I finish at WegoPro in April 2026 and plan a roughly two-month break before the next role. I'm open to early conversations now.",
  },

  // --- Stack ---
  "tech stack": {
    response:
      "TypeScript is my primary language. Frontend in Vue/Nuxt and React/Next; backend with Nest, Express, and Hono. Tailwind and SCSS for styling, Pinia/Vuex and Redux/Zustand for state.",
  },
  "what's your stack": {
    response:
      "TypeScript is my primary language. Frontend in Vue/Nuxt and React/Next; backend with Nest, Express, and Hono. Tailwind and SCSS for styling, Pinia/Vuex and Redux/Zustand for state.",
  },
  "whats your stack": {
    response:
      "TypeScript is my primary language. Frontend in Vue/Nuxt and React/Next; backend with Nest, Express, and Hono. Tailwind and SCSS for styling, Pinia/Vuex and Redux/Zustand for state.",
  },
  "what do you do": {
    response:
      "I'm a senior web developer. I ship production web apps in Vue/Nuxt, React/Next, and TypeScript across SaaS, DeFi, and design systems, and I lead live-codebase migrations.",
  },
  "typescript?": {
    response: "TypeScript-first - it's my primary language. Not really a debate for me.",
  },
  "do you know vue": {
    response:
      "Vue is genuinely my strength. Most of my history is Vue - Vue 2 and Vue 3, Nuxt 2 through 4. I'm primarily a Vue developer, with React/Next alongside.",
  },
  "do you know react": {
    response:
      "Yes - React/Next is on my resume alongside Redux and Zustand, and I've shipped it in production. I reach for it when the job calls for it. Vue is my home turf, but I've shipped plenty of React.",
  },
  "vue or react": {
    response:
      "I lean Vue - it's where most of my experience is, so I reach for it by default. But I've delivered production React too, and I reach for it when the job calls for it. Whichever fits the team and the problem.",
  },
  "which is better vue or react": {
    response:
      "Neither, really - the stack should serve the product. I lean Vue because that's where most of my experience is, but I've shipped production React too. I don't pick fights over it.",
  },
  "rust?": {
    response:
      "I'm picking up Rust on personal projects, at side-project and hobby level - learning systems languages alongside Go. Not production for me yet.",
  },
  "tailwind?": {
    response:
      "Yes - Tailwind across WegoPro, Multiplier, and SuperLauncher. Tailwind for speed, SCSS when the design system needs the deeper work.",
  },
  "tailwind or scss": {
    response:
      "I've shipped both in production - Tailwind across WegoPro, Multiplier, and SuperLauncher, SCSS when it fits. Tailwind for speed, SCSS when the design system needs deeper work. It's not a holy war.",
  },

  // --- Testing ---
  "testing experience": {
    response:
      "Jest and Cypress at WegoPro, Vitest in Cosimi, ESLint on every project. I'm pragmatic - I test what's worth protecting rather than chasing a coverage number.",
  },
  "how do you feel about testing": {
    response:
      "Pragmatic, not dogmatic. I've used Jest, Cypress, and Vitest in production and test what's worth protecting rather than chasing a coverage target. Whether tests come first or after depends on the work.",
  },

  // --- Mentoring / interviews ---
  "mentoring experience": {
    response:
      "I led onboarding, mentoring, and code reviews for new team members at BlockDevs, and mentored teammates on Vue 3 patterns at WegoPro. I raise the team's bar through review and mentoring rather than working in isolation.",
  },
  "have you conducted technical interviews?": {
    response:
      "Yes - at BlockDevs I conducted technical interviews as part of team recruitment, alongside leading onboarding, mentoring, and code reviews.",
  },

  // --- Remote / work ---
  "do you work remote": {
    response:
      "Yes - I've been fully remote at WegoPro for four years, and remote earlier at Motorist.sg. Comfortable with async-first work across time zones from GMT+7.",
  },
  "where do you work": {
    response:
      "WegoPro, a B2B corporate travel and expense platform (formerly Travelstop), fully remote since March 2022. It's my longest tenure at four years. I wrap up there in April 2026.",
  },

  // --- Projects ---
  "what is wegopro": {
    response:
      "WegoPro is a B2B corporate travel and expense platform, formerly Travelstop. I spent four years there as a senior web developer, remote.",
    topic: "portfolio/artifact/wegopro",
  },
  "tell me about wegopro": {
    response:
      "WegoPro is a B2B corporate travel and expense platform, formerly Travelstop. Four years, fully remote. I led the Nuxt 2 to Nuxt 4 migration via Vue 3 web components and solo-migrated the back-office dashboard to Nuxt 4 + Nuxt UI.",
    topic: "portfolio/artifact/wegopro",
  },
  "best project": {
    response:
      "The WegoPro Nuxt 2 to Nuxt 4 migration - I led the bridge-layer strategy in Vue 3 web components and solo-migrated the back-office to Nuxt 4 + Nuxt UI, all on a live B2B platform without halting feature work. The work I'm proudest of.",
    topic: "portfolio/artifact/wegopro",
  },
  "tell me about the wallet module": {
    response:
      "On SuperLauncher I built a custom blockchain wallet module for Vue 3 - integrating MetaMask, TrustWallet, Safepal, Solflare, and Onto via WalletConnect, Web3.js, and Ethers.js. I also contributed bug fixes upstream to WalletConnect.",
    topic: "portfolio/artifact/wegopro",
  },
  "what is multiplier": {
    response:
      "Multiplier.finance is a multi-chain DeFi liquidity protocol - AAVE-style lending across chains, formerly PawnHub. I led the frontend at BlockDevs (2019-2022) and the Vue 2 to Vue 3 Composition API migration.",
    topic: "portfolio/artifact/multiplier-finance",
  },
  "tell me about multiplier": {
    response:
      "Multiplier.finance is a multi-chain DeFi liquidity protocol - AAVE-style lending across chains, formerly PawnHub. I built the core lending, wallet integration, and staking features, and led the Vue 2 to Vue 3 Composition API migration.",
    topic: "portfolio/artifact/multiplier-finance",
  },
  "defi experience": {
    response:
      "Two-plus years in DeFi at BlockDevs (2019-2022): Multiplier.finance, a multi-chain AAVE-style lending protocol, and SuperLauncher, an IDO/staking/marketplace platform. I built core features and custom Vue 3 wallet integration via WalletConnect, Web3.js, and Ethers.js.",
    topic: "portfolio/artifact/multiplier-finance",
  },
  "what is superlauncher": {
    response:
      "SuperLauncher is an IDO, staking, and marketplace blockchain platform - an IDO launchpad. I was a core frontend member from day zero at BlockDevs, built the platform architecture from scratch, and wrote a custom Vue 3 wallet module.",
    topic: "portfolio/artifact/superlauncher",
  },
  "tell me about superlauncher": {
    response:
      "SuperLauncher is an IDO launchpad with staking and a marketplace. I was a core frontend member from day zero at BlockDevs, built the architecture from scratch, wrote a custom Vue 3 wallet module, and contributed fixes upstream to WalletConnect.",
    topic: "portfolio/artifact/superlauncher",
  },
  "tell me about the nuxt migration": {
    response:
      "At WegoPro I migrated a four-year Nuxt 2 codebase to Vue 3 using Vue 3 web components as a bridge layer - new features authored as custom elements inside the running Nuxt 2 host, no big-bang rewrite. I solo-migrated the back-office to Nuxt 4 + Nuxt UI.",
    topic: "portfolio/artifact/nuxt-migration",
  },

  // --- Cosimi / this chat ---
  "what is cosimi": {
    response:
      "Cosimi is the engine powering this chat - a chatbot with no LLM in the request path. Replies come from a hand-written corpus, scored by a three-tier matcher running against Postgres. Either there's an answer I wrote, or it tells you there isn't.",
    topic: "portfolio/artifact/cosimi-design",
  },
  "tell me about cosimi": {
    response:
      "Cosimi powers this chat with no LLM in the request path. A normalized exact match, then Postgres full-text search, then trigram similarity - the first to return wins. The corpus is hand-written in my voice. I'd rather be slow than fluent in someone else's voice.",
    topic: "portfolio/artifact/cosimi-design",
  },
  "is this an llm": {
    response:
      "No. This is Cosimi - there's no LLM in the request path. Replies come from a curated corpus I wrote, matched by a three-tier engine over Postgres. The system either has an answer I wrote, or it tells you it doesn't.",
    topic: "portfolio/artifact/cosimi-design",
  },
  "what powers this chat": {
    response:
      "Cosimi - an LLM-free retrieval engine. A normalized exact match, then Postgres full-text search, then pg_trgm trigram similarity, picking the top result. The only part that pretends to be an LLM is the SSE pacing that makes replies feel typed.",
    topic: "portfolio/artifact/cosimi-design",
  },

  // --- Tools / AI workflow ---
  "ai tools you use": {
    response:
      "Claude Code, Codex, Cursor, and OpenCode - Claude Code for autonomous work, Cursor for tight in-editor iteration. Ollama and LMStudio for local models, n8n for automation. The AI either drives the loop or stays out of it.",
    topic: "portfolio/artifact/tools-ai-workflow",
  },
  "your terminal": {
    response: "Ghostty plus Fish shell, with Lazygit for almost everything in the git graph.",
    topic: "portfolio/artifact/tools-ai-workflow",
  },

  // --- Contact / coffee chat ---
  "how to contact you": {
    response:
      "Email hvanlong@pm.me or message me on LinkedIn at linkedin.com/in/8bu. GitHub is github.com/8bu.",
    topic: "portfolio/artifact/contact-coffee-chat",
  },
  "coffee chat": {
    response:
      "I'm open to short, async-first chats. Mention what you saw on this page and we can pick a thread to dig into. Email hvanlong@pm.me or message me on LinkedIn and we'll find a time.",
    topic: "portfolio/artifact/contact-coffee-chat",
  },
  "let's chat": {
    response:
      "Sounds good - I'm open to short, async-first chats. Mention what you saw on this page and we can pick a thread. Email hvanlong@pm.me or reach me on LinkedIn at linkedin.com/in/8bu.",
    topic: "portfolio/artifact/contact-coffee-chat",
  },
  github: {
    response: "github.com/8bu",
  },
  linkedin: {
    response: "linkedin.com/in/8bu",
  },

  // --- Personal / life offline ---
  hobbies: {
    response:
      "My interests stay close to the craft - game development, UI/UX, and learning systems languages like Rust and Go on side projects. I'm also self-studying Mandarin at a beginner level.",
  },
  "do you have pets": {
    response: "Yes - one chihuahua.",
  },

  // --- Greetings ---
  hi: { response: "Hey, I'm Long. What would you like to know?" },
  hey: { response: "Hey, I'm Long. What can I help you with?" },
  yo: { response: "Yo - Long here. What's up?" },
  sup: { response: "Hey, Long here. What's up?" },
  hello: { response: "Hello, I'm Long. What would you like to know?" },
  "good morning": { response: "Good morning - Long here. What can I help you with?" },
  "good afternoon": { response: "Good afternoon - Long here. What would you like to know?" },
  "good evening": { response: "Good evening - Long here. What's on your mind?" },

  // --- Thanks ---
  thanks: { response: "You're welcome - no problem at all, glad to help." },
  "thank you": { response: "You're welcome - no problem at all, glad to help." },

  // --- Goodbyes ---
  bye: { response: "Bye - it was good to chat." },
  goodbye: { response: "Goodbye - it was good to chat." },
  "see you": { response: "See you - it was good to chat." },
};

/** Look up a curated answer by normalized message. Null = fall through to retrieve(). */
export function canonicalAnswer(message: string): CanonicalAnswer | null {
  return ENTRIES[normalize(message)] ?? null;
}
