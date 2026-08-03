import vocabData from "../content/vocab.json";

// Shared rules for authored distractors across pick_translation, pick_chinese,
// complete_translation, and arrange_from_audio:
//   1. Distractors must come from the same chapter as the question.
//   2. Grammatically valid choices, but semantically wrong.
//   3. Differ from the correct answer by one point, not everything.
//   4. Never duplicate within a single question's choice set.
//   5. Shuffle on every display - the correct answer must never sit in a
//      fixed slot. (Rules 1-3 are authored into exercises.json by hand since
//      they require real judgment; this module enforces 4 and 5 mechanically.)

export function shuffleChoices(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Chapter-scoped decoy words for chip-arrange exercises. Unlike a global
// vocab fallback, this NEVER reaches outside `chapterId`: if the chapter
// doesn't have enough other words, it just returns fewer decoys, because a
// decoy from a chapter the player hasn't reached yet is one they can rule
// out on sight without knowing what it means - it doesn't test anything.
export function pickChapterDecoyWords(excludeIds, count, chapterId) {
  const excluded = new Set(excludeIds);
  const pool = vocabData.filter((word) => word.chapterId === chapterId && !excluded.has(word.id));
  return shuffleChoices(pool).slice(0, count).map((word) => word.id);
}
