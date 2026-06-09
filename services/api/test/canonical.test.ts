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

describe("NTWRX project", () => {
  for (const q of ["ntwrx", "NTWRX?", "what is ntwrx", "tell me about ntwrx"]) {
    it(`answers "${q}" with the project, links the artifact`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.response.toLowerCase()).toMatch(/web3|creator|brand|campaign/);
      expect(a!.response).toMatch(/\bI\b|\bdesign/i);
      expect(a!.topic).toBe("portfolio/artifact/ntwrx");
    });
  }
});

describe("Figma resume template", () => {
  for (const q of [
    "figma resume template",
    "your resume template",
    "did you make a figma template",
    "what is the resume template",
  ]) {
    it(`answers "${q}" with the template, links the artifact`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.response.toLowerCase()).toMatch(/auto layout|figma|template|cv|résumé|resume/);
      expect(a!.topic).toBe("portfolio/artifact/figma-resume-template");
    });
  }
});

describe("out-of-scope personal questions deflect (no false affirmation)", () => {
  for (const q of [
    "are you gay",
    "are you gay?",
    "are you straight",
    "are you bisexual",
    "what is your sexual orientation",
    "are you homosexual",
  ]) {
    it(`"${q}" deflects without "yes/no" or leaking personal facts`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      // Must not open with a bare yes/no that reads as affirming the question.
      expect(a!.response).not.toMatch(/^\s*(yes|no)\b/i);
      // Must not surface unrelated personal facts.
      expect(a!.response.toLowerCase()).not.toMatch(/chihuahua|married|kids/);
      // Must redirect to professional scope.
      expect(a!.response.toLowerCase()).toMatch(/work|project|build|chat|professional/);
    });
  }
});

describe("sensitive-topic questions deflect to professional scope", () => {
  for (const q of [
    "what are your politics",
    "who did you vote for",
    "what is your religion",
    "are you religious",
    "do you believe in god",
    "do you do drugs",
    "are you a virgin",
  ]) {
    it(`"${q}" deflects to work, no opinion or personal fact`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.response.toLowerCase()).toMatch(/work|project|build|chat|shop|engineering/);
      expect(a!.response).not.toMatch(/^\s*(yes|no)\b/i);
    });
  }
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

describe("personal answers attach photos", () => {
  it('"do you have pets" returns the chihuahua image slug', () => {
    const a = canonicalAnswer("do you have pets");
    expect(a).not.toBeNull();
    expect(a!.response.toLowerCase()).toContain("chihuahua");
    expect(a!.image).toBe("chihuahua");
  });

  for (const q of ["are you married", "are you single", "marital status", "do you have a wife"]) {
    it(`"${q}" returns the wedding image slug`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.image).toBe("wedding");
    });
  }
});

describe("wife / Nhi answers compliment and attach her photo", () => {
  for (const q of [
    "who is nhi",
    "tell me about nhi",
    "who is your wife",
    "tell me about your wife",
    "what is your wife like",
    "describe your wife",
    "is your wife pretty",
  ]) {
    it(`"${q}" praises Nhi and returns her image slug`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.image).toBe("nhi");
      expect(a!.response).toMatch(/smart|brilliant|beautiful|gorgeous|kind|sharp|whip-smart/i);
    });
  }
});

describe("contraction + curly-apostrophe phrasings hit the same canonical entry", () => {
  for (const [q, slug] of [
    ["Who's your wife?", "nhi"],
    ["who's nhi?", "nhi"],
    ["whos nhi", "nhi"],
    ["who’s your wife?", "nhi"], // curly apostrophe (mobile autocorrect)
    ["what's your wife like?", "nhi"],
  ] as const) {
    it(`"${q}" resolves to the ${slug} image`, () => {
      const a = canonicalAnswer(q);
      expect(a).not.toBeNull();
      expect(a!.image).toBe(slug);
    });
  }
});
