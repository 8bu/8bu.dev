import * as v from "valibot";

const enumEnv = <T extends string>(values: readonly T[], def: T) =>
  v.optional(v.picklist(values), def);

const intEnv = (def: number) =>
  v.pipe(v.optional(v.string(), String(def)), v.decimal(), v.transform(Number), v.integer());

const intRangeEnv = (def: number, min: number) =>
  v.pipe(
    v.optional(v.string(), String(def)),
    v.decimal(),
    v.transform(Number),
    v.integer(),
    v.minValue(min),
  );

// process.env values are always strings; accept canonical "true"/"false" only.
// Refusing other casings is deliberate — silent coercion of typos is how a
// "feature flag I thought was off" becomes a production incident.
const boolEnv = (def: boolean) =>
  v.pipe(
    v.optional(v.string(), String(def)),
    v.picklist(["true", "false"]),
    v.transform((s) => s === "true"),
  );

export const EnvSchema = v.object({
  NODE_ENV: enumEnv(["development", "test", "production"] as const, "development"),
  PORT: intRangeEnv(3010, 1),
  DATABASE_URL: v.pipe(v.string(), v.url()),
  LOG_LEVEL: enumEnv(["debug", "info", "warn", "error"] as const, "info"),

  // When true, the /chat metadata event carries tier/confidence/score/locale/topic.
  // portf needs `topic` for artifact deep-links, so this defaults to true here.
  EXPOSE_MATCH_INSIGHTS: boolEnv(true),

  // SSE token pacing (the SimSimi "typing" feel). Tests set BASE/JITTER to 0.
  SSE_DELAY_MODE: enumEnv(["char", "token"] as const, "token"),
  SSE_DELAY_BASE_MS: intEnv(30),
  SSE_DELAY_JITTER_MS: intEnv(20),
});

export type Env = v.InferOutput<typeof EnvSchema>;

export function loadEnv(): Env {
  return v.parse(EnvSchema, process.env);
}
