/**
 * Question generation for the kite-rise game.
 * Encodes the three iron rules from the design spec:
 *  1. an image may appear on exactly one side (question OR options), never both,
 *     and image options never carry a caption.
 *  2. distractors must always come from the player's selected categories —
 *     relax the "must have art" requirement before ever reducing option count,
 *     and never reach outside the category.
 *  3. words with no illustration are never used for image-based question kinds.
 *
 * A fourth, load-bearing rule that isn't optional either: several vocab
 * words intentionally share one illustration (谢谢/不客气 both mean roughly
 * "thanks", 弟弟/儿子 are both drawn as a boy, etc). Whenever a question puts
 * an image up against a *choice* — as the prompt (img2zh) or as the options
 * (zh2img/match) — every word actually in play must have a distinct art key,
 * or the picture stops being able to identify one answer. That's enforced
 * once, here, at generation time, not patched over in the UI.
 *
 * Every core kind always keeps Chinese text on screen somewhere (hanzi as the
 * prompt, or hanzi as the options) — there is no Thai-only prompt/option kind,
 * so the player is never asked to work purely from a Thai gloss.
 *
 * Beyond the 4 "single tap" kinds, four special kinds resolve after several
 * taps: compass (dir category), clock (time category), order (sequences from
 * config.json), match (needs >=3 illustrated words with *distinct* art in-
 * category). Each only enters the kind pool when its own data actually exists.
 *
 * Modifier cards that control which question kinds can appear (noimg, blind)
 * must restrict the kind pool right here, before a word/kind is ever picked —
 * hiding the image *after* generating an image-kind question would leave a
 * blank, unanswerable card.
 */

export const KINDS = ["zh2th", "th2zh", "img2zh", "zh2img"];
export const SPECIAL_KINDS = ["compass", "clock", "order", "match"];

// which side (question "q" or answers "a") carries the image for a given kind
export const IMAGE_SIDE = { img2zh: "q", zh2img: "a", zh2th: "", th2zh: "" };

// extra rise-time multiplier for question kinds that take multiple taps to
// resolve — "match" has no entry because it doesn't rise at all: it's an
// untimed puzzle with its own full-screen layout (see Play.jsx)
export const RISE_MULTIPLIER = { order: 2.2, clock: 1.3 };

// hanzi -> [dx, dy] for the compass kind
export const DIRV = { 上: [0, -1], 下: [0, 1], 左: [-1, 0], 右: [1, 0], 前: [0, -1], 后: [0, 1], 东: [1, 0], 西: [-1, 0] };

const hasArt = (word) => Boolean(word.art);

function pickWeighted(pool, mastery) {
  const weights = pool.map((w) => 6 - (mastery[w.id] || 0));
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i];
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/** Weighted-random word pick; words the player hasn't mastered surface more often. */
export function pickWord(categoryPool, mastery, preferArt) {
  let pool = categoryPool;
  if (preferArt) {
    const withArt = categoryPool.filter(hasArt);
    if (withArt.length >= 4) pool = withArt;
  }
  return pickWeighted(pool, mastery);
}

export function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function generateCoreQuestion(word, kind, categoryPool, catIds, optionCount, twin) {
  const usesImages = IMAGE_SIDE[kind] !== ""; // either of the 2 image kinds
  const needsArtOptions = kind === "zh2img";
  const inCategory = (w) => w.id !== word.id && catIds.includes(w.cat);
  // a distractor sharing the target's art key would show the same picture as
  // the answer — either as a second "correct-looking" option, or (for img2zh)
  // as a second word the question's own image equally matches
  const artClash = (w) => usesImages && w.art && w.art === word.art;

  // iron rule 2, step 1: try same-category words that also have art, with no art clash
  let candidates = categoryPool.filter((w) => inCategory(w) && (!needsArtOptions || hasArt(w)) && !artClash(w));
  // step 2: not enough? drop the "must have art" requirement, stay in-category (art clash still forbidden)
  if (candidates.length < optionCount - 1) {
    candidates = categoryPool.filter((w) => inCategory(w) && !artClash(w));
  }
  // step 3: still not enough? shrink the option count — never leave the category
  const n = candidates.length < optionCount - 1 ? Math.max(2, candidates.length + 1) : optionCount;

  let pool = shuffle(candidates);
  if (twin) {
    // "twin" card: bias toward words sharing the target's own category, not
    // just any of the player's selected categories, so distractors read closer
    const sameCat = pool.filter((w) => w.cat === word.cat);
    pool = [...sameCat, ...pool];
  }

  const distractors = [];
  const usedIds = new Set();
  const usedArts = new Set(usesImages && word.art ? [word.art] : []);
  for (const w of pool) {
    if (distractors.length >= n - 1) break;
    if (usedIds.has(w.id)) continue;
    if (usesImages && w.art && usedArts.has(w.art)) continue; // would duplicate a picture already in play
    usedIds.add(w.id);
    if (usesImages && w.art) usedArts.add(w.art);
    distractors.push(w);
  }
  const options = shuffle([word, ...distractors]);

  return { kind, word, options, imageSide: IMAGE_SIDE[kind] };
}

/** 3 words with mutually distinct art keys — two cells sharing a picture would be an unsolvable pair. */
function pickMatchTrio(artPool) {
  const seenArt = new Set();
  const picks = [];
  for (const w of shuffle(artPool)) {
    if (picks.length >= 3) break;
    if (seenArt.has(w.art)) continue;
    seenArt.add(w.art);
    picks.push(w);
  }
  return picks;
}

/**
 * Builds one question. `optionCount` is the difficulty's option count (3 or 4)
 * for the 6 core kinds — it may shrink (iron rule 2) if the category is too
 * small to fill it honestly. `sequences`/`clocks` come from config.json.
 * `mods` is the array of held modifier ids (e.g. ["nopin","rush"]).
 */
export function generateQuestion({ vocab, catIds, optionCount, mastery, sequences = [], clocks = [], mods = [] }) {
  const categoryPool = vocab.filter((w) => catIds.includes(w.cat));
  const artPool = categoryPool.filter(hasArt);
  const distinctArtCount = new Set(artPool.map((w) => w.art)).size;
  const canImg = artPool.length >= 4; // iron rule 3

  const blind = mods.includes("blind");
  const noimg = mods.includes("noimg");
  const twin = mods.includes("twin");

  const word = pickWord(categoryPool, mastery, canImg && Math.random() < 0.62);
  const wordImageKinds = canImg && hasArt(word) ? ["img2zh", "zh2img"] : [];

  let kinds;
  if (blind) {
    // "blind": only image-based kinds survive (no hanzi shown anywhere before
    // an answer is picked) — img2zh is the only one where the image is the
    // whole prompt with no hanzi hint alongside it (zh2img shows the hanzi
    // itself as the prompt, which "blind" exists to hide). If this word has
    // no art to blind-test with, fall back to text.
    kinds = wordImageKinds.includes("img2zh") ? ["img2zh"] : ["zh2th", "th2zh"];
  } else if (noimg) {
    // "noimg": no illustrations anywhere, full stop
    kinds = ["zh2th", "th2zh"];
  } else {
    kinds = ["zh2th", "th2zh"].concat(wordImageKinds);
  }

  const dirPool = vocab.filter((w) => w.cat === "dir" && DIRV[w.hanzi]);
  if (catIds.includes("dir") && dirPool.length) kinds.push("compass", "compass");

  if (catIds.includes("time") && clocks.length >= 4) kinds.push("clock", "clock");

  const availableSequences = sequences.filter((s) => catIds.includes(s.cat));
  if (availableSequences.length) kinds.push("order");

  // match needs 3 *distinct* pictures, not just 3 illustrated words — two
  // words sharing an art key (e.g. 谢谢/不客气) can't both be a match cell
  if (!noimg && distinctArtCount >= 3) kinds.push("match");

  const kind = kinds[Math.floor(Math.random() * kinds.length)];

  switch (kind) {
    case "compass": {
      const dirWord = pickWord(dirPool, mastery, false);
      return { kind, word: dirWord, vector: DIRV[dirWord.hanzi] };
    }
    case "clock": {
      const picks = shuffle(clocks).slice(0, 4);
      return { kind, clock: picks[0], options: shuffle(picks) };
    }
    case "order": {
      const sequence = availableSequences[Math.floor(Math.random() * availableSequences.length)];
      return { kind, sequence };
    }
    case "match":
      return { kind, matchWords: pickMatchTrio(artPool) };
    default:
      return generateCoreQuestion(word, kind, categoryPool, catIds, optionCount, twin);
  }
}
