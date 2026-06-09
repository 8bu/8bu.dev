import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { renderPathsModule, renderStandaloneSvg, vectorizeBadge } from "./wordmark-vectorize";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FONT = join(__dirname, "wordmark-fonts", "PressStart2P-Regular.ttf");
const PATHS_OUT = join(ROOT, "src", "components", "wordmark-paths.ts");
const SVG_OUT = join(ROOT, "public", "8bu-logo.svg");

const buf = readFileSync(FONT);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
const geo = vectorizeBadge(ab);

writeFileSync(PATHS_OUT, renderPathsModule(geo), "utf8");
writeFileSync(SVG_OUT, renderStandaloneSvg(geo), "utf8");

console.log(`[wordmark:build] wrote ${PATHS_OUT}`);
console.log(`[wordmark:build] wrote ${SVG_OUT}`);
console.log(`[wordmark:build] viewBox=${geo.viewBox}`);
