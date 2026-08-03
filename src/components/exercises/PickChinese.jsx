import { useMemo } from "react";
import { sentenceById } from "./content.js";
import { playOnSelect } from "../../lib/audioPolicy.js";
import { shuffleChoices } from "../../lib/distractors.js";
import ChoiceGrid from "./ChoiceGrid.jsx";

// Reverse of PickTranslation: a Thai prompt (no audio - Thai never has
// audio, and the prompt itself isn't Chinese to speak yet) with four Chinese
// sentence choices to pick the matching one from. Distractors are authored
// inline (exercise.distractors: [{hanzi, pinyin}]) rather than real
// sentence ids, since they're synthetic near-misses (one swapped component)
// that never need their own audio - only the correct answer ever plays.
export default function PickChinese({ exercise, selected, checked, onPick, checkButton }) {
  const target = sentenceById.get(exercise.targetSentenceId);

  const choices = useMemo(() => {
    const correct = { id: exercise.targetSentenceId, hanzi: target.hanzi, pinyin: target.pinyin };
    const distractors = exercise.distractors.map((d, i) => ({ id: `d${i}`, hanzi: d.hanzi, pinyin: d.pinyin }));
    return shuffleChoices([correct, ...distractors]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const handlePick = (id) => {
    playOnSelect(exercise, id);
    onPick(id);
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">เลือกคำแปลที่ถูกต้อง</div>
        <div className="word">
          <div className="chipThaiPrompt">{target.th}</div>
        </div>
      </div>
      <div>
        <ChoiceGrid
          choices={choices}
          selected={selected}
          correctId={exercise.targetSentenceId}
          checked={checked}
          onPick={handlePick}
          optClassName="optAudio"
          renderChoice={(choice) => (
            <>
              <div className="py">{choice.pinyin}</div>
              <div className="hz optAudioHz">{choice.hanzi}</div>
            </>
          )}
        />
        {checkButton}
      </div>
    </>
  );
}
