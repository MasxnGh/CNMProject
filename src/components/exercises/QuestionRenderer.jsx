import PickImage from "./PickImage.jsx";
import PickTranslation from "./PickTranslation.jsx";
import PickChinese from "./PickChinese.jsx";
import PickAudio from "./PickAudio.jsx";
import ArrangeFromAudio from "./ArrangeFromAudio.jsx";
import CompleteTranslation from "./CompleteTranslation.jsx";
import TranslateSentence from "./TranslateSentence.jsx";
import DialogueReply from "./DialogueReply.jsx";
import WriteCharacter from "./WriteCharacter.jsx";
import MatchPairs from "./MatchPairs.jsx";
import { sentenceById } from "./content.js";

export const EXERCISE_COMPONENTS = {
  pick_image: PickImage,
  pick_translation: PickTranslation,
  pick_chinese: PickChinese,
  pick_audio: PickAudio,
  arrange_from_audio: ArrangeFromAudio,
  complete_translation: CompleteTranslation,
  translate_sentence: TranslateSentence,
  dialogue_reply: DialogueReply,
  write_character: WriteCharacter,
  match_pairs: MatchPairs,
};

function arraysMatch(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((id, i) => id === b[i]);
}

export const CORRECTNESS = {
  pick_image: (exercise, answer) => answer === exercise.targetId,
  // Word-mode compares against targetId; sentence-mode's choices are keyed
  // by targetSentenceId (correct) or synthetic "d0"/"d1"/... (distractors).
  pick_translation: (exercise, answer) => answer === (exercise.targetId || exercise.targetSentenceId),
  pick_chinese: (exercise, answer) => answer === exercise.targetSentenceId,
  pick_audio: (exercise, answer) => answer === exercise.targetId,
  arrange_from_audio: (exercise, answer) => {
    const sentence = sentenceById.get(exercise.targetSentenceId);
    return !!sentence && arraysMatch(answer, sentence.tokens);
  },
  // The blank is now on the Thai side: answer is the Thai chip text the
  // player placed, checked against the Thai token at blankIndex.
  complete_translation: (exercise, answer) => answer === exercise.thTokens[exercise.blankIndex],
  translate_sentence: (exercise, answer) => {
    const sentence = sentenceById.get(exercise.targetSentenceId);
    if (!sentence) return false;
    if (Array.isArray(answer)) return arraysMatch(answer, sentence.tokens);
    if (typeof answer === "string") return answer.trim() === sentence.hanzi.trim();
    return false;
  },
  dialogue_reply: (exercise, answer) => answer === exercise.correctId,
  // write_character is self-reporting (see src/lib/exerciseKind.js) - it
  // never goes through the select-then-check flow that calls this, but the
  // entry is kept so every exercise type has one, consistent with the rest
  // of this map, and useable by anything else that wants a uniform checker.
  write_character: (exercise, answer) => answer?.correct === true,
  // match_pairs is also self-reporting - it only ever finishes by matching
  // every pair, so this is never actually false in practice.
  match_pairs: (exercise, answer) => answer?.correct === true,
};

export default function QuestionRenderer({ exercise, ...props }) {
  const Component = EXERCISE_COMPONENTS[exercise.type];
  if (!Component) return null;
  return <Component exercise={exercise} {...props} />;
}
