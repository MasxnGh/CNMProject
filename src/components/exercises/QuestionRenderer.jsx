import PickImage from "./PickImage.jsx";
import PickTranslation from "./PickTranslation.jsx";
import PickAudio from "./PickAudio.jsx";
import ArrangeFromAudio from "./ArrangeFromAudio.jsx";
import CompleteTranslation from "./CompleteTranslation.jsx";
import TranslateSentence from "./TranslateSentence.jsx";
import DialogueReply from "./DialogueReply.jsx";
import SpeakAloud from "./SpeakAloud.jsx";
import WriteCharacter from "./WriteCharacter.jsx";
import { sentenceById } from "./content.js";

export const EXERCISE_COMPONENTS = {
  pick_image: PickImage,
  pick_translation: PickTranslation,
  pick_audio: PickAudio,
  arrange_from_audio: ArrangeFromAudio,
  complete_translation: CompleteTranslation,
  translate_sentence: TranslateSentence,
  dialogue_reply: DialogueReply,
  speak_aloud: SpeakAloud,
  write_character: WriteCharacter,
};

function arraysMatch(a, b) {
  return Array.isArray(a) && a.length === b.length && a.every((id, i) => id === b[i]);
}

export const CORRECTNESS = {
  pick_image: (exercise, answer) => answer === exercise.targetId,
  pick_translation: (exercise, answer) => answer === exercise.targetId,
  pick_audio: (exercise, answer) => answer === exercise.targetId,
  arrange_from_audio: (exercise, answer) => {
    const sentence = sentenceById.get(exercise.targetSentenceId);
    return !!sentence && arraysMatch(answer, sentence.tokens);
  },
  complete_translation: (exercise, answer) => {
    const sentence = sentenceById.get(exercise.targetSentenceId);
    if (!sentence) return false;
    const correctId = sentence.tokens[exercise.blankIndex];
    return Array.isArray(answer) ? answer[0] === correctId : answer === correctId;
  },
  translate_sentence: (exercise, answer) => {
    const sentence = sentenceById.get(exercise.targetSentenceId);
    if (!sentence) return false;
    if (Array.isArray(answer)) return arraysMatch(answer, sentence.tokens);
    if (typeof answer === "string") return answer.trim() === sentence.hanzi.trim();
    return false;
  },
  dialogue_reply: (exercise, answer) => answer === exercise.correctId,
  speak_aloud: (exercise, answer) => answer?.tier === "perfect",
  // write_character is self-reporting (see src/lib/exerciseKind.js) - it
  // never goes through the select-then-check flow that calls this, but the
  // entry is kept so every exercise type has one, consistent with the rest
  // of this map, and useable by anything else that wants a uniform checker.
  write_character: (exercise, answer) => answer?.correct === true,
};

export default function QuestionRenderer({ exercise, ...props }) {
  const Component = EXERCISE_COMPONENTS[exercise.type];
  if (!Component) return null;
  return <Component exercise={exercise} {...props} />;
}
