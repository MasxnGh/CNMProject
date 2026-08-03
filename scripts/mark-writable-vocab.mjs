/**
 * Sets vocab.json's "writable" field: true only for words where every
 * character has stroke-order data in the locally installed hanzi-writer-data
 * package, the word is at most MAX_CHARS characters, and no character in it
 * has more than MAX_STROKES_PER_CHAR strokes (write_character exercises are
 * the slowest exercise type to answer - keeping the writable set small stops
 * them from showing up too often and wearing the player out).
 * Run via `node scripts/mark-writable-vocab.mjs`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vocabPath = path.join(rootDir, "src/content/vocab.json");
const dataDir = path.join(rootDir, "node_modules/hanzi-writer-data");

const MAX_CHARS = 2;
const MAX_STROKES_PER_CHAR = 12;

function loadStrokeData(char) {
  const file = path.join(dataDir, `${char}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

const vocab = JSON.parse(readFileSync(vocabPath, "utf8"));

let writableCount = 0;
const skippedTooLong = [];
const skippedMissingData = [];
const skippedTooManyStrokes = [];

const updated = vocab.map((word) => {
  const chars = [...word.hanzi];

  if (chars.length === 0 || chars.length > MAX_CHARS) {
    if (chars.length > MAX_CHARS) skippedTooLong.push(word.hanzi);
    return { ...word, writable: false };
  }

  const charData = chars.map(loadStrokeData);
  if (charData.some((data) => !data)) {
    skippedMissingData.push(word.hanzi);
    return { ...word, writable: false };
  }

  if (charData.some((data) => data.strokes.length > MAX_STROKES_PER_CHAR)) {
    skippedTooManyStrokes.push(word.hanzi);
    return { ...word, writable: false };
  }

  writableCount += 1;
  return { ...word, writable: true };
});

writeFileSync(vocabPath, `${JSON.stringify(updated, null, 2)}\n`);

console.log(`vocab: ${vocab.length} total, writable: ${writableCount}`);
if (skippedTooLong.length > 0) {
  console.log(`skipped (>${MAX_CHARS} characters): ${skippedTooLong.join(", ")}`);
}
if (skippedMissingData.length > 0) {
  console.log(`skipped (missing stroke data): ${skippedMissingData.join(", ")}`);
}
if (skippedTooManyStrokes.length > 0) {
  console.log(`skipped (a character has >${MAX_STROKES_PER_CHAR} strokes): ${skippedTooManyStrokes.join(", ")}`);
}
