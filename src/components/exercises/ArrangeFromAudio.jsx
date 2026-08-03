import { useEffect, useMemo, useRef, useState } from "react";
import { sentenceById, vocabById } from "./content.js";
import { pickChapterDecoyWords } from "../../lib/distractors.js";
import { manualReplay, playOnSelect } from "../../lib/audioPolicy.js";
import { useChipArrangement } from "../game/useChipArrangement.js";
import { useChipFlip } from "../game/useChipFlip.js";
import ChipTray from "../game/ChipTray.jsx";
import "../game/chips.css";

function randomDecoyCount() {
  return Math.random() < 0.5 ? 2 : 3;
}

// A proper noun (or the sentence's first word) can be pre-placed via
// exercise.prefilledIndex, so the puzzle only covers the tokens actually
// worth arranging - the interactive slots below skip that position.
export default function ArrangeFromAudio({ exercise, selected, checked, onPick, checkButton }) {
  const sentence = sentenceById.get(exercise.targetSentenceId);
  const correctIds = sentence.tokens;
  const prefilledIndex = exercise.prefilledIndex ?? null;

  const puzzleIds = useMemo(
    () => correctIds.filter((_, i) => i !== prefilledIndex),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  );

  // Maps a position in the full sentence to its index within the puzzle
  // slots - null at the pre-filled position, which isn't part of the puzzle.
  const puzzleIndexAt = useMemo(() => {
    let counter = 0;
    return correctIds.map((_, i) => {
      if (i === prefilledIndex) return null;
      const idx = counter;
      counter += 1;
      return idx;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const decoyIds = useMemo(
    () => pickChapterDecoyWords(correctIds, randomDecoyCount(), exercise.chapterId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  );

  const arrangement = useChipArrangement(puzzleIds, decoyIds, puzzleIds.length);
  const containerRef = useRef(null);
  const { capture } = useChipFlip(containerRef);

  const withPrefilled = (puzzleSlots) => {
    if (prefilledIndex == null) return puzzleSlots;
    const result = [...puzzleSlots];
    result.splice(prefilledIndex, 0, correctIds[prefilledIndex]);
    return result;
  };

  useEffect(() => {
    onPick(arrangement.isComplete ? withPrefilled(arrangement.slots) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrangement.slots.join(",")]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Backspace" && !checked) {
        event.preventDefault();
        arrangement.removeLast();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  const allCorrect = checked && Array.isArray(selected) && selected.every((id, i) => id === correctIds[i]);
  const [revealCount, setRevealCount] = useState(0);

  useEffect(() => {
    if (!checked) {
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
  }, [checked, allCorrect]);

  const slotStatus = checked
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

  const handleSlotClick = (puzzleIndex) => {
    if (checked) return;
    const chipId = arrangement.slots[puzzleIndex];
    if (!chipId) return;
    capture(chipId);
    arrangement.returnChip(puzzleIndex);
    playOnSelect(exercise, chipId);
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">คุณได้ยินว่าอะไร?</div>
        <div className="word">
          <button type="button" className="spk" onClick={() => manualReplay(sentence.id)}>
            🔊
          </button>
          <button type="button" className="spk" onClick={() => manualReplay(sentence.id, { slow: true })}>
            🐢
          </button>
        </div>
      </div>
      <div>
        <div className="chipStage" ref={containerRef}>
          <div className="chipSlotsRow">
            {correctIds.map((correctId, i) => {
              if (i === prefilledIndex) {
                return (
                  <span key={`fixed-${i}`} className="chipFixedToken">
                    {vocabById.get(correctId)?.hanzi}
                  </span>
                );
              }
              const puzzleIndex = puzzleIndexAt[i];
              const chipId = arrangement.slots[puzzleIndex];
              const chip = chipId ? vocabById.get(chipId) : null;
              const status = slotStatus?.[i];
              const className = [
                "chipSlot",
                chip && "filled",
                !chip && puzzleIndex === arrangement.nextSlotIndex && "next",
                status,
              ]
                .filter(Boolean)
                .join(" ");
              return (
                <div key={i} className={className}>
                  {chip && (
                    <button
                      type="button"
                      className="wordChip"
                      data-chip-id={chip.id}
                      onClick={() => handleSlotClick(puzzleIndex)}
                      disabled={checked}
                    >
                      {chip.hanzi}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <ChipTray tray={arrangement.tray} chipRegistry={vocabById} onChipClick={handleTrayClick} disabled={checked} />
        </div>
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
