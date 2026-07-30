/**
 * One-time migration: reads the existing hand-authored src/data/levels.js
 * and mechanically generates src/content/{vocab,sentences,units}.json.
 *
 * This is generation, not re-authoring - every word and sentence here is
 * pulled straight from levels.js so nothing gets mistyped or dropped along
 * the way. It does NOT touch the running app: GamePage/QuestionRenderer/
 * checkpoint.js still read levels.js exactly as before. Phase 1.5 is the
 * separate, dedicated step that cuts the engine over to read these files.
 *
 * Coverage in this pass:
 *   - vocab.json:     every level's `terms` list (hanzi/pinyin/thai/category
 *                      /example are authoritative there), deduped by hanzi.
 *   - sentences.json:  only `sentenceOrder` missions, because those are the
 *                      one mission type that already stores its sentence as
 *                      a segmented word list (`correctSequence`). Chinese has
 *                      no spaces, so any other mission's `chineseText` can't
 *                      be safely tokenized into words without a real
 *                      segmenter - extracting sentences from fillBlank/
 *                      dialogue/choice missions is left for Phase 1.5, where
 *                      the full mission object is still available to hand-map.
 *   - units.json:      stageSets + levels, split into lessons of size 3
 *                      (last lesson in a unit may be smaller - 5 levels does
 *                      not divide evenly by 3). Lesson type alternates
 *                      learn/practice as a starting default; content authors
 *                      can retag later.
 *
 * Some sentence tokens (grammatical words like 是/的/去/喜欢) never appear in
 * any level's `terms` list, only inside sentence tiles. Those get an
 * auto-created vocab stub (pinyin from the existing `wordPinyin` table, Thai
 * gloss left empty) so `tokens` always resolves to a real vocab id. Stubs are
 * called out in the summary below - they need a human to fill in `th`.
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { levels, stageSets, wordPinyin } from "../src/data/levels.js";

const contentDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "../src/content");

const LESSON_SIZE = 3;

const COMBINING_MARKS = /[̀-ͯ]/g;

const stripToneMarks = (pinyin) =>
  pinyin
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

const uniqueSlug = (base, used) => {
  const safeBase = base || "x";
  let slug = safeBase;
  let suffix = 2;
  while (used.has(slug)) {
    slug = `${safeBase}${suffix}`;
    suffix += 1;
  }
  used.add(slug);
  return slug;
};

// --- units.json: stageSets -> units, levels chunked into lessons of 3 ---
const units = stageSets.map((set) => {
  const lessons = [];
  for (let index = 0; index < set.levels.length; index += LESSON_SIZE) {
    const nodeIds = set.levels.slice(index, index + LESSON_SIZE);
    const lessonIndex = lessons.length + 1;
    lessons.push({
      id: `u${set.id}_l${lessonIndex}`,
      title: `บทที่ ${lessonIndex}`,
      type: lessonIndex % 2 === 1 ? "learn" : "practice",
      nodeIds,
    });
  }
  return {
    id: `u${set.id}`,
    title: set.title.replace(`ชุดที่ ${set.id}: `, ""),
    theme: set.theme,
    lessons,
  };
});

const lessonIdByLevelId = new Map();
units.forEach((unit) => unit.lessons.forEach((lesson) => lesson.nodeIds.forEach((nodeId) => lessonIdByLevelId.set(nodeId, lesson.id))));

// --- vocab.json: dedupe every level's terms by hanzi ---
const vocabIdsUsed = new Set();
const vocabByHanzi = new Map();
const vocab = [];
let stubVocabCount = 0;

const addVocab = ({ hanzi, pinyin, thai, lessonId }) => {
  const existing = vocabByHanzi.get(hanzi);
  if (existing) return existing;

  const id = `v_${uniqueSlug(stripToneMarks(pinyin || hanzi), vocabIdsUsed)}`;
  const entry = {
    id,
    hanzi,
    pinyin,
    th: thai ?? "",
    lessonId,
    audio: `/audio/${id}.mp3`,
    audioSlow: null,
    visual: { type: null, value: null },
  };
  vocabByHanzi.set(hanzi, entry);
  vocab.push(entry);
  return entry;
};

levels.forEach((level) => {
  const lessonId = lessonIdByLevelId.get(level.id);
  (level.terms ?? []).forEach((term) => {
    addVocab({ hanzi: term.hanzi, pinyin: term.pinyin, thai: term.thai, lessonId });
  });
});

// --- sentences.json: sentenceOrder missions only (see file header) ---
const sentenceIdsUsed = new Set();
const sentences = [];
let sentenceOrderMissionCount = 0;

levels.forEach((level) => {
  const lessonId = lessonIdByLevelId.get(level.id);
  (level.questions ?? []).forEach((question) => {
    if (question.type !== "sentenceOrder") return;
    sentenceOrderMissionCount += 1;

    const sequence = question.answer?.correctSequence ?? [];
    if (!sequence.length) return;

    const tokens = sequence.map((word) => {
      const known = vocabByHanzi.get(word);
      if (known) return known.id;
      stubVocabCount += 1;
      return addVocab({ hanzi: word, pinyin: wordPinyin[word] ?? "", thai: "", lessonId }).id;
    });

    const base = tokens.map((id) => id.replace(/^v_/, "")).slice(0, 6).join("_");
    const id = `s_${uniqueSlug(base, sentenceIdsUsed)}`;
    sentences.push({
      id,
      hanzi: question.afterAnswer?.chineseText ?? sequence.join(""),
      pinyin: question.afterAnswer?.pinyin ?? "",
      th: question.afterAnswer?.thaiMeaning ?? "",
      lessonId,
      audio: `/audio/${id}.mp3`,
      tokens,
    });
  });
});

writeFileSync(path.join(contentDir, "vocab.json"), `${JSON.stringify(vocab, null, 2)}\n`);
writeFileSync(path.join(contentDir, "sentences.json"), `${JSON.stringify(sentences, null, 2)}\n`);
writeFileSync(path.join(contentDir, "units.json"), `${JSON.stringify(units, null, 2)}\n`);

const totalMissions = levels.reduce((sum, level) => sum + (level.questions?.length ?? 0), 0);

console.log("CONTENT MIGRATION");
console.log(`- Units: ${units.length}, lessons: ${units.reduce((sum, u) => sum + u.lessons.length, 0)}, nodes (levels): ${levels.length}`);
console.log(`- Vocab: ${vocab.length} words (${vocab.length - stubVocabCount} from level terms, ${stubVocabCount} auto-created stubs from sentence tiles - these have th: "" and need a human gloss)`);
console.log(`- Sentences: ${sentences.length} extracted from ${sentenceOrderMissionCount} sentenceOrder missions`);
console.log(`- Coverage: ${sentenceOrderMissionCount}/${totalMissions} total missions contributed to sentences.json (other mission types stay in levels.js until the Phase 1.5 engine cutover)`);
