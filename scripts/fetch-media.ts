/**
 * Build-time reaction-GIF pipeline. Queries Tenor, downloads each GIF, converts
 * to a muted autoplay mp4 (h264, yuv420p, 240px wide), and writes it to
 * apps/web/public/media/gif/<mood>/<slug>.mp4. Prints a review sheet.
 *
 * NEVER runs at request time — this is an offline content tool. Self-hosts the
 * output so the runtime makes no third-party calls.
 *
 * Usage: pnpm exec tsx scripts/fetch-media.ts
 * Requires: ffmpeg + curl on PATH.
 */
import { execFile } from "node:child_process";
import { mkdir, rm, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

import { GIF_SOURCES, type GifSource } from "./media-manifest";

const run = promisify(execFile);

// Tenor's long-standing public sample key. Build-time only.
const TENOR_KEY = "LIVDSRZULELA";
const ROOT = resolve(fileURLToPath(import.meta.url), "../..");
const OUT_DIR = resolve(ROOT, "apps/web/public/media/gif");
const TMP = resolve(ROOT, ".media-tmp");

interface TenorResult {
  media: { tinygif: { url: string } }[];
}

async function tenorGifUrl(query: string, pick: number): Promise<string> {
  const api = `https://g.tenor.com/v1/search?q=${encodeURIComponent(
    query,
  )}&key=${TENOR_KEY}&limit=${pick + 1}&media_filter=minimal&contentfilter=high`;
  const res = await fetch(api);
  if (!res.ok) throw new Error(`Tenor HTTP ${res.status} for "${query}"`);
  const body = (await res.json()) as { results: TenorResult[] };
  const hit = body.results[pick] ?? body.results[0];
  const url = hit?.media?.[0]?.tinygif?.url;
  if (!url) throw new Error(`no GIF for "${query}"`);
  return url;
}

async function kb(path: string): Promise<number> {
  return Math.round((await stat(path)).size / 1024);
}

async function processSrc(
  src: GifSource,
): Promise<{ slug: string; mood: string; kb: number; path: string }> {
  const gifPath = resolve(TMP, `${src.mood}-${src.slug}.gif`);
  const outRel = `gif/${src.mood}/${src.slug}.mp4`;
  const mp4Path = resolve(OUT_DIR, src.mood, `${src.slug}.mp4`);

  const url = await tenorGifUrl(src.query, src.pick ?? 0);
  await run("curl", ["-sS", "-m", "30", "-o", gifPath, url]);
  await mkdir(dirname(mp4Path), { recursive: true });
  await run("ffmpeg", [
    "-y",
    "-loglevel",
    "error",
    "-i",
    gifPath,
    "-movflags",
    "+faststart",
    "-pix_fmt",
    "yuv420p",
    "-vf",
    "scale=240:-2:flags=lanczos",
    "-an",
    mp4Path,
  ]);
  return { slug: src.slug, mood: src.mood, kb: await kb(mp4Path), path: `/media/${outRel}` };
}

async function main(): Promise<void> {
  await mkdir(TMP, { recursive: true });
  const rows: { slug: string; mood: string; kb: number; path: string }[] = [];
  for (const src of GIF_SOURCES) {
    try {
      rows.push(await processSrc(src));
      process.stdout.write(`  ✓ ${src.mood}/${src.slug}\n`);
    } catch (err) {
      process.stdout.write(
        `  ✗ ${src.mood}/${src.slug}: ${err instanceof Error ? err.message : err}\n`,
      );
    }
  }
  await rm(TMP, { recursive: true, force: true });

  console.log("\n=== review sheet ===");
  console.log("mood     slug        KB    path");
  for (const r of rows) {
    console.log(`${r.mood.padEnd(8)} ${r.slug.padEnd(10)} ${String(r.kb).padStart(4)}  ${r.path}`);
  }
  console.log(`\n${rows.length}/${GIF_SOURCES.length} clips written to apps/web/public/media/gif/`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
