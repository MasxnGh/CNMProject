import { Volume2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import ChipSlots from "../game/ChipSlots.jsx";
import ChipTray from "../game/ChipTray.jsx";
import useChipArrangement from "../game/useChipArrangement.js";
import useChipReveal from "../game/useChipReveal.js";
import Button from "../ui/Button.jsx";
import { speakThai } from "../../lib/audio.js";

/**
 * dujeen-quest-gameplay-prompts.md Prompt C - "เติมคำให้ประโยคสมบูรณ์".
 * exercise: { sentence, tokens: vocabEntry[] (full sequence),
 *   blankIndices: number[] (which positions the player fills),
 *   poolChips: vocabEntry[] (the blanked tokens + distractors) }
 */
export default function CompleteTranslation({ exercise, onAnswer }) {
  const { sentence, tokens, blankIndices, poolChips } = exercise;
  const correctIds = tokens.map((token) => token.id);
  const fixedSlots = useMemo(() => {
    const map = {};
    tokens.forEach((token, index) => {
      if (!blankIndices.includes(index)) map[index] = token;
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  const { placement, trayChips, place, remove, removeLast, isFull, nextEmptyIndex } = useChipArrangement(poolChips, tokens.length, fixedSlots);
  const { revealState, locked, submit } = useChipReveal({ placement, correctIds, sentenceAudioId: sentence.id, onAnswer });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Backspace" && !locked) {
        event.preventDefault();
        removeLast();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locked, removeLast]);

  return (
    <div className="exercise">
      <div className="exercise-prompt-area">
        <p className="exercise-instruction">เติมคำให้ประโยคสมบูรณ์</p>
        <div className="exercise-prompt">
          <button type="button" className="exercise-speaker" onClick={() => speakThai(sentence.th)} aria-label="ฟังเสียงภาษาไทย">
            <Volume2 size={26} />
          </button>
          <p className="exercise-thai-sentence">{sentence.th}</p>
        </div>
      </div>

      <div className="exercise-options-area">
        <ChipSlots placement={placement} fixedSlots={fixedSlots} nextEmptyIndex={nextEmptyIndex} onRemove={remove} disabled={locked} revealState={revealState} />
        <ChipTray chips={trayChips} onPick={place} disabled={locked} />
        <Button onClick={submit} disabled={!isFull || locked}>
          ตรวจคำตอบ
        </Button>
      </div>
    </div>
  );
}
