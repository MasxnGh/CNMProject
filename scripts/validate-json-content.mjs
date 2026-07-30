/**
 * Consistency check for the generated src/content/*.json files (separate
 * from validate-content.mjs, which still checks the live levels.js data for
 * answer leaks). This one checks structural integrity of the new schema:
 * ids are unique, every sentence token resolves to a real vocab id, and
 * every lessonId referenced by vocab/sentences exists in units.json.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const contentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/content");
const readJson = (name) => JSON.parse(readFileSync(path.join(contentDir, name), "utf8"));

const vocab = readJson("vocab.json");
const sentences = readJson("sentences.json");
const units = readJson("units.json");

const errors = [];

const duplicates = (items, key) => {
  const seen = new Set();
  const dupes = new Set();
  items.forEach((item) => {
    if (seen.has(item[key])) dupes.add(item[key]);
    seen.add(item[key]);
  });
  return [...dupes];
};

duplicates(vocab, "id").forEach((id) => errors.push(`Duplicate vocab id: ${id}`));
duplicates(sentences, "id").forEach((id) => errors.push(`Duplicate sentence id: ${id}`));

const lessonIds = new Set(units.flatMap((unit) => unit.lessons.map((lesson) => lesson.id)));
duplicates(units.flatMap((unit) => unit.lessons), "id").forEach((id) => errors.push(`Duplicate lesson id: ${id}`));

const nodeIds = units.flatMap((unit) => unit.lessons.flatMap((lesson) => lesson.nodeIds));
duplicates(nodeIds.map((id) => ({ id })), "id").forEach((id) => errors.push(`Node id appears in more than one lesson: ${id}`));

const vocabIds = new Set(vocab.map((entry) => entry.id));

vocab.forEach((entry) => {
  if (!lessonIds.has(entry.lessonId)) errors.push(`vocab ${entry.id}: lessonId "${entry.lessonId}" not found in units.json`);
});

sentences.forEach((sentence) => {
  if (!lessonIds.has(sentence.lessonId)) errors.push(`sentence ${sentence.id}: lessonId "${sentence.lessonId}" not found in units.json`);
  sentence.tokens.forEach((tokenId) => {
    if (!vocabIds.has(tokenId)) errors.push(`sentence ${sentence.id}: token "${tokenId}" is not a known vocab id`);
  });
});

console.log("JSON CONTENT VALIDATION");
console.log(`- Units: ${units.length}, lessons: ${lessonIds.size}, nodes referenced: ${nodeIds.length}`);
console.log(`- Vocab: ${vocab.length}, sentences: ${sentences.length}`);
console.log(`- Errors: ${errors.length}`);
errors.forEach((message) => console.log(`  [ERROR] ${message}`));

if (errors.length > 0) process.exitCode = 1;
