import { Turtle, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../ui/Button.jsx";
import { playWord } from "../../lib/audio.js";

/**
 * dujeen-quest-gameplay-prompts.md Prompt B #2 - "ฟังแล้วเลือกคำที่ได้ยิน".
 * No Chinese text shown up front - the player must listen. Auto-plays the
 * target word once on mount.
 * exercise: { vocabId, options: vocabEntry[], correctId }
 */
export default function PickAudio({ exercise, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const { vocabId, options, correctId } = exercise;

  useEffect(() => {
    playWord(vocabId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (option) => {
    if (locked) return;
    setSelected(option.id);
    playWord(option.id);
  };

  const submit = () => {
    if (!selected || locked) return;
    setLocked(true);
    onAnswer(selected === correctId);
  };

  return (
    <div className="exercise">
      <div className="exercise-prompt-area">
        <p className="exercise-instruction">ฟังแล้วเลือกคำที่ได้ยิน</p>
        <div className="exercise-audio-buttons">
          <button type="button" className="exercise-speaker exercise-speaker-big" onClick={() => playWord(vocabId)} aria-label="ฟังเสียงปกติ">
            <Volume2 size={30} />
          </button>
          <button type="button" className="exercise-speaker exercise-speaker-big" onClick={() => playWord(vocabId, { slow: true })} aria-label="ฟังเสียงช้า">
            <Turtle size={30} />
          </button>
        </div>
      </div>

      <div className="exercise-options-area">
        <div className="exercise-option-list">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`exercise-option-row exercise-option-hanzi ${selected === option.id ? "is-selected" : ""}`}
              onClick={() => pick(option)}
              disabled={locked}
              aria-pressed={selected === option.id}
            >
              <strong>{option.hanzi}</strong>
              <small>{option.pinyin}</small>
            </button>
          ))}
        </div>

        <Button onClick={submit} disabled={!selected || locked}>
          ตรวจคำตอบ
        </Button>
      </div>
    </div>
  );
}
