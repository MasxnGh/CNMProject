import { useMemo } from "react";
import { resolveEntry, sentenceById } from "./content.js";
import { manualReplay, playOnSelect } from "../../lib/audioPolicy.js";
import { shuffleChoices } from "../../lib/distractors.js";
import ChoiceGrid from "./ChoiceGrid.jsx";

// Two modes share this component: word-level (targetId + choiceIds, the
// original design) and sentence-level (targetSentenceId + distractorTexts -
// curated near-miss Thai translations, since a "wrong" full-sentence
// translation isn't a real standalone vocab/sentence entity to reference).
export default function PickTranslation({ exercise, selected, checked, onPick, checkButton }) {
  const sentenceMode = !!exercise.targetSentenceId;
  const target = sentenceMode ? sentenceById.get(exercise.targetSentenceId) : resolveEntry(exercise.targetId);
  const correctId = exercise.targetSentenceId || exercise.targetId;

  const choices = useMemo(() => {
    if (sentenceMode) {
      const correct = { id: exercise.targetSentenceId, th: target.th };
      const distractors = exercise.distractorTexts.map((text, i) => ({ id: `d${i}`, th: text }));
      return shuffleChoices([correct, ...distractors]);
    }
    return shuffleChoices(exercise.choiceIds.map(resolveEntry));
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
          <button type="button" className="spk" onClick={() => manualReplay(target.id)}>
            🔊
          </button>
          <div>
            <div className="py">{target.pinyin}</div>
            <div className="hz">{target.hanzi}</div>
          </div>
        </div>
      </div>
      <div>
        <ChoiceGrid
          choices={choices}
          selected={selected}
          correctId={correctId}
          checked={checked}
          onPick={handlePick}
          optClassName="optText"
          renderChoice={(entry) => entry.th}
        />
        {checkButton}
      </div>
    </>
  );
}
