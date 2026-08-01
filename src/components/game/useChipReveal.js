import { useState } from "react";
import { playSentence } from "../../lib/audio.js";

const STAGGER_MS = 90;
const REVEAL_ANIM_MS = 400;

/**
 * dujeen-quest-gameplay-prompts.md Prompt C's answer-check step, shared by
 * all 3 chip exercises: reveal each slot correct/wrong (staggered via
 * ChipSlots' --reveal-delay), then - only once every slot is correct -
 * read the full sentence once before handing off to FeedbackBar.
 */
export default function useChipReveal({ placement, correctIds, sentenceAudioId, onAnswer }) {
  const [revealState, setRevealState] = useState(null);
  const [locked, setLocked] = useState(false);

  const submit = () => {
    if (locked) return;
    setLocked(true);
    const states = placement.map((chip, index) => (chip?.id === correctIds[index] ? "correct" : "wrong"));
    setRevealState(states);
    const allCorrect = states.every((state) => state === "correct");
    const revealDuration = placement.length * STAGGER_MS + REVEAL_ANIM_MS;
    window.setTimeout(() => {
      if (allCorrect && sentenceAudioId) playSentence(sentenceAudioId);
      onAnswer(allCorrect);
    }, revealDuration);
  };

  return { revealState, locked, submit };
}
