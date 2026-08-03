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
  "pick_chinese",
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

  // The blank is on the Thai side now: thTokens/blankIndex/distractorTh
  // replace the old Chinese-token blankIndex.
  if (entry.type === "complete_translation") {
    if (!Array.isArray(entry.thTokens) || entry.thTokens.length === 0) {
      errors.push(`exercise ${entry.id}: complete_translation requires a non-empty thTokens array`);
    } else if (!Number.isInteger(entry.blankIndex) || entry.blankIndex < 0 || entry.blankIndex >= entry.thTokens.length) {
      errors.push(`exercise ${entry.id}: blankIndex ${entry.blankIndex} out of range for thTokens`);
    } else {
      const correctText = entry.thTokens[entry.blankIndex];
      const distractorTh = entry.distractorTh || [];
      if (distractorTh.length === 0) errors.push(`exercise ${entry.id}: complete_translation requires distractorTh`);
      if (distractorTh.includes(correctText)) {
        errors.push(`exercise ${entry.id}: distractorTh duplicates the correct answer "${correctText}"`);
      }
      findDuplicates(distractorTh.map((text) => ({ text })), "text").forEach((text) => {
        errors.push(`exercise ${entry.id}: duplicate distractorTh "${text}"`);
      });
    }
  }

  // Distractors are inline {hanzi, pinyin} - synthetic near-misses, not real
  // sentence ids (they never need audio, only the correct answer does).
  if (entry.type === "pick_chinese") {
    if (!Array.isArray(entry.distractors) || entry.distractors.length === 0) {
      errors.push(`exercise ${entry.id}: pick_chinese requires a non-empty distractors array`);
    } else {
      entry.distractors.forEach((d, i) => {
        if (!d.hanzi || !d.pinyin) errors.push(`exercise ${entry.id}: distractors[${i}] missing hanzi/pinyin`);
      });
      const targetSentence = sentences.find((s) => s.id === entry.targetSentenceId);
      if (targetSentence && entry.distractors.some((d) => d.hanzi === targetSentence.hanzi)) {
        errors.push(`exercise ${entry.id}: a distractor duplicates the correct sentence's hanzi`);
      }
      findDuplicates(entry.distractors, "hanzi").forEach((hanzi) => {
        errors.push(`exercise ${entry.id}: duplicate distractor hanzi "${hanzi}"`);
      });
    }
  }

  // Sentence-mode pick_translation: distractorTexts are curated near-miss
  // Thai translations, not real sentence ids.
  if (entry.type === "pick_translation" && entry.targetSentenceId) {
    const distractorTexts = entry.distractorTexts || [];
    if (distractorTexts.length === 0) {
      errors.push(`exercise ${entry.id}: sentence-mode pick_translation requires distractorTexts`);
    }
    const targetSentence = sentences.find((s) => s.id === entry.targetSentenceId);
    if (targetSentence && distractorTexts.includes(targetSentence.th)) {
      errors.push(`exercise ${entry.id}: distractorTexts duplicates the correct translation`);
    }
    findDuplicates(distractorTexts.map((text) => ({ text })), "text").forEach((text) => {
      errors.push(`exercise ${entry.id}: duplicate distractorTexts "${text}"`);
    });
  }

  // The pre-filled slot (a proper noun, usually) must be a real position in
  // the target sentence's token list.
  if (entry.type === "arrange_from_audio" && entry.prefilledIndex != null) {
    const targetSentence = sentences.find((s) => s.id === entry.targetSentenceId);
    if (targetSentence && (entry.prefilledIndex < 0 || entry.prefilledIndex >= targetSentence.tokens.length)) {
      errors.push(`exercise ${entry.id}: prefilledIndex ${entry.prefilledIndex} out of range for the target sentence`);
    }
  }
});

console.log("CONTENT VALIDATION");
console.log(`- Chapters: ${chapters.length}, lessons: ${lessonIds.size}`);
console.log(`- Vocab: ${vocab.length}, sentences: ${sentences.length}, exercises: ${exercises.length}`);
console.log(`- Errors: ${errors.length}`);
errors.forEach((message) => console.log(`  [ERROR] ${message}`));

if (errors.length > 0) process.exitCode = 1;
