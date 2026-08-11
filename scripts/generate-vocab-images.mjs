/**
 * Rasterizes the hand-drawn SVGs in src/lib/art.js into public/img/vocab/
 * <key>.webp for every vocab key that doesn't have real photography yet, so
 * the photo layer (layer 1) always has something real to load. Matches the
 * photo import pipeline's own framing exactly (400×400, white background,
 * subject filling 80% of the frame) so the two sources are visually
 * consistent side by side.
 *
 * Reads scripts/photo-keys.json and skips every key listed there — this is
 * what makes it safe to re-run after real photos have been imported. Never
 * edit that file by hand; scripts/import-photos.mjs maintains it.
 * Run via `npm run generate:art`.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
import { ART, VOCAB_ICON_KEYS } from "../src/lib/art.js";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public/img/vocab");
const photoKeysPath = path.join(root, "scripts/photo-keys.json");
mkdirSync(outDir, { recursive: true });

const CANVAS = 400;
const FILL = 0.8; // subject fills 80% of the frame — matches import-photos.mjs exactly
const ICON_SIZE = Math.round(FILL * CANVAS);
const BG = "#FFFFFF"; // matches the normalised background of the imported photos

let photoKeys = new Set();
try {
  photoKeys = new Set(JSON.parse(readFileSync(photoKeysPath, "utf8")));
} catch {
  console.log("ไม่พบ scripts/photo-keys.json — ถือว่ายังไม่มีรูปถ่ายเลย");
}

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

const targetKeys = VOCAB_ICON_KEYS.filter((k) => !photoKeys.has(k));

let total = 0;
for (const key of targetKeys) {
  total += await renderOne(key);
}

console.log(`สร้างภาพ ${targetKeys.length} ไฟล์ใน public/img/vocab/ — รวม ${(total / 1024).toFixed(1)} KB`);
if (photoKeys.size) {
  console.log(`ข้าม ${photoKeys.size} คำที่มีรูปถ่ายจริงแล้ว (ตาม scripts/photo-keys.json)`);
}
