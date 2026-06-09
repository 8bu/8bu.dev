import { describe, it, expect } from "vitest";

import { canonicalAnswer } from "../src/canonical";

describe("interview openers", () => {
  for (const q of [
    "tell me about yourself",
    "tell me about you",
    "walk me through your background",
    "elevator pitch",
    "give me your pitch",
  ]) {
    it(`answers "${q}" in first person, not contact info`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.response).toMatch(/\bI\b|\bI'm\b/);
      expect(a!.response).not.toMatch(/hvanlong@pm\.me/);
      expect(a!.response.toLowerCase()).not.toContain("chihuahua");
    });
  }

  it("profile returns a real profile, not a bare LinkedIn url", () => {
    const a = canonicalAnswer("your profile");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toContain("senior web developer");
  });

  it('handles "I mean your profile?" via the punctuation fallback', () => {
    const a = canonicalAnswer("I mean your profile?");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toContain("senior web developer");
  });

  it("what are you looking for frames next-role intent", () => {
    const a = canonicalAnswer("what are you looking for");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toMatch(/role|next|looking/);
  });
});

describe("interview deflections + grounded answers", () => {
  it("salary deflects to a conversation, no number invented", () => {
    const a = canonicalAnswer("what are your salary expectations");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toMatch(/talk|call|email|depends/);
    expect(a!.response).not.toMatch(/\$\s?\d|\d{2,}\s?(k|usd)/i);
  });

  it("weakness deflects rather than canning a fake flaw", () => {
    const a = canonicalAnswer("what is your biggest weakness");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toMatch(/conversation|call|straight|live/);
  });

  it("failure/conflict deflects to a conversation", () => {
    const a = canonicalAnswer("tell me about a time you failed");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toMatch(/conversation|call|talk|email/);
  });

  it("why leaving gives a real, non-dramatic reason (not just a date)", () => {
    const a = canonicalAnswer("why are you leaving wegopro");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toMatch(/four years|migration|next|right time/);
  });

  it("biggest achievement answers in first person", () => {
    const a = canonicalAnswer("what is your biggest achievement");
    expect(a).not.toBeNull();
    expect(a!.response).toMatch(/\bI\b|\bI'm\b/);
    expect(a!.response).not.toMatch(/\bthey\b|\btheir\b/i);
  });
});

describe("interview working-style / availability (first person)", () => {
  for (const q of [
    "why remote",
    "why do you work remote",
    "how do you approach a new codebase",
    "are you available",
    "do you mentor",
  ]) {
    it(`"${q}" answers in first person`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.response).toMatch(/\bI\b|\bI'm\b|\bI've\b/);
      expect(a!.response).not.toMatch(/\bthey\b|\btheir\b|\byou are\b/i);
    });
  }
});
