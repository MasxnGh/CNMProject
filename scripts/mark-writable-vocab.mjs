/**
 * Sets vocab.json's "writableChars" field: the subset of each word's own
 * characters that have stroke-order data in the locally installed
 * hanzi-writer-data package and no more than MAX_STROKES_PER_CHAR strokes
 * (write_character now asks about exactly one character per exercise, so
 * eligibility is per-character, not per-word - a word's length no longer
 * disqualifies it, only its individual characters can).
 * Run via `node scripts/mark-writable-vocab.mjs`.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const vocabPath = path.join(rootDir, "src/content/vocab.json");
const dataDir = path.join(rootDir, "node_modules/hanzi-writer-data");

const MAX_STROKES_PER_CHAR = 12;

function loadStrokeData(char) {
  const file = path.join(dataDir, `${char}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

const vocab = JSON.parse(readFileSync(vocabPath, "utf8"));

let totalChars = 0;
let writableCharCount = 0;
let wordsWithAtLeastOne = 0;
const skippedMissingData = new Set();
const skippedTooManyStrokes = new Set();

const updated = vocab.map((word) => {
  const chars = [...word.hanzi];
  totalChars += chars.length;

  const writableChars = chars.filter((char) => {
    const data = loadStrokeData(char);
    if (!data) {
      skippedMissingData.add(char);
      return false;
    }
    if (data.strokes.length > MAX_STROKES_PER_CHAR) {
      skippedTooManyStrokes.add(char);
      return false;
    }
    return true;
  });

  writableCharCount += writableChars.length;
  if (writableChars.length > 0) wordsWithAtLeastOne += 1;

  const { writable, ...rest } = word;
  return { ...rest, writableChars };
});

writeFileSync(vocabPath, `${JSON.stringify(updated, null, 2)}\n`);

console.log(`vocab: ${vocab.length} words, ${totalChars} characters total`);
console.log(`writable characters: ${writableCharCount}/${totalChars}`);
console.log(`words with at least one writable character: ${wordsWithAtLeastOne}/${vocab.length}`);
if (skippedMissingData.size > 0) {
  console.log(`skipped (missing stroke data): ${[...skippedMissingData].join(", ")}`);
}
if (skippedTooManyStrokes.size > 0) {
  console.log(`skipped (>${MAX_STROKES_PER_CHAR} strokes): ${[...skippedTooManyStrokes].join(", ")}`);
}
