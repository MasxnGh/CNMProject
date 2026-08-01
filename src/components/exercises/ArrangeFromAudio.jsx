import { Turtle, Volume2 } from "lucide-react";
import { useEffect } from "react";
import ChipSlots from "../game/ChipSlots.jsx";
import ChipTray from "../game/ChipTray.jsx";
import useChipArrangement from "../game/useChipArrangement.js";
import useChipReveal from "../game/useChipReveal.js";
import Button from "../ui/Button.jsx";
import { playSentence } from "../../lib/audio.js";

/**
 * dujeen-quest-gameplay-prompts.md Prompt C - "เรียงคำตามที่ได้ยิน", no
 * Chinese text shown up front.
 * exercise: { sentence, tokens: vocabEntry[] (correct order), poolChips: vocabEntry[] (shuffled + 1-2 distractors) }
 */
export default function ArrangeFromAudio({ exercise, onAnswer }) {
  const { sentence, tokens, poolChips } = exercise;
  const correctIds = tokens.map((token) => token.id);
  const { placement, trayChips, place, remove, removeLast, isFull, nextEmptyIndex } = useChipArrangement(poolChips, tokens.length);
  const { revealState, locked, submit } = useChipReveal({ placement, correctIds, sentenceAudioId: sentence.id, onAnswer });

  useEffect(() => {
    playSentence(sentence.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <div className="exercise-audio-buttons">
          <button type="button" className="exercise-speaker exercise-speaker-big" onClick={() => playSentence(sentence.id)} aria-label="ฟังเสียงปกติ">
            <Volume2 size={30} />
          </button>
          <button type="button" className="exercise-speaker exercise-speaker-big" onClick={() => playSentence(sentence.id, { slow: true })} aria-label="ฟังเสียงช้า">
            <Turtle size={30} />
          </button>
        </div>
        <p className="exercise-instruction">เรียงคำตามที่ได้ยิน</p>
      </div>

      <div className="exercise-options-area">
        <ChipSlots placement={placement} nextEmptyIndex={nextEmptyIndex} onRemove={remove} disabled={locked} revealState={revealState} />
        <ChipTray chips={trayChips} onPick={place} disabled={locked} />
        <Button onClick={submit} disabled={!isFull || locked}>
          ตรวจคำตอบ
        </Button>
      </div>
    </div>
  );
}
