import { Volume2 } from "lucide-react";
import { useState } from "react";
import Button from "../ui/Button.jsx";
import { playWord } from "../../lib/audio.js";
import { resolveVisual } from "../../lib/visual.js";

/**
 * dujeen-quest-gameplay-prompts.md Prompt B #2 - "เลือกภาพที่ตรงกับคำนี้".
 * exercise: { prompt: vocabEntry, options: vocabEntry[], correctId }
 * Shared exercise contract: { exercise, onAnswer(isCorrect) }.
 */
export default function PickImage({ exercise, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const { prompt, options, correctId } = exercise;

  const pick = (vocabId) => {
    if (locked) return;
    setSelected(vocabId);
    playWord(vocabId);
  };

  const submit = () => {
    if (!selected || locked) return;
    setLocked(true);
    onAnswer(selected === correctId);
  };

  return (
    <div className="exercise">
      <div className="exercise-prompt-area">
        <div className="exercise-prompt">
          <button type="button" className="exercise-speaker" onClick={() => playWord(prompt.id)} aria-label="ฟังเสียงภาษาจีน">
            <Volume2 size={26} />
          </button>
          <div>
            <div className="exercise-pinyin">{prompt.pinyin}</div>
            <strong className="exercise-hanzi">{prompt.hanzi}</strong>
          </div>
        </div>
        <p className="exercise-instruction">เลือกภาพที่ตรงกับคำนี้</p>
      </div>

      <div className="exercise-options-area">
        <div className="exercise-image-grid">
          {options.map((option) => {
            const visual = resolveVisual(option);
            return (
              <button
                key={option.id}
                type="button"
                className={`exercise-image-card ${selected === option.id ? "is-selected" : ""}`}
                onClick={() => pick(option.id)}
                disabled={locked}
                aria-pressed={selected === option.id}
              >
                {visual.kind === "image" ? (
                  <img src={visual.value} alt={option.th} />
                ) : visual.kind === "emoji" ? (
                  <span className="exercise-card-emoji" aria-hidden="true">{visual.value}</span>
                ) : (
                  <span className="exercise-card-hanzi">{visual.value}</span>
                )}
              </button>
            );
          })}
        </div>

        <Button onClick={submit} disabled={!selected || locked}>
          ตรวจคำตอบ
        </Button>
      </div>
    </div>
  );
}
