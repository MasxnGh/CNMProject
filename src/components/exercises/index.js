import ArrangeFromAudio from "./ArrangeFromAudio.jsx";
import CompleteTranslation from "./CompleteTranslation.jsx";
import DialogueReply from "./DialogueReply.jsx";
import PickAudio from "./PickAudio.jsx";
import PickImage from "./PickImage.jsx";
import PickTranslation from "./PickTranslation.jsx";
import SpeakAloud from "./SpeakAloud.jsx";
import TranslateSentence from "./TranslateSentence.jsx";

/** dujeen-quest-gameplay-prompts.md Prompt B #1 - Lesson.jsx dispatches on
    exercise.type through this map, not nested ifs. Add new exercise types
    here as later prompts introduce them. */
export const exerciseComponents = {
  pickImage: PickImage,
  pickTranslation: PickTranslation,
  pickAudio: PickAudio,
  arrangeFromAudio: ArrangeFromAudio,
  completeTranslation: CompleteTranslation,
  translateSentence: TranslateSentence,
  dialogueReply: DialogueReply,
  speakAloud: SpeakAloud,
};
