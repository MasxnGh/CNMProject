/**
 * JSDoc-only type layer for src/content/*.json. Plain JS project (no
 * TypeScript toolchain) - these typedefs exist for editor intellisense only.
 *
 * @typedef {Object} VisualRef
 * @property {"image"|"emoji"|null} type - null means the word is abstract
 *   (grammar particles like 是/叫/的/很) and has no visual.
 * @property {string|null} value - image path (under public/) or an emoji.
 *
 * @typedef {Object} Vocab
 * @property {string} id - stable id, e.g. "v_nihao".
 * @property {string} hanzi
 * @property {string} pinyin
 * @property {string} th - Thai meaning.
 * @property {string} chapterId - e.g. "ch01".
 * @property {string} lessonId - e.g. "ch01_l1", the lesson this word is
 *   first taught in.
 * @property {string} audio - path to the mp3, e.g. "/audio/v_nihao.mp3".
 * @property {string} audioSlow - path to the slow-playback mp3.
 * @property {VisualRef} visual
 *
 * @typedef {Object} Sentence
 * @property {string} id - e.g. "s_ni_hao".
 * @property {string} hanzi - full sentence, e.g. "你好！".
 * @property {string} pinyin
 * @property {string} th
 * @property {string} chapterId
 * @property {string} lessonId
 * @property {string} audio
 * @property {string} audioSlow
 * @property {string[]} tokens - ordered Vocab ids that compose the
 *   sentence; every arrange/reveal exercise type relies on this order.
 *
 * @typedef {Object} Lesson
 * @property {string} id - e.g. "ch01_l1".
 * @property {"learn"|"practice"|"review"} type
 * @property {string} title
 *
 * @typedef {Object} Chapter
 * @property {string} id - e.g. "ch01".
 * @property {number} index - 1-10, display order.
 * @property {string} titleTh
 * @property {string} titleZh
 * @property {string} summary
 * @property {Lesson[]} lessons
 * @property {boolean} [draft] - true when the chapter has no real content
 *   yet and is only a placeholder scaffold.
 *
 * @typedef {"pick_image"|"pick_translation"|"pick_audio"|
 *   "arrange_from_audio"|"complete_translation"|"translate_sentence"|
 *   "dialogue_reply"|"speak_aloud"} ExerciseType
 *
 * @typedef {Object} Exercise
 * @property {string} id
 * @property {ExerciseType} type
 * @property {string} chapterId
 * @property {string} lessonId
 * @property {string} [targetId] - Vocab or Sentence id being tested; used
 *   by pick_image / pick_translation / pick_audio / speak_aloud.
 * @property {string} [choiceIds] - candidate ids shown as options; used by
 *   pick_image / pick_translation / pick_audio / dialogue_reply.
 * @property {string} [targetSentenceId] - used by arrange_from_audio /
 *   complete_translation / translate_sentence.
 * @property {number} [blankIndex] - index into Sentence.tokens that is
 *   blanked out; used by complete_translation.
 * @property {string} [promptId] - Vocab or Sentence id shown as the other
 *   speaker's line; used by dialogue_reply.
 * @property {string} [promptSentenceId] - Sentence id shown as the other
 *   speaker's line; used by dialogue_reply.
 * @property {string} [correctId] - the correct choice among choiceIds;
 *   used by dialogue_reply.
 */

export {};
