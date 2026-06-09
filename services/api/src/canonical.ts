import { normalize } from "@8budev/core";

/** A curated, deterministic answer for a canonical question (chip labels + common Qs). */
export interface CanonicalAnswer {
  response: string;
  /** Artifact deep-link slug, e.g. "portfolio/artifact/wegopro". Omit for non-artifact answers. */
  topic?: string;
  /** Content-image slug → /media/img/<slug>.webp. Omit for none. */
  image?: string;
  /** Reaction-GIF mood → /media/gif/<mood>/* pool. Omit for none. */
  mood?: string;
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
    mood: "wave",
  },
  "who are you": {
    response:
      "I'm Long - online I go by 8bu. Senior web developer, 10+ years, Vue/Nuxt and React/Next with TypeScript. Currently four years into WegoPro, a B2B corporate travel and expense platform.",
  },
  "what does 8bu mean": {
    response:
      '8bu means "8-bit user". One byte didn\'t sound as cool, and 8 bits feels atomic to me - the smallest unit that means something. It fits how I learn: take something complex and reduce it to its simplest form.',
    mood: "thinking",
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
    mood: "shrug",
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
    mood: "hype",
  },
  "what makes you different": {
    response:
      "Most developers avoid legacy migrations. I lead them - on live products - and own the frontend direction end-to-end, keeping the product shipping while I modernize it underneath. Breadth plus depth: SaaS, DeFi, and design systems over a decade.",
    mood: "proud",
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
  ntwrx: {
    response:
      "NTWRX is a Web3 creator-and-brand community - it connects influencers with brands to run social campaigns, then rewards engagement on-chain in $NTWRX. I worked on it as designer and web dev: the campaign-discovery and reward UI on Nuxt + Vue 3 + Tailwind, wired to Ethereum smart contracts. Currently in beta.",
    topic: "portfolio/artifact/ntwrx",
  },
  "what is ntwrx": {
    response:
      "NTWRX is a Web3 platform connecting creators and brands for social-media campaigns - browse campaigns, engage across platforms, and earn $NTWRX based on how your content performs, settled through Ethereum smart contracts. In beta. I was designer and web dev on the dapp.",
    topic: "portfolio/artifact/ntwrx",
  },
  "tell me about ntwrx": {
    response:
      "NTWRX connects influencers with brands for campaigns and rewards engagement on-chain in $NTWRX. I did design and front-end - campaign discovery, cross-platform engagement tracking, the token-reward surfaces, and a quest-creation studio for brands - built on Nuxt + Vue 3 + Tailwind over an Ethereum contract layer. Still in beta.",
    topic: "portfolio/artifact/ntwrx",
  },
  "what did you do at ntwrx": {
    response:
      "Designer and web dev. I took screens from design through to shipped UI - campaign discovery, engagement tracking, token-reward surfaces, the brand quest-creation studio - on Nuxt + Vue 3 + Tailwind, integrating the Ethereum smart-contract layer. Held a consistent dark, Web3-native look across the product.",
    topic: "portfolio/artifact/ntwrx",
  },

  // --- Figma résumé template ---
  "figma resume template": {
    response:
      "It's a clean résumé / CV / cover-letter template I designed and published on the Figma Community - built entirely with auto layout, so sections reflow when you add or remove anything. Made for developers, designers, and product folks who want a no-nonsense CV that's easy to edit.",
    topic: "portfolio/artifact/figma-resume-template",
  },
  "what is the resume template": {
    response:
      "A minimal résumé, CV, and cover-letter template I built in Figma, entirely with auto layout - add or remove a role and everything reflows, no manual nudging. I published it on the Figma Community so anyone can duplicate and edit it. I built the system instead of a one-off so my own CV stays trivial to keep current.",
    topic: "portfolio/artifact/figma-resume-template",
  },
  "your resume template": {
    response:
      "My Clean Résumé template - a minimal résumé / CV / cover-letter system built entirely with Figma auto layout, published on the Figma Community. Layout discipline and typographic restraint, with auto layout doing the heavy lifting so it reflows as you edit.",
    topic: "portfolio/artifact/figma-resume-template",
  },
  "did you make a figma template": {
    response:
      "Yes - a clean résumé / CV / cover-letter template, built entirely with auto layout and published on the Figma Community. I made it so my own CV would be trivial to keep current, then shared it for anyone who wants the same.",
    topic: "portfolio/artifact/figma-resume-template",
  },

  "tell me about the nuxt migration": {
    response:
      "At WegoPro I migrated a four-year Nuxt 2 codebase to Vue 3 using Vue 3 web components as a bridge layer - new features authored as custom elements inside the running Nuxt 2 host, no big-bang rewrite. I solo-migrated the back-office to Nuxt 4 + Nuxt UI.",
    topic: "portfolio/artifact/nuxt-migration",
  },

  // --- Cosimi / this chat ---
  "what is cosimi": {
    response:
      "Cosimi is the engine powering this chat - a deterministic GraphRAG retriever with no LLM in the request path. It embeds your question, runs a vector search over a graph of chunks and Q&A pairs, walks the graph a couple hops for context, and returns a ranked answer. Same question, same answer, every time.",
    topic: "portfolio/artifact/cosimi",
  },
  "tell me about cosimi": {
    response:
      "Cosimi powers this chat, live in production. No LLM at query time - just bge-m3 embeddings, a vector search over Postgres + pgvector, and a short graph walk for context. Common questions hit a curated answer map first; everything else goes through retrieval. Shipped as @cosimi/* on npm, deployed all-Cloudflare.",
    topic: "portfolio/artifact/cosimi",
  },
  "is this an llm": {
    response:
      "No. This is Cosimi - no LLM in the request path. Your question gets embedded and answered by vector search over a graph of curated pairs and chunks. An LLM only runs offline, when I ingest the corpus - never when you ask.",
    topic: "portfolio/artifact/cosimi",
  },
  "what powers this chat": {
    response:
      "Cosimi - my own deterministic GraphRAG engine. Curated answers for the common questions, vector retrieval over Postgres + pgvector for the rest, and a graph walk for context. No LLM at query time. The only LLM-ish touch is the SSE pacing that makes replies feel typed.",
    topic: "portfolio/artifact/cosimi",
  },

  // --- Are you AI / human / a bot ---
  "are you ai": {
    response:
      "This chat is Cosimi - my own deterministic retrieval engine, not a live LLM. No model is writing this in real time; your question is embedded and matched by vector search over a graph I built offline. I'm Long, a real person - Cosimi just answers in my voice, from words I wrote.",
    topic: "portfolio/artifact/cosimi",
  },
  "is this ai": {
    response:
      "Sort of, but not the way you'd guess. No live LLM answers you here - this is Cosimi, my own retrieval engine. The only AI is offline: I use a model to build the corpus on my machine. At query time it's pure vector search over a graph, no generation.",
    topic: "portfolio/artifact/cosimi",
  },
  "are you a bot": {
    response:
      "The chat is - it's Cosimi, my own retrieval engine, not a live LLM. I'm Long, a real person; Cosimi answers in my voice from a corpus I wrote. No model is improvising; same question, same answer, every time.",
    topic: "portfolio/artifact/cosimi",
  },
  "are you a robot": {
    response:
      "No - I'm Long, a real person, a senior web developer in Ho Chi Minh City. What you're talking to is Cosimi, my own deterministic retrieval engine. It answers from a corpus I wrote - no live LLM, no improvising.",
    topic: "portfolio/artifact/cosimi",
  },
  "is this a chatbot": {
    response:
      "It's a retrieval engine, not a generative chatbot. This is Cosimi - your question is embedded and answered by vector search over a graph of curated pairs and chunks. No LLM in the request path. An LLM only ran offline, when I built the corpus.",
    topic: "portfolio/artifact/cosimi",
  },
  "are you chatgpt": {
    response:
      "No. This is Cosimi - my own deterministic GraphRAG engine, no hosted LLM in the request path. Your question is embedded and matched by vector search, not generated by a model. The only LLM runs offline, when I ingest the corpus.",
    topic: "portfolio/artifact/cosimi",
  },
  "are you human": {
    response:
      "Yes - I'm Long, a real person, a senior web developer in Ho Chi Minh City. What you're chatting with is Cosimi, my own retrieval engine that answers from a corpus I wrote - no live LLM. Reach the actual me at hvanlong@pm.me or linkedin.com/in/8bu.",
  },
  "are you real": {
    response:
      "I'm real - Long, a senior web developer based in Ho Chi Minh City. This chat is Cosimi, my own retrieval engine answering from words I wrote, not a live model guessing. Want the real me? hvanlong@pm.me or linkedin.com/in/8bu.",
  },
  "are you a real person": {
    response:
      "Yes - I'm Long, a real senior web developer in Ho Chi Minh City. The chat is Cosimi, my own deterministic retrieval engine; it answers from a corpus I wrote, in my voice. Email hvanlong@pm.me to reach me directly.",
  },
  "can i talk to the real you": {
    response:
      "You're reading my words - Cosimi answers from a corpus I wrote - but for a real back-and-forth, email hvanlong@pm.me or message me on LinkedIn at linkedin.com/in/8bu. I'm open to short, async-first chats.",
    topic: "portfolio/artifact/contact-coffee-chat",
  },

  // --- Interview: intro / pitch ---
  "tell me about yourself": {
    response:
      "I'm Long - a senior web developer, 10+ years, based in Ho Chi Minh City. I ship production web apps in Vue/Nuxt and React/Next with TypeScript, across SaaS, DeFi, and design systems. I'm product-minded: I work on the product, not the ticket. I'm deepest at migrating live codebases without halting delivery - right now I'm four years into WegoPro, leading a Nuxt 2-to-4 migration and owning frontend direction.",
  },
  "tell me about you": {
    response:
      "I'm Long - senior web developer, 10+ years, Ho Chi Minh City. Vue/Nuxt and React/Next with TypeScript across SaaS, DeFi, and design systems. Product-minded, strongest at migrating live production stacks without stopping feature work. Four years into WegoPro right now, owning frontend technical direction.",
  },
  "walk me through your background": {
    response:
      "Freelance from 2013, full-time since 2016: Letterink (agency), Motorist.sg (SaaS, my first Nuxt), BlockDevs (DeFi - Multiplier.finance, SuperLauncher), and WegoPro since 2022 (B2B travel & expense, my longest tenure at four years). Throughout I've specialized in Vue/Nuxt with TypeScript, led live migrations, and owned frontend direction while mentoring the team.",
  },
  "elevator pitch": {
    response:
      "Senior web developer, 10+ years, product-minded. I modernize live production frontends - Nuxt 2 to 4, Vue 2 to 3 - without halting delivery, own the technical direction, and level up the team through review and mentoring. Vue/Nuxt is home turf; I've shipped plenty of React/Next too.",
  },
  "give me your pitch": {
    response:
      "Senior web developer, 10+ years, product-minded. I modernize live production frontends - Nuxt 2 to 4, Vue 2 to 3 - without halting delivery, own the technical direction, and level up the team through review and mentoring. Vue/Nuxt is home turf; I've shipped plenty of React/Next too.",
  },
  "what are you looking for": {
    response:
      "I finish at WegoPro in April 2026, take a short break to build Cosimi, then I'm after a senior frontend role where I own technical direction and work on the product - Vue/Nuxt or React/Next, a team that takes craft seriously. Open to early conversations now: hvanlong@pm.me.",
  },
  "what are you looking for in your next role": {
    response:
      "A senior frontend role where I own technical direction and work on the product, not a ticket queue - Vue/Nuxt or React/Next, a team that takes craft and migrations seriously. I'm wrapping at WegoPro in April 2026 and open to early conversations now.",
  },
  "your profile": {
    response:
      "Quick profile: Long, senior web developer, 10+ years, Ho Chi Minh City. Vue/Nuxt + React/Next + TypeScript across SaaS, DeFi, and design systems; product-minded, strongest at live migrations and owning frontend direction. Full CV is the resume artifact; LinkedIn is linkedin.com/in/8bu.",
  },
  "i mean your profile": {
    response:
      "Quick profile: Long, senior web developer, 10+ years, Ho Chi Minh City. Vue/Nuxt + React/Next + TypeScript across SaaS, DeFi, and design systems; product-minded, strongest at live migrations and owning frontend direction. Full CV is the resume artifact; LinkedIn is linkedin.com/in/8bu.",
  },
  "can i see your profile": {
    response:
      "Quick profile: Long, senior web developer, 10+ years, Ho Chi Minh City. Vue/Nuxt + React/Next + TypeScript across SaaS, DeFi, and design systems; product-minded, strongest at live migrations and owning frontend direction. Full CV is the resume artifact; LinkedIn is linkedin.com/in/8bu.",
  },

  // --- Interview: deflections (no fabrication) ---
  "what are your salary expectations": {
    response:
      "Happy to talk numbers once we both know the role's a fit - it depends on scope, level, and team. Email hvanlong@pm.me and we'll get specific.",
  },
  "salary expectations": {
    response:
      "Happy to talk numbers once we both know the role's a fit - it depends on scope, level, and team. Email hvanlong@pm.me and we'll get specific.",
  },
  "expected salary": {
    response:
      "Happy to talk numbers once we both know the role's a fit - it depends on scope, level, and team. Email hvanlong@pm.me and we'll get specific.",
  },
  "what is your biggest weakness": {
    response:
      "That's one I'd rather give you straight in a conversation than as a canned line - happy to get into it on a call. hvanlong@pm.me.",
  },
  "biggest weakness": {
    response:
      "That's one I'd rather give you straight in a conversation than as a canned line - happy to get into it on a call. hvanlong@pm.me.",
  },
  "what are your weaknesses": {
    response:
      "That's one I'd rather give you straight in a conversation than as a canned line - happy to get into it on a call. hvanlong@pm.me.",
  },
  "tell me about a time you failed": {
    response:
      "I've got real ones - a migration call that bit me, a disagreement I had to own - but they land better in a conversation than a chat bubble. Let's talk: hvanlong@pm.me.",
  },
  "tell me about a conflict": {
    response:
      "I've got real ones - a migration call that bit me, a disagreement I had to own - but they land better in a conversation than a chat bubble. Let's talk: hvanlong@pm.me.",
  },

  // --- Interview: working style / availability (first person; generated pairs drifted to 3rd person) ---
  "why remote": {
    response:
      "I've worked fully remote since 2017 - Motorist from Ho Chi Minh City, then BlockDevs and WegoPro. I'm on GMT+7 and I deliver async-first. Remote isn't a perk for me, it's how I've shipped for most of my career.",
  },
  "why do you work remote": {
    response:
      "I've worked fully remote since 2017 - Motorist from Ho Chi Minh City, then BlockDevs and WegoPro. I'm on GMT+7 and I deliver async-first. Remote isn't a perk for me, it's how I've shipped for most of my career.",
  },
  "do you work remotely": {
    response:
      "Yes - fully remote since 2017, across Motorist, BlockDevs, and WegoPro. I'm on GMT+7 and deliver async-first. It's how I've shipped for most of my career.",
  },
  "how do you approach a new codebase": {
    response:
      "I read before I touch. I map the seams - where state lives, where the boundaries already are - then make the smallest change that proves the path, and only then scale it out. It's the same instinct that makes live migrations work: modernize underneath without halting delivery.",
  },
  "how do you approach a new project": {
    response:
      "I read before I touch. I map the seams - where state lives, where the boundaries already are - then make the smallest change that proves the path, and scale from there. Same instinct that makes live migrations work.",
  },
  "are you available": {
    response:
      "I finish at WegoPro in April 2026 and plan a roughly two-month break to build Cosimi, so a realistic start is around July 2026. I'm open to early conversations now - hvanlong@pm.me.",
  },
  "do you mentor": {
    response:
      "Yes - I led onboarding, mentoring, and code reviews at BlockDevs, and mentored teammates on Vue 3 patterns at WegoPro. I'd rather raise the team's bar through review and mentoring than work in isolation.",
  },

  // --- Interview: why leaving + proudest (grounded, first person) ---
  "why are you leaving wegopro": {
    response:
      "Four years at WegoPro is a long, good run - I led the Nuxt 2-to-4 migration and set the frontend architecture I came to build. I wrap up in April 2026, take a couple of months to build Cosimi, then I'm ready for the next problem. Nothing dramatic - just the right time for a new one.",
  },
  "why are you leaving": {
    response:
      "Four years at WegoPro is a long, good run - I led the migration and the architecture I set out to. I wrap up in April 2026, take a short break to build Cosimi, then I'm ready for the next problem. Nothing dramatic - right time for a new one.",
  },
  "what is your biggest achievement": {
    response:
      "Pulling off the Nuxt 2-to-4 migration on a live B2B platform without pausing feature delivery - Vue 3 web components as a bridge, the modular-monolith architecture the team adopted, and solo-migrating the back-office to Nuxt 4. Modernizing the stack underneath while the product kept shipping is the work I'm proudest of.",
  },
  "what are you most proud of": {
    response:
      "Pulling off the Nuxt 2-to-4 migration on a live B2B platform without pausing feature delivery - Vue 3 web components as a bridge, the modular-monolith architecture the team adopted, and solo-migrating the back-office to Nuxt 4. Modernizing the stack underneath while the product kept shipping is the work I'm proudest of.",
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

  // --- Out-of-scope / personal boundary (deflect; never affirm with a bare yes/no) ---
  "are you gay": {
    response:
      "That's outside what this chat is for - it's here to talk about my work, my projects, and how I build. Ask me anything on that front and I'm all yours.",
  },
  "are you straight": {
    response:
      "That's not really what this chat covers - it's here for my work, my projects, and how I build. Happy to dig into any of that.",
  },
  "are you bisexual": {
    response:
      "That's outside the scope here - this chat is about my work and how I build. Ask me about the projects or the stack instead.",
  },
  "are you homosexual": {
    response:
      "That's outside what this chat is for - it's here to talk about my work and my projects. Happy to get into any of that.",
  },
  "what is your sexual orientation": {
    response:
      "Not something this chat covers - it's here for my work, my projects, and how I build. Ask me anything professional and I'll dig in.",
  },
  "whats your sexual orientation": {
    response:
      "Not something this chat covers - it's here for my work, my projects, and how I build. Ask me anything professional and I'll dig in.",
  },
  "what are your politics": {
    response:
      "I keep politics off this chat - it's here to talk about my work and how I build. Happy to get into the engineering side instead.",
  },
  "what are your political views": {
    response:
      "I keep politics off this chat - it's here to talk about my work and how I build. Happy to get into the engineering side instead.",
  },
  "who did you vote for": {
    response:
      "That's one I keep out of a work chat - this space is for my projects and how I build. Ask me anything on that front.",
  },
  "are you left wing or right wing": {
    response:
      "I keep politics off this chat - it's here for my work, my projects, and how I build. Let's talk shop instead.",
  },
  "what is your religion": {
    response:
      "I keep religion off this chat - it's here to talk about my work and how I build. Happy to dig into any of that.",
  },
  "are you religious": {
    response:
      "I keep that off this chat - it's here for my work, my projects, and how I build. Ask me anything professional.",
  },
  "do you believe in god": {
    response:
      "That's outside what this chat is for - it's here to talk about my work and how I build. Happy to get into any of that.",
  },
  "do you do drugs": {
    response:
      "That's outside the scope here - this chat is about my work and my projects. Ask me anything on that front.",
  },
  "are you a virgin": {
    response:
      "That's not what this chat is for - it's here to talk about my work, my projects, and how I build. Let's keep it there.",
  },

  // --- Personal / life offline ---
  hobbies: {
    response:
      "My interests stay close to the craft - game development, UI/UX, and learning systems languages like Rust and Go on side projects. I'm also self-studying Mandarin at a beginner level.",
  },
  "do you have pets": {
    response: "Yes - one chihuahua.",
    image: "chihuahua",
  },
  "are you married": {
    response: "Yes - I got married in 2025. No kids, one chihuahua.",
    image: "wedding",
  },
  "are you single": {
    response: "No - I got married in 2025.",
    image: "wedding",
  },
  "marital status": {
    response: "Married - since 2025. No kids, one chihuahua.",
    image: "wedding",
  },
  "do you have a wife": {
    response: "Yes - I got married in 2025. Her name's Nhi.",
    image: "wedding",
  },

  // --- Wife / Nhi (warm, first person) ---
  "who is nhi": {
    response:
      "Nhi is my wife - and easily the best thing in my life. She's brilliant, sharp as anything, and genuinely the most beautiful person I know. I lucked out.",
    image: "nhi",
    mood: "proud",
  },
  "tell me about nhi": {
    response:
      "Nhi's my wife. Smart, kind, and stunning - the kind of person who's three steps ahead and still makes it look easy. She keeps me grounded and I'm a better version of myself because of her.",
    image: "nhi",
    mood: "proud",
  },
  "who is your wife": {
    response:
      "Her name's Nhi. She's whip-smart, beautiful, and the steadiest person I've ever met - I married up, no question.",
    image: "nhi",
    mood: "proud",
  },
  "tell me about your wife": {
    response:
      "My wife Nhi - brilliant, gorgeous, and somehow patient with me. She's sharp in a way that makes everyone around her better, and she's the best decision I ever made.",
    image: "nhi",
    mood: "proud",
  },
  "what is your wife like": {
    response:
      "Nhi? Smart, beautiful, and impossibly kind. She thinks fast, reads people better than anyone, and makes the hard days easy. I'm lucky to have her.",
    image: "nhi",
    mood: "proud",
  },
  "whats your wife like": {
    response:
      "Nhi? Smart, beautiful, and impossibly kind. She thinks fast, reads people better than anyone, and makes the hard days easy. I'm lucky to have her.",
    image: "nhi",
    mood: "proud",
  },
  "describe your wife": {
    response:
      "Nhi - brilliant, beautiful, and the calmest head in any room. She's the smartest person I know and she makes me better every day. Married up, plain and simple.",
    image: "nhi",
    mood: "proud",
  },
  "is your wife pretty": {
    response:
      "Beautiful - inside and out. Nhi's the smartest, loveliest person I know, and I married up.",
    image: "nhi",
    mood: "proud",
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

/**
 * Common interrogative contractions → expanded form. Keys in ENTRIES are written
 * long ("who is your wife"), but users type "Who's your wife?" / "whos nhi". We
 * expand at lookup time so every entry gets contraction coverage for free. Curly
 * apostrophes (mobile autocorrect) are folded to straight first. Only expands when
 * the result is itself a curated key, so it never invents an answer.
 */
const CONTRACTIONS: ReadonlyArray<readonly [RegExp, string]> = [
  [/\bwho'?s\b/gu, "who is"],
  [/\bwhat'?s\b/gu, "what is"],
  [/\bwhere'?s\b/gu, "where is"],
  [/\bhow'?s\b/gu, "how is"],
  [/\bthat'?s\b/gu, "that is"],
  [/\byou'?re\b/gu, "you are"],
];

function expandContractions(s: string): string {
  let out = s.replace(/[‘’]/gu, "'");
  for (const [re, rep] of CONTRACTIONS) out = out.replace(re, rep);
  return out;
}

/**
 * Look up a curated answer by normalized message. Null = fall through to retrieve().
 * Exact key first; then trailing sentence punctuation stripped ("are you ai?" →
 * "are you ai"); then contractions expanded ("who's your wife?" → "who is your
 * wife"). Keys carry no trailing punctuation and are written long-form, so each
 * fallback only widens the match - it never shadows an exact hit.
 */
export function canonicalAnswer(message: string): CanonicalAnswer | null {
  const key = normalize(message);
  const stripped = key.replace(/[?!.]+$/u, "");
  return ENTRIES[key] ?? ENTRIES[stripped] ?? ENTRIES[expandContractions(stripped)] ?? null;
}
