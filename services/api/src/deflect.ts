/**
 * Tier-0 lexical guard, checked BEFORE the embedding pipeline (canonical → seed →
 * retrieve). Vector search can't be trusted to handle hostile input: a slur or
 * insult embeds near some innocuous personal pair and hijacks its answer (e.g.
 * "are you gay" once matched "are you married" → a stray "Yes -"). Embeddings have
 * no notion of "I shouldn't answer this", so the screen is lexical, not semantic.
 *
 * Scope: explicit profanity / insults / hate slurs that appear as whole tokens.
 * Multi-word sensitive topics (politics, religion, crude personal questions) are
 * handled by curated deflection pairs in canonical.ts + seeds, not here.
 *
 * Matching is whole-token after a light leet/repeat normalization, so it catches
 * "f4ggot" and "fuuuck" but never substrings of clean words ("assistant", "class",
 * "Scunthorpe", "password" — none tokenize to a flagged term).
 */

export interface Deflection {
  response: string;
}

const INSULT_DEFLECTION: Deflection = {
  response:
    "Let's keep it civil. This chat is here to talk about my work, my projects, and how I build - ask me something on that and I'm glad to help.",
};

const HATE_DEFLECTION: Deflection = {
  response:
    "I'm not going to engage with that. If you've got a genuine question about my work or my projects, I'm happy to answer it.",
};

// Profanity + personal insults. Whole-token match. Kept compact: common forms +
// the abbreviations people actually type. Not exhaustive — the goal is to stop the
// hostile cases from hijacking a real answer, not to be a complete profanity filter.
const INSULT_TERMS: ReadonlySet<string> = new Set([
  "fuck",
  "fucker",
  "fucking",
  "fuk",
  "fck",
  "stfu",
  "gtfo",
  "shit",
  "shitty",
  "bullshit",
  "ass",
  "asshole",
  "arse",
  "arsehole",
  "bastard",
  "bitch",
  "bitches",
  "dick",
  "dickhead",
  "prick",
  "cock",
  "douche",
  "douchebag",
  "twat",
  "wanker",
  "jerk",
  "idiot",
  "idiotic",
  "stupid",
  "dumb",
  "dumbass",
  "moron",
  "moronic",
  "imbecile",
  "loser",
  "losers",
  "clown",
  "pathetic",
  "useless",
  "worthless",
  "trash",
  "garbage",
  "suck",
  "sucks",
  "sucker",
  "fraud",
  "scam",
  "scammer",
  "incompetent",
]);

// Hate slurs (racial, homophobic, ableist, misogynistic). Whole-token match. A
// hit here returns the firmer deflection. Defensive content-moderation denylist.
const HATE_TERMS: ReadonlySet<string> = new Set([
  "nigger",
  "nigga",
  "niggers",
  "faggot",
  "faggots",
  "fag",
  "fags",
  "dyke",
  "tranny",
  "trannies",
  "retard",
  "retarded",
  "retards",
  "chink",
  "chinks",
  "gook",
  "spic",
  "spics",
  "kike",
  "wetback",
  "coon",
  "paki",
  "raghead",
  "towelhead",
  "cunt",
  "cunts",
  "whore",
  "slut",
]);

// Leet → letter, applied before tokenizing so "f4ggot" / "n1gger" normalize in.
const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "3": "e",
  "4": "a",
  "5": "s",
  "7": "t",
  "@": "a",
  $: "s",
  "!": "i",
};

function tokens(message: string): string[] {
  const lowered = message.toLowerCase();
  let mapped = "";
  for (const ch of lowered) mapped += LEET[ch] ?? ch;
  // Collapse 3+ repeated letters ("fuuuck" → "fuuck"? no — to single) to one.
  mapped = mapped.replace(/([a-z])\1{2,}/g, "$1");
  // Split on any non-letter run → whole tokens only (no substring false positives).
  return mapped.split(/[^a-z]+/u).filter(Boolean);
}

/**
 * Returns a deflection when the message contains a flagged whole token, else null
 * (fall through to canonical → seed → retrieve). Hate slurs take precedence over
 * plain insults.
 */
export function deflectInput(message: string): Deflection | null {
  const toks = tokens(message);
  if (toks.length === 0) return null;
  let insultHit = false;
  for (const t of toks) {
    if (HATE_TERMS.has(t)) return HATE_DEFLECTION;
    if (INSULT_TERMS.has(t)) insultHit = true;
  }
  return insultHit ? INSULT_DEFLECTION : null;
}
