/**
 * Structural integrity check for src/content/*.json. Run via `npm run validate`.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const contentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/content");
const readJson = (name) => JSON.parse(readFileSync(path.join(contentDir, name), "utf8"));

const vocab = readJson("vocab.json");
const sentences = readJson("sentences.json");
const chapters = readJson("chapters.json");
const exercises = readJson("exercises.json");

const EXERCISE_TYPES = new Set([
  "pick_image",
  "pick_translation",
  "pick_audio",
  "arrange_from_audio",
  "complete_translation",
  "translate_sentence",
  "dialogue_reply",
  "speak_aloud",
  "write_character",
]);

const errors = [];

const findDuplicates = (items, key) => {
  const seen = new Set();
  const dupes = new Set();
  items.forEach((item) => {
    if (seen.has(item[key])) dupes.add(item[key]);
    seen.add(item[key]);
  });
  return [...dupes];
};

// --- id uniqueness -----------------------------------------------------
findDuplicates(vocab, "id").forEach((id) => errors.push(`Duplicate vocab id: ${id}`));
findDuplicates(sentences, "id").forEach((id) => errors.push(`Duplicate sentence id: ${id}`));
findDuplicates(exercises, "id").forEach((id) => errors.push(`Duplicate exercise id: ${id}`));
findDuplicates(chapters, "id").forEach((id) => errors.push(`Duplicate chapter id: ${id}`));
const allLessons = chapters.flatMap((c) => c.lessons);
findDuplicates(allLessons, "id").forEach((id) => errors.push(`Duplicate lesson id: ${id}`));

const vocabIds = new Set(vocab.map((v) => v.id));
const writableVocabIds = new Set(vocab.filter((v) => v.writable).map((v) => v.id));
const sentenceIds = new Set(sentences.map((s) => s.id));
const lessonIds = new Set(allLessons.map((l) => l.id));
const chapterIds = new Set(chapters.map((c) => c.id));

// --- sentence tokens must resolve to real vocab ids ---------------------
sentences.forEach((sentence) => {
  sentence.tokens.forEach((tokenId) => {
    if (!vocabIds.has(tokenId)) {
      errors.push(`sentence ${sentence.id}: token "${tokenId}" is not a known vocab id`);
    }
  });
});

// --- every vocab entry has chapterId + lessonId, and lessonId is real ---
vocab.forEach((entry) => {
  if (!entry.chapterId) errors.push(`vocab ${entry.id}: missing chapterId`);
  if (!entry.lessonId) errors.push(`vocab ${entry.id}: missing lessonId`);
  if (entry.chapterId && !chapterIds.has(entry.chapterId)) {
    errors.push(`vocab ${entry.id}: chapterId "${entry.chapterId}" not found in chapters.json`);
  }
  if (entry.lessonId && !lessonIds.has(entry.lessonId)) {
    errors.push(`vocab ${entry.id}: lessonId "${entry.lessonId}" not found in chapters.json`);
  }
});

sentences.forEach((entry) => {
  if (!entry.chapterId) errors.push(`sentence ${entry.id}: missing chapterId`);
  if (!entry.lessonId) errors.push(`sentence ${entry.id}: missing lessonId`);
  if (entry.chapterId && !chapterIds.has(entry.chapterId)) {
    errors.push(`sentence ${entry.id}: chapterId "${entry.chapterId}" not found in chapters.json`);
  }
  if (entry.lessonId && !lessonIds.has(entry.lessonId)) {
    errors.push(`sentence ${entry.id}: lessonId "${entry.lessonId}" not found in chapters.json`);
  }
});

// --- exercise type must be one of the 8 known types, and must reference
//     real vocab/sentence ids ---------------------------------------------
const resolvable = (id) => vocabIds.has(id) || sentenceIds.has(id);

exercises.forEach((entry) => {
  if (!EXERCISE_TYPES.has(entry.type)) {
    errors.push(`exercise ${entry.id}: unknown type "${entry.type}"`);
  }
  if (!entry.chapterId || !chapterIds.has(entry.chapterId)) {
    errors.push(`exercise ${entry.id}: chapterId "${entry.chapterId}" not found in chapters.json`);
  }
  if (!entry.lessonId || !lessonIds.has(entry.lessonId)) {
    errors.push(`exercise ${entry.id}: lessonId "${entry.lessonId}" not found in chapters.json`);
  }

  const idRefs = [entry.targetId, entry.targetSentenceId, entry.promptId, entry.promptSentenceId, entry.correctId].filter(Boolean);
  idRefs.forEach((id) => {
    if (!resolvable(id)) errors.push(`exercise ${entry.id}: "${id}" is not a known vocab or sentence id`);
  });
  (entry.choiceIds || []).forEach((id) => {
    if (!resolvable(id)) errors.push(`exercise ${entry.id}: choice "${id}" is not a known vocab or sentence id`);
  });

  if (entry.type === "write_character" && entry.targetId && !writableVocabIds.has(entry.targetId)) {
    errors.push(`exercise ${entry.id}: targetId "${entry.targetId}" is not marked writable in vocab.json`);
  }
});

console.log("CONTENT VALIDATION");
console.log(`- Chapters: ${chapters.length}, lessons: ${lessonIds.size}`);
console.log(`- Vocab: ${vocab.length}, sentences: ${sentences.length}, exercises: ${exercises.length}`);
console.log(`- Errors: ${errors.length}`);
errors.forEach((message) => console.log(`  [ERROR] ${message}`));

if (errors.length > 0) process.exitCode = 1;
