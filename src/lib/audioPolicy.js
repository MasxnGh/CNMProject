import { playWord, playSentence, getLastPlayedAt } from "./audio.js";
import { isSentenceId } from "../components/exercises/content.js";

// The only place in the app that actually triggers Chinese audio for a
// vocab/sentence id. Every exercise component and page must go through the
// functions below instead of calling playWord/playSentence directly, so
// tweaking sound behavior never means hunting across 9+ files.
export function playEntry(id, opts) {
  if (!id) return;
  return isSentenceId(id) ? playSentence(id, opts) : playWord(id, opts);
}

// User-initiated replay (speaker/turtle buttons). Flagged `manual` so
// audio.js's replay counter - which feeds the SRS ">2 replays = hard"
// signal - only reflects genuine hesitation clicks, never the automatic
// sounds this module also plays.
export function manualReplay(id, opts = {}) {
  playEntry(id, { ...opts, manual: true });
}

// Single source of truth for when each exercise type is allowed to make
// sound, and what it plays at each of the three moments a question can make
// noise. Values:
//   onEnter/onCheck: 'prompt' | 'answer' | 'dialogue' | null
//   onSelect: 'option' | 'chip' | null  (both just mean "play whatever was tapped")
export const AUDIO_POLICY = {
  pick_image: { onEnter: "prompt", onSelect: null, onCheck: "answer" },
  pick_translation: { onEnter: "prompt", onSelect: null, onCheck: "prompt" },
  pick_chinese: { onEnter: null, onSelect: null, onCheck: "answer" },
  pick_audio: { onEnter: "prompt", onSelect: "option", onCheck: "answer" },
  arrange_from_audio: { onEnter: "prompt", onSelect: "chip", onCheck: "answer" },
  complete_translation: { onEnter: "prompt", onSelect: null, onCheck: "answer" },
  translate_sentence: { onEnter: null, onSelect: null, onCheck: "answer" },
  dialogue_reply: { onEnter: "prompt", onSelect: null, onCheck: "dialogue" },
  write_character: { onEnter: "prompt", onSelect: null, onCheck: "answer" },
  // No onEnter (5 words can't all play at once) and no onCheck (there's no
  // check button - MatchPairs plays its own quiet per-pair sfx directly).
  match_pairs: { onEnter: null, onSelect: "option", onCheck: null },
};

// Maps each exercise type's own fields to the abstract prompt/answer ids the
// table above refers to. This is the one place that knows, per type, which
// field is "the thing said before answering" vs "the thing said as the
// correct answer" - callers never touch exercise.targetId etc. directly.
function resolveAudioIds(exercise) {
  switch (exercise.type) {
    case "pick_image":
    case "pick_audio":
      return { prompt: exercise.targetId, answer: exercise.targetId };
    case "write_character":
      // The audio is always the whole word (contextWord), never the single
      // character being written - there's no separate audio per character.
      return { prompt: exercise.contextWord, answer: exercise.contextWord };
    case "pick_translation": {
      // Word-mode uses targetId; sentence-mode uses targetSentenceId instead.
      const id = exercise.targetId || exercise.targetSentenceId;
      return { prompt: id, answer: id };
    }
    case "pick_chinese":
      return { prompt: null, answer: exercise.targetSentenceId };
    case "arrange_from_audio":
    case "complete_translation":
      return { prompt: exercise.targetSentenceId, answer: exercise.targetSentenceId };
    case "translate_sentence":
      return { prompt: null, answer: exercise.targetSentenceId };
    case "dialogue_reply":
      return { prompt: exercise.promptId || exercise.promptSentenceId, answer: exercise.correctId };
    default:
      return { prompt: null, answer: null };
  }
}

const MIN_GAP_MS = 1000;
const DIALOGUE_GAP_MS = 400;

// If something was just played within the last second, wait out the rest of
// that second first so the check-time sound doesn't cut across it.
function afterGap(fn) {
  const wait = MIN_GAP_MS - (Date.now() - getLastPlayedAt());
  if (wait <= 0) fn();
  else setTimeout(fn, wait);
}

// Called once per question shown (parent pages key this off exercise.id, not
// mount/index, so it replays correctly on Review-session requeues too).
export function playOnEnter(exercise) {
  const spec = AUDIO_POLICY[exercise?.type];
  if (!spec?.onEnter) return;
  playEntry(resolveAudioIds(exercise).prompt);
}

// Called by exercise components at the point of a "tap an option/chip"
// gesture. A no-op for types whose policy says onSelect: null - components
// call this unconditionally rather than deciding for themselves.
export function playOnSelect(exercise, tappedId) {
  const spec = AUDIO_POLICY[exercise?.type];
  if (!spec?.onSelect) return;
  playEntry(tappedId);
}

// Called once per question, on both correct AND incorrect answers - callers
// must never gate this on isCorrect.
export function playOnCheck(exercise) {
  const spec = AUDIO_POLICY[exercise?.type];
  if (!spec?.onCheck) return;
  const { prompt, answer } = resolveAudioIds(exercise);

  if (spec.onCheck === "dialogue") {
    afterGap(() => {
      playEntry(prompt);
      setTimeout(() => playEntry(answer), DIALOGUE_GAP_MS);
    });
    return;
  }
  afterGap(() => playEntry(spec.onCheck === "prompt" ? prompt : answer));
}
