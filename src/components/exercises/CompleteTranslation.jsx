import { useEffect, useMemo, useRef } from "react";
import { sentenceById, vocabById, pickDecoyWords, playEntry } from "./content.js";
import { useChipArrangement } from "../game/useChipArrangement.js";
import { useChipFlip } from "../game/useChipFlip.js";
import ChipTray from "../game/ChipTray.jsx";
import "../game/chips.css";

export default function CompleteTranslation({ exercise, selected, checked, onPick, checkButton }) {
  const sentence = sentenceById.get(exercise.targetSentenceId);
  const correctId = sentence.tokens[exercise.blankIndex];

  const decoyIds = useMemo(
    () => pickDecoyWords([correctId], 3, exercise.chapterId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exercise.id],
  );

  const arrangement = useChipArrangement([correctId], decoyIds, 1);
  const containerRef = useRef(null);
  const { capture } = useChipFlip(containerRef);

  useEffect(() => {
    onPick(arrangement.isComplete ? arrangement.slots : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrangement.slots.join(",")]);

  const isCorrect = checked && selected?.[0] === correctId;
  const slotStatus = checked ? (isCorrect ? "good" : "bad") : null;

  const handleTrayClick = (chipId) => {
    if (checked) return;
    capture(chipId);
    arrangement.placeChip(chipId);
    playEntry(chipId);
  };

  const handleSlotClick = () => {
    if (checked) return;
    const chipId = arrangement.slots[0];
    if (!chipId) return;
    capture(chipId);
    arrangement.returnChip(0);
    playEntry(chipId);
  };

  const placedChip = arrangement.slots[0] ? vocabById.get(arrangement.slots[0]) : null;
  const slotClassName = ["chipSlot", placedChip && "filled", !placedChip && "next", slotStatus]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="quizL">
        <div className="ask">เติมคำที่หายไปให้ประโยคสมบูรณ์</div>
        <div className="word">
          <button type="button" className="spk" onClick={() => playEntry(sentence.id)}>
            🔊
          </button>
        </div>
      </div>
      <div>
        <div className="chipContext">{sentence.th}</div>
        <div className="chipStage" ref={containerRef}>
          <div className="chipSlotsRow">
            {sentence.tokens.map((tokenId, i) => {
              if (i !== exercise.blankIndex) {
                return (
                  <span key={`${tokenId}-${i}`} className="chipFixedToken">
                    {vocabById.get(tokenId)?.hanzi}
                  </span>
                );
              }
              return (
                <div key="blank" className={slotClassName}>
                  {placedChip && (
                    <button
                      type="button"
                      className="wordChip"
                      data-chip-id={placedChip.id}
                      onClick={handleSlotClick}
                      disabled={checked}
                    >
                      {placedChip.hanzi}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          <ChipTray tray={arrangement.tray} chipRegistry={vocabById} onChipClick={handleTrayClick} disabled={checked} />
        </div>
        {checked && !isCorrect && (
          <div className="chipContext">
            เฉลย: <b>{vocabById.get(correctId)?.hanzi}</b> <i>({vocabById.get(correctId)?.pinyin})</i>
          </div>
        )}
        {checkButton}
      </div>
    </>
  );
}
