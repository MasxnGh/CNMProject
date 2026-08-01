import { Volume2 } from "lucide-react";
import { useState } from "react";
import Button from "../ui/Button.jsx";
import { playSentence } from "../../lib/audio.js";

/**
 * dujeen-quest-gameplay-prompts.md Prompt B #2 - "ประโยคนี้แปลว่าอะไร".
 * exercise: { sentence, tokens: [{hanzi, pinyin}], options: string[], correctIndex }
 */
export default function PickTranslation({ exercise, onAnswer }) {
  const [selected, setSelected] = useState(null);
  const [locked, setLocked] = useState(false);
  const { sentence, tokens, options, correctIndex } = exercise;

  const replay = () => playSentence(sentence.id);

  const pick = (index) => {
    if (locked) return;
    setSelected(index);
    replay();
  };

  const submit = () => {
    if (selected === null || locked) return;
    setLocked(true);
    onAnswer(selected === correctIndex);
  };

  return (
    <div className="exercise">
      <div className="exercise-prompt-area">
        <p className="exercise-instruction">ประโยคนี้แปลว่าอะไร</p>
        <div className="exercise-prompt">
          <button type="button" className="exercise-speaker" onClick={replay} aria-label="ฟังเสียงภาษาจีน">
            <Volume2 size={26} />
          </button>
          <div className="exercise-sentence">
            {tokens.map((token, index) => (
              <span key={`${token.hanzi}-${index}`} className="exercise-sentence-word">
                <small>{token.pinyin}</small>
                {token.hanzi}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="exercise-options-area">
        <div className="exercise-option-list">
          {options.map((option, index) => (
            <button
              key={option}
              type="button"
              className={`exercise-option-row ${selected === index ? "is-selected" : ""}`}
              onClick={() => pick(index)}
              disabled={locked}
              aria-pressed={selected === index}
            >
              {option}
            </button>
          ))}
        </div>

        <Button onClick={submit} disabled={selected === null || locked}>
          ตรวจคำตอบ
        </Button>
      </div>
    </div>
  );
}
