import { Keyboard, LayoutGrid, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import ChipSlots from "../game/ChipSlots.jsx";
import ChipTray from "../game/ChipTray.jsx";
import useChipArrangement from "../game/useChipArrangement.js";
import useChipReveal from "../game/useChipReveal.js";
import Button from "../ui/Button.jsx";
import { playSentence, speakThai } from "../../lib/audio.js";

/** Punctuation-and-whitespace-insensitive compare for the typed-answer path. */
const normalizeHanzi = (text) => text.replace(/[\s。！？，、]/g, "");

/**
 * dujeen-quest-gameplay-prompts.md Prompt C - "แปลประโยคนี้เป็นภาษาจีน", with
 * a toggle to type the answer instead of arranging chips.
 * exercise: { sentence, tokens: vocabEntry[] (correct order), poolChips: vocabEntry[] (all needed + 2 distractors) }
 */
export default function TranslateSentence({ exercise, onAnswer }) {
  const { sentence, tokens, poolChips } = exercise;
  const correctIds = tokens.map((token) => token.id);
  const [typing, setTyping] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const [typedLocked, setTypedLocked] = useState(false);

  const { placement, trayChips, place, remove, removeLast, isFull, nextEmptyIndex } = useChipArrangement(poolChips, tokens.length);
  const { revealState, locked, submit } = useChipReveal({ placement, correctIds, sentenceAudioId: sentence.id, onAnswer });

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Backspace" && !locked && !typing) {
        event.preventDefault();
        removeLast();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [locked, removeLast, typing]);

  const submitTyped = () => {
    if (typedLocked || !typedValue.trim()) return;
    setTypedLocked(true);
    const isCorrect = normalizeHanzi(typedValue) === normalizeHanzi(sentence.hanzi);
    if (isCorrect) playSentence(sentence.id);
    onAnswer(isCorrect);
  };

  return (
    <div className="exercise">
      <div className="exercise-prompt-area">
        <div className="exercise-prompt">
          <button type="button" className="exercise-speaker" onClick={() => speakThai(sentence.th)} aria-label="ฟังเสียงภาษาไทย">
            <Volume2 size={26} />
          </button>
          <p className="exercise-thai-sentence">{sentence.th}</p>
        </div>
        <p className="exercise-instruction">แปลประโยคนี้เป็นภาษาจีน</p>
        <button
          type="button"
          className="exercise-mode-toggle"
          onClick={() => setTyping((value) => !value)}
          disabled={locked || typedLocked}
        >
          {typing ? <LayoutGrid size={16} /> : <Keyboard size={16} />}
          {typing ? "สลับไปเลือกชิปคำ" : "สลับไปพิมพ์เอง"}
        </button>
      </div>

      <div className="exercise-options-area">
        {typing ? (
          <>
            <input
              type="text"
              className="exercise-type-input"
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              disabled={typedLocked}
              placeholder="พิมพ์คำแปลภาษาจีน"
              lang="zh-CN"
            />
            <Button onClick={submitTyped} disabled={!typedValue.trim() || typedLocked}>
              ตรวจคำตอบ
            </Button>
          </>
        ) : (
          <>
            <ChipSlots placement={placement} nextEmptyIndex={nextEmptyIndex} onRemove={remove} disabled={locked} revealState={revealState} />
            <ChipTray chips={trayChips} onPick={place} disabled={locked} />
            <Button onClick={submit} disabled={!isFull || locked}>
              ตรวจคำตอบ
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
