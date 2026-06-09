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

describe("deflectInput — empty / clean", () => {
  it("returns null for empty input", () => {
    expect(deflectInput("")).toBeNull();
    expect(deflectInput("   ")).toBeNull();
  });
});
