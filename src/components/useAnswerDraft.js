import { useEffect, useState } from "react";

const HANZI = /[㐀-鿿]/;

/** Only Chinese text is worth speaking back — a Thai gloss or a bare pinyin
 *  syllable would either be read in the wrong language or, for tone missions,
 *  hand over the answer. */
export const containsHanzi = (value) => typeof value === "string" && HANZI.test(value);

/**
 * Holds the answer a player has picked but not yet committed, so choosing and
 * checking are two steps. That separation is what lets the game read a choice
 * aloud: with instant submit the verdict landed before the audio started.
 */
export default function useAnswerDraft({ missionId, disabled, onPlayAudio }) {
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setSelected(null);
  }, [missionId]);

  const pick = (option) => {
    if (disabled) return;
    setSelected(option);
    if (containsHanzi(option)) onPlayAudio?.({ text: option });
  };

  return { selected, pick, clear: () => setSelected(null) };
}
