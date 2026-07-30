/**
 * JSDoc-only type layer for the new content schema (vocab/sentences/units).
 * The repo is plain JS (no TypeScript toolchain) - these typedefs exist for
 * editor intellisense and documentation, not for a build-time type checker.
 *
 * @typedef {Object} VisualRef
 * @property {"image"|"emoji"|null} type - null means "no asset yet", the
 *   3-tier resolver (missionVisual.js, Phase 3) falls back to a large hanzi
 *   glyph on a gradient background at render time.
 * @property {string|null} value - image path (under public/) or an emoji.
 *
 * @typedef {Object} Vocab
 * @property {string} id - stable id, e.g. "v_nihao".
 * @property {string} hanzi
 * @property {string} pinyin
 * @property {string} th - Thai meaning.
 * @property {string} lessonId - the lesson this word is first taught in.
 * @property {string} audio - path to the generated mp3, e.g. "/audio/v_nihao.mp3".
 * @property {string|null} audioSlow - always null by design; the slow
 *   variant is produced client-side via HTMLAudioElement.playbackRate on
 *   `audio` instead of generating a second file (see Phase 0.5 notes).
 * @property {VisualRef} visual
 *
 * @typedef {Object} Sentence
 * @property {string} id - e.g. "s_wo_shi_xuesheng".
 * @property {string} hanzi - full sentence, e.g. "我是学生。".
 * @property {string} pinyin
 * @property {string} th
 * @property {string} lessonId
 * @property {string} audio
 * @property {string[]} tokens - ordered Vocab ids that compose the sentence;
 *   shared by every mission type that arranges/reveals words in sequence.
 *
 * @typedef {Object} Lesson
 * @property {string} id - e.g. "u1_l1".
 * @property {string} title
 * @property {"learn"|"practice"} type
 * @property {string[]} nodeIds - node ids belonging to this lesson. Sized at
 *   3 for newly authored content; legacy content migrated from levels.js may
 *   have 2 (15 nodes / 5 per unit does not divide evenly by 3).
 *
 * @typedef {Object} Unit
 * @property {string} id - e.g. "u1".
 * @property {string} title
 * @property {string} theme
 * @property {Lesson[]} lessons
 *
 * @typedef {Object} StreakState
 * @property {number} count
 * @property {string|null} lastDate - "YYYY-MM-DD" local date, or null.
 *
 * @typedef {Object} Progress
 * @property {number} version
 * @property {string[]} completed - node/lesson ids completed.
 * @property {string[]} unlocked - node/lesson ids currently unlocked.
 * @property {number} coins
 * @property {number} xp
 * @property {number} level
 * @property {string[]} badges
 * @property {Object<string, number>} levelStars - legacy star record, kept
 *   for badges/Result/Victory but no longer used to gate unlocking.
 * @property {number} totalStars
 * @property {StreakState} streak
 * @property {Object<string, string>} unlockTestUsed - unitId -> "YYYY-MM-DD",
 *   caps the skip-ahead test to once per day per unit.
 * @property {string[]} mistakes - question ids answered wrong most recently,
 *   feeds the "review mistakes" practice mode.
 * @property {boolean} soundEnabled
 * @property {boolean} reducedMotion
 * @property {boolean} skipMissionIntro
 */

export {};
