/**
 * Stack "type-case" content for the editorial home.
 *
 * The one home section with no existing data source (Work ← projects catalog,
 * Writing ← Substack, Contact CV ← resume). Ported from the
 * `8bu Portfolio.dc.html` prototype's `stacks` array. Static by design — this
 * is authored content, not derived from the corpus.
 */
export interface StackItem {
  n: string;
  y?: string;
}
export interface StackGroup {
  group: string;
  items: StackItem[];
}

export const STACK_GROUPS: readonly StackGroup[] = [
  {
    group: "Data & infra",
    items: [{ n: "PostgreSQL" }, { n: "Redis" }, { n: "Cloudflare" }, { n: "AWS serverless" }],
  },
  {
    group: "Languages",
    items: [
      { n: "TypeScript", y: "7y" },
      { n: "JavaScript", y: "7y" },
      { n: "Go", y: "<1y" },
      { n: "Rust", y: "<1y" },
    ],
  },
  {
    group: "Front-end",
    items: [
      { n: "Vue", y: "6y" },
      { n: "Nuxt", y: "6y" },
      { n: "React / Next", y: "3y" },
      { n: "Tailwind", y: "5y" },
      { n: "SCSS", y: "7y" },
      { n: "Astro", y: "soon" },
    ],
  },
  {
    group: "Back-end",
    items: [
      { n: "Node", y: "6y" },
      { n: "Express", y: "5y" },
      { n: "Nest", y: "2y" },
      { n: "Hono", y: "2y" },
      { n: "GraphQL" },
    ],
  },
  {
    group: "Blockchain / Web3",
    items: [{ n: "Ethers" }, { n: "WalletConnect" }, { n: "The Graph" }, { n: "Web3.js" }],
  },
  {
    group: "Testing & AI",
    items: [{ n: "Playwright" }, { n: "Vitest" }, { n: "Cypress" }, { n: "Claude · Cursor" }],
  },
] as const;
