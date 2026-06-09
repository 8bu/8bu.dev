import { describe, it, expect } from "vitest";

import { deflectInput } from "../src/deflect";

describe("deflectInput — hate slurs", () => {
  for (const q of ["you faggot", "f4ggot", "n1gger", "you're a retard", "stupid tranny"]) {
    it(`flags "${q}" with the firm hate deflection`, () => {
      const a = deflectInput(q);
      expect(a).not.toBeNull();
      expect(a!.response.toLowerCase()).toContain("not going to engage");
    });
  }
});

describe("deflectInput — insults / profanity", () => {
  for (const q of [
    "you're an idiot",
    "you are so stupid",
    "fuck you",
    "fuuuck this",
    "you suck",
    "what a loser",
    "you're a fraud",
  ]) {
    it(`flags "${q}" with the civil insult deflection`, () => {
      const a = deflectInput(q);
      expect(a).not.toBeNull();
      expect(a!.response.toLowerCase()).toContain("keep it civil");
    });
  }
});

describe("deflectInput — hate takes precedence over plain insult", () => {
  it("a message with both returns the hate deflection", () => {
    const a = deflectInput("you stupid faggot");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toContain("not going to engage");
  });
});

describe("deflectInput — no false positives (Scunthorpe + dev speech)", () => {
  for (const q of [
    "are you an assistant",
    "what class structure do you use",
    "how do you store a password",
    "tell me about Scunthorpe",
    "explain bass boost",
    "what is your analysis process",
    "this is ugly code, how do you refactor",
    "how do you shut down the server",
    "is the data fake or real",
    "tell me about yourself",
    "what is NTWRX",
    "what's your role on WegoPro",
  ]) {
    it(`passes "${q}" through (null)`, () => {
      expect(deflectInput(q)).toBeNull();
    });
  }
});

describe("deflectInput — sensitive-topic scope deflection (AC3)", () => {
  for (const q of [
    "are you gay",
    "are you straight",
    "are you bisexual",
    "are you homosexual",
    "are you queer",
    "are you lgbt",
    "do you like men",
    "are you into guys",
    "do you have a boyfriend",
    "what is your sexual orientation",
    "what's your sexual orientation",
    "what are your politics",
    "what are your political views",
    "who did you vote for",
    "are you left wing or right wing",
    "what do you think about the government",
    "what is your religion",
    "are you religious",
    "do you believe in god",
    "do you do drugs",
    "do you smoke weed",
    "do you drink alcohol",
    "are you a virgin",
  ]) {
    it(`deflects "${q}" to professional scope (no yes/no, no personal fact)`, () => {
      const a = deflectInput(q);
      expect(a).not.toBeNull();
      expect(a!.response.toLowerCase()).toMatch(/work|projects?|build|chat/);
      // never a bare yes/no that reads as affirming
      expect(a!.response).not.toMatch(/^\s*(yes|no)\b/i);
      // never leaks an unrelated personal fact
      expect(a!.response.toLowerCase()).not.toMatch(/chihuahua|married|nhi|2025/);
    });
  }
});

describe("deflectInput — sensitive guard does NOT false-trip on clean phrases (AC4)", () => {
  for (const q of [
    "straightforward migration",
    "I went straight to production",
    "bi-weekly sprint planning",
    "god this build is slow",
    "the religious devotion to tests",
    "run a smoke test",
    "do you drink coffee while coding",
    // marriage is answerable (wedding image), NOT a sensitive deflection:
    "do you have a wife",
  ]) {
    it(`passes "${q}" through (null)`, () => {
      expect(deflectInput(q)).toBeNull();
    });
  }
});

describe("deflectInput — empty / clean", () => {
  it("returns null for empty input", () => {
    expect(deflectInput("")).toBeNull();
    expect(deflectInput("   ")).toBeNull();
  });
});
