import { useEffect, useMemo, useRef, useState } from "react";
import { sentenceById, vocabById } from "./content.js";
import { pickChapterDecoyWords } from "../../lib/distractors.js";
import { playOnSelect } from "../../lib/audioPolicy.js";
import { useChipArrangement } from "../game/useChipArrangement.js";
import { useChipFlip } from "../game/useChipFlip.js";
import ChipSlots from "../game/ChipSlots.jsx";
import ChipTray from "../game/ChipTray.jsx";
import "../game/chips.css";

export default function TranslateSentence({ exercise, selected, checked, onPick, checkButton }) {
  const sentence = sentenceById.get(exercise.targetSentenceId);
  const correctIds = sentence.tokens;

  const decoyIds = useMemo(
    () => pickChapterDecoyWords(correctIds, 2, exercise.chapterId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  );

  const arrangement = useChipArrangement(correctIds, decoyIds, correctIds.length);
  const containerRef = useRef(null);
  const { capture } = useChipFlip(containerRef);

  const [typedMode, setTypedMode] = useState(false);
  const [typedValue, setTypedValue] = useState("");

  useEffect(() => {
    if (typedMode) return;
    onPick(arrangement.isComplete ? arrangement.slots : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrangement.slots.join(","), typedMode]);

  useEffect(() => {
    if (!typedMode) return;
    onPick(typedValue.trim() ? typedValue : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typedValue, typedMode]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Backspace" && !checked && !typedMode) {
        event.preventDefault();
        arrangement.removeLast();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, typedMode]);

  const allCorrect =
    checked &&
    (Array.isArray(selected)
      ? selected.every((id, i) => id === correctIds[i])
      : typeof selected === "string" && selected.trim() === sentence.hanzi.trim());

  const [revealCount, setRevealCount] = useState(0);

  useEffect(() => {
    if (!checked || typedMode) {
      setRevealCount(0);
      return undefined;
    }
    if (allCorrect) {
      let i = 0;
      const interval = setInterval(() => {
        i += 1;
        setRevealCount(i);
        if (i >= correctIds.length) {
          clearInterval(interval);
        }
      }, 120);
      return () => clearInterval(interval);
    }
    setRevealCount(correctIds.length);
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, allCorrect, typedMode]);

  const slotStatus =
    checked && !typedMode
      ? correctIds.map((correctId, i) => {
          if (allCorrect) return i < revealCount ? "good" : undefined;
          return selected?.[i] === correctId ? "good" : "bad";
        })
      : undefined;

  const handleTrayClick = (chipId) => {
    if (checked) return;
    capture(chipId);
    arrangement.placeChip(chipId);
    playOnSelect(exercise, chipId);
  };

  const handleSlotClick = (index) => {
    if (checked) return;
    const chipId = arrangement.slots[index];
    if (!chipId) return;
    capture(chipId);
    arrangement.returnChip(index);
    playOnSelect(exercise, chipId);
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">แปลประโยคนี้เป็นภาษาจีน</div>
        <div className="word">
          <div className="chipThaiPrompt">{sentence.th}</div>
        </div>
      </div>
      <div>
        {!typedMode ? (
          <>
            <div className="chipStage" ref={containerRef}>
              <ChipSlots
                slots={arrangement.slots}
                chipRegistry={vocabById}
                nextIndex={arrangement.nextSlotIndex}
                onSlotClick={handleSlotClick}
                slotStatus={slotStatus}
                disabled={checked}
              />
              <ChipTray tray={arrangement.tray} chipRegistry={vocabById} onChipClick={handleTrayClick} disabled={checked} />
            </div>
            <button type="button" className="chipSwitchInput" onClick={() => setTypedMode(true)} disabled={checked}>
              สลับไปพิมพ์เอง
            </button>
          </>
        ) : (
          <>
            <input
              type="text"
              className="chipTextInput"
              value={typedValue}
              onChange={(event) => setTypedValue(event.target.value)}
              disabled={checked}
              placeholder="พิมพ์ประโยคภาษาจีน..."
            />
            <button type="button" className="chipSwitchInput" onClick={() => setTypedMode(false)} disabled={checked}>
              สลับไปแตะคำ
            </button>
          </>
        )}
        {checked && !allCorrect && (
          <div className="chipContext">
            เฉลย: <b>{sentence.hanzi}</b> <i>({sentence.pinyin})</i>
          </div>
        )}
        {checkButton}
      </div>
    </>
  );
}
