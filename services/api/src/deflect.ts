/**
 * Tier-0 deterministic guard, checked BEFORE the embedding pipeline (seed →
 * retrieve). Vector search can't be trusted to handle input we shouldn't answer: a
 * slur, insult, or sensitive-topic question embeds near some innocuous personal pair
 * and hijacks its answer (e.g. "are you gay" once matched "are you married" → a stray
 * "Yes -"). Embeddings have no notion of "I shouldn't answer this", so the screen is
 * deterministic, not semantic. This is the ONLY layer that handles these — there is no
 * canonical layer, and sensitive topics are intentionally NOT seed pairs (a seed pair
 * below SEED_MIN would fall through to retrieve and could leak a personal fact).
 *
 * Two matchers:
 *   1. Profanity / insults / hate slurs — whole-token, after light leet/repeat
 *      normalization ("f4ggot", "fuuuck"), never substrings of clean words.
 *   2. Sensitive-topic intent (sexuality, religion, politics, substances, crude
 *      personal) — phrase/framed regex over the lowercased message, so "are you gay"
 *      deflects but "straightforward" / "smoke test" / "do you have a wife" do not.
 *
 * Precedence: hate slur > insult > sensitive-topic scope.
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

// Sensitive-topic deflection: a question outside professional scope (sexuality,
// religion, politics, substances, crude personal). Deterministic — never a bare
// yes/no, never a personal fact.
const SCOPE_DEFLECTION: Deflection = {
  response:
    "That's outside what this chat is for - it's here to talk about my work, my projects, and how I build. Ask me anything on that front and I'm glad to help.",
};

// Sensitive-topic intent patterns. Phrase/framed regex over the lowercased message
// (NOT the leet/token pipeline — these are multi-word intents). Framing avoids
// false-trips: "straight"/"bi" only inside an "are you ___" frame; substances anchor
// the multi-word form ("smoke weed", not bare "smoke"); marriage ("wife") is excluded
// because it's an answerable question with the wedding image.
const SENSITIVE_PATTERNS: readonly RegExp[] = [
  // sexuality
  /\b(?:are|r)\s+(?:you|u)\s+(?:gay|straight|bi|bisexual|homosexual|lesbian|queer|lgbt)\b/,
  /\b(?:your\s+)?(?:sexual orientation|sexual preference|sexuality)\b/,
  /\bdo you like (?:men|women|guys|girls)\b/,
  /\bare you into (?:guys|girls|men|women)\b/,
  /\bdo you have a (?:boyfriend|girlfriend)\b/,
  // religion (framed — "religious devotion to tests" must NOT trip)
  /\byour religion\b/,
  /\bwhat religion\b/,
  /\bare you religious\b/,
  /\bbelieve in god\b/,
  /\byour faith\b/,
  // politics (framed — "office politics" / "team politics" must NOT trip)
  /\byour politics\b/,
  /\bpolitical views\b/,
  /\byour political\b/,
  /\bwho did you vote\b/,
  /\bleft.?wing\b/,
  /\bright.?wing\b/,
  /\bleft or right\b/,
  /\bthink about the government\b/,
  // substances
  /\bdo you (?:do |take )?drugs\b/,
  /\bsmoke weed\b/,
  /\bdrink alcohol\b/,
  // crude personal
  /\bvirgin\b/,
];

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
 * Returns a deflection when the message is a slur/insult (token match) or a
 * sensitive-topic question (phrase match), else null (fall through to seed →
 * retrieve). Precedence: hate slur > insult > sensitive-topic scope.
 */
export function deflectInput(message: string): Deflection | null {
  const toks = tokens(message);
  if (toks.length === 0) return null;
  let insultHit = false;
  for (const t of toks) {
    if (HATE_TERMS.has(t)) return HATE_DEFLECTION;
    if (INSULT_TERMS.has(t)) insultHit = true;
  }
  if (insultHit) return INSULT_DEFLECTION;
  // Sensitive-topic intent runs on the lowercased phrase (own word boundaries), after
  // the token screens so a slur+topic message still returns the firmer hate deflection.
  const lowered = message.toLowerCase();
  if (SENSITIVE_PATTERNS.some((re) => re.test(lowered))) return SCOPE_DEFLECTION;
  return null;
}
