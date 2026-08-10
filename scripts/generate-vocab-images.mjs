/**
 * Bootstrap utility: rasterizes the hand-drawn SVGs in src/lib/art.js into
 * public/img/vocab/<key>.webp so the photo layer (layer 1) has something
 * real to load until actual photography/AI art replaces them one file at a
 * time. Safe to re-run — it only touches files for keys still in ART.
 * Run via `npm run generate:art`.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { ART, VOCAB_ICON_KEYS } from "../src/lib/art.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/img/vocab");
mkdirSync(outDir, { recursive: true });

const CANVAS = 480;
const ICON_SIZE = 340;
const BG = "#FCFAF5"; // --ivory

async function renderOne(key) {
  const iconPng = await sharp(Buffer.from(ART[key])).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();

  const buffer = await sharp({
    create: { width: CANVAS, height: CANVAS, channels: 3, background: BG },
  })
    .composite([{ input: iconPng, gravity: "center" }])
    .webp({ quality: 82 })
    .toBuffer();

  writeFileSync(path.join(outDir, `${key}.webp`), buffer);
  return buffer.length;
}

let total = 0;
for (const key of VOCAB_ICON_KEYS) {
  const bytes = await renderOne(key);
  total += bytes;
}

console.log(`สร้างภาพ ${VOCAB_ICON_KEYS.length} ไฟล์ใน public/img/vocab/ — รวม ${(total / 1024).toFixed(1)} KB`);
