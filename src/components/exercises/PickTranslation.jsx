import { resolveEntry, playEntry } from "./content.js";
import ChoiceGrid from "./ChoiceGrid.jsx";

export default function PickTranslation({ exercise, selected, checked, onPick, checkButton }) {
  const target = resolveEntry(exercise.targetId);
  const choices = exercise.choiceIds.map(resolveEntry);

  const handlePick = (id) => {
    playEntry(id);
    onPick(id);
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">เลือกคำแปลที่ถูกต้อง</div>
        <div className="word">
          <button type="button" className="spk" onClick={() => playEntry(target.id)}>
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
          correctId={exercise.targetId}
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
