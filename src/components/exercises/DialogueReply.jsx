import { Turtle, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../ui/Button.jsx";
import { playSentence } from "../../lib/audio.js";
import "../../styles/game-dialogue.css";

/**
 * dujeen-quest-gameplay-prompts.md Prompt D - "เลือกคำตอบให้ถูกบริบท",
 * shown as a chat screen.
 * exercise: { question: sentenceEntry, options: [{ id, hanzi, pinyin, th, correct, reason? }] }
 */
export default function DialogueReply({ exercise, onAnswer }) {
  const { question, options } = exercise;
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const chosenOption = options.find((option) => option.id === selected);

  useEffect(() => {
    playSentence(question.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pick = (option) => {
    if (locked) return;
    setSelected(option.id);
    playSentence(option.id);
  };

  const submit = () => {
    if (!selected || locked) return;
    setLocked(true);
    const isCorrect = chosenOption.correct;
    setOutcome(isCorrect ? "correct" : "wrong");
    setRevealed(true);

    if (isCorrect) {
      window.setTimeout(() => {
        playSentence(question.id);
        window.setTimeout(() => playSentence(chosenOption.id), 1000);
      }, 400);
      window.setTimeout(() => onAnswer(true), 2200);
    } else {
      window.setTimeout(() => onAnswer(false), 900);
    }
  };

  return (
    <div className="exercise">
      <div className="exercise-prompt-area">
        <div className="dialogue-bubble dialogue-bubble-left">
          <div className="dialogue-bubble-controls">
            <button type="button" onClick={() => playSentence(question.id)} aria-label="ฟังเสียงปกติ">
              <Volume2 size={18} />
            </button>
            <button type="button" onClick={() => playSentence(question.id, { slow: true })} aria-label="ฟังเสียงช้า">
              <Turtle size={18} />
            </button>
          </div>
          <div>
            <div className="dialogue-pinyin">{question.pinyin}</div>
            <strong className="dialogue-hanzi">{question.hanzi}</strong>
          </div>
        </div>

        <div className={`dialogue-bubble dialogue-bubble-right ${revealed ? "is-filled" : ""} ${outcome === "wrong" ? "is-wrong" : ""}`}>
          {revealed && chosenOption ? (
            <div>
              <div className="dialogue-pinyin">{chosenOption.pinyin}</div>
              <strong className="dialogue-hanzi">{chosenOption.hanzi}</strong>
            </div>
          ) : null}
        </div>

        {outcome === "wrong" ? (
          <div className="dialogue-reason">
            <p>
              คำตอบที่ถูกคือ <strong>{options.find((option) => option.correct).hanzi}</strong>
            </p>
            {chosenOption.reason ? <p>{chosenOption.reason}</p> : null}
          </div>
        ) : null}
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
              <small>{option.pinyin} · {option.th}</small>
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
