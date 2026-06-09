import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";

// Embedder spy: assert embed() is NOT called on the throttled request (AC #1).
const { embedSpy } = vi.hoisted(() => ({ embedSpy: vi.fn() }));

vi.mock("../src/lib/embedder", async () => {
  const { unitVec } = await import("./helpers");
  return {
    resolveEmbedder: () => ({
      dimension: 1024,
      embed: (texts: string[]) => {
        embedSpy();
        return Promise.resolve(texts.map(() => unitVec(0)));
      },
    }),
    runWithAi: <T>(_ai: unknown, fn: () => T): T => fn(),
  };
});

const { app } = await import("../src/app");
const { closeDb } = await import("@cosimi/adapter-postgres");
const { resetCorpus } = await import("./helpers");

function postChat(sid: string) {
  return app.fetch(
    new Request("http://localhost/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Session-Id": sid },
      body: JSON.stringify({ message: "hello there", locales: ["en", "und"], locale: "en" }),
    }),
  );
}

beforeEach(async () => {
  await resetCorpus();
  embedSpy.mockClear();
});
afterAll(async () => {
  await closeDb();
});

describe("POST /chat rate limit (in-memory fallback, no CF binding)", () => {
  it("first 20 reach runChat; 21st → 429 + Retry-After, embedder NOT called", async () => {
    const sid = "11111111-1111-4111-8111-111111111111";
    for (let i = 0; i < 20; i++) {
      const res = await postChat(sid);
      expect(res.status).toBe(200);
      await res.text(); // drain the SSE body
    }
    // Each non-throttled turn embeds MORE than once (seedAnswer at
    // chat-handler.ts:154 + retrieve at :105). Do NOT hard-code a literal —
    // capture the count and assert the throttled request adds zero.
    const embedsBefore = embedSpy.mock.calls.length;
    expect(embedsBefore).toBeGreaterThan(0); // sanity: good requests did embed

    const limited = await postChat(sid);
    expect(limited.status).toBe(429);
    const retryAfter = Number(limited.headers.get("Retry-After"));
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
    expect(await limited.json()).toEqual({ error: "rate_limited" });
    // The throttled request did NOT embed — count unchanged (AC #1 cost property).
    expect(embedSpy.mock.calls.length).toBe(embedsBefore);
  });

  it("GET /healthz is unaffected by request volume (not wrapped by rateLimit)", async () => {
    const sid = "22222222-2222-4222-8222-222222222222";
    for (let i = 0; i < 25; i++) await postChat(sid); // blow past the limit on /chat
    const health = await app.fetch(new Request("http://localhost/healthz"));
    expect(health.status).toBe(200);
  });
});
