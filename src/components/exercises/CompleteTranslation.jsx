import { useEffect, useMemo, useRef } from "react";
import { sentenceById } from "./content.js";
import { manualReplay, playOnSelect } from "../../lib/audioPolicy.js";
import { useChipArrangement } from "../game/useChipArrangement.js";
import { useChipFlip } from "../game/useChipFlip.js";
import ChipTray from "../game/ChipTray.jsx";
import "../game/chips.css";

// The Chinese sentence is always shown complete (it's the given); the blank
// lives in the Thai translation, filled from a small tray of Thai-text chips
// (correct + curated distractorTh from exercises.json). Thai chips never
// carry audio - tapping one is silent, same as reading the prompt itself.
export default function CompleteTranslation({ exercise, selected, checked, onPick, checkButton }) {
  const sentence = sentenceById.get(exercise.targetSentenceId);
  const correctText = exercise.thTokens[exercise.blankIndex];

  const chipRegistry = useMemo(() => {
    const all = [correctText, ...exercise.distractorTh];
    return new Map(all.map((text) => [text, { id: text, hanzi: text }]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const arrangement = useChipArrangement([correctText], exercise.distractorTh, 1);
  const containerRef = useRef(null);
  const { capture } = useChipFlip(containerRef);

  useEffect(() => {
    onPick(arrangement.isComplete ? arrangement.slots[0] : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrangement.slots.join(",")]);

  const isCorrect = checked && selected === correctText;
  const slotStatus = checked ? (isCorrect ? "good" : "bad") : null;

  const handleTrayClick = (chipText) => {
    if (checked) return;
    capture(chipText);
    arrangement.placeChip(chipText);
    playOnSelect(exercise, chipText);
  };

  const handleSlotClick = () => {
    if (checked) return;
    const chipText = arrangement.slots[0];
    if (!chipText) return;
    capture(chipText);
    arrangement.returnChip(0);
    playOnSelect(exercise, chipText);
  };

  const placedText = arrangement.slots[0];
  const slotClassName = ["chipSlot", placedText && "filled", !placedText && "next", slotStatus]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="quizL">
        <div className="ask">เติมคำแปลให้สมบูรณ์</div>
        <div className="word">
          <button type="button" className="spk" onClick={() => manualReplay(sentence.id)}>
            🔊
          </button>
          <div>
            <div className="py">{sentence.pinyin}</div>
            <div className="hz">{sentence.hanzi}</div>
          </div>
        </div>
      </div>
      <div>
        <div className="chipStage" ref={containerRef}>
          <div className="chipSlotsRow">
            {exercise.thTokens.map((token, i) => {
              if (i !== exercise.blankIndex) {
                return (
                  <span key={`${token}-${i}`} className="chipFixedToken">
                    {token}
                  </span>
                );
              }
              return (
                <div key="blank" className={slotClassName}>
                  {placedText && (
                    <button
                      type="button"
                      className="wordChip"
                      data-chip-id={placedText}
                      onClick={handleSlotClick}
                      disabled={checked}
                    >
                      {placedText}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <ChipTray tray={arrangement.tray} chipRegistry={chipRegistry} onChipClick={handleTrayClick} disabled={checked} />
        </div>
        {checked && !isCorrect && (
          <div className="chipContext">
            เฉลย: <b>{correctText}</b>
          </div>
        )}
        {checkButton}
      </div>
    </>
  );
}
