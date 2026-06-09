// Pair provenance retained from the curated portfolio corpus.
export type Source = "seed" | "user" | "chat" | "llm";

// Lexical tier ids. "2" | "3" are reserved for the future semantic tier
// (backed by @cosimi/sdk once published); the lexical cascade never emits them.
export type MatchTier = "exact" | "fts" | "trigram" | "2" | "3";

export interface ChatRequest {
  message: string;
  session_id?: string;
  locales?: string[];
  locale?: string;
}

export type ChatStreamEvent =
  | { type: "session"; session_id: string }
  | {
      type: "metadata";
      tier: MatchTier | null;
      confidence: number | null;
      pairId: number | null;
      score: number | null;
      lowConfidence: boolean;
      locale: string | null;
      topic: string | null;
      imageSlug: string | null;
      mood: string | null;
    }
  | { type: "no_match" }
  | { type: "token"; content: string }
  | { type: "done" }
  | { type: "error"; message: string };
