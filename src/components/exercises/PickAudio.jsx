import { resolveEntry } from "./content.js";
import { manualReplay, playOnSelect } from "../../lib/audioPolicy.js";
import ChoiceGrid from "./ChoiceGrid.jsx";

export default function PickAudio({ exercise, selected, checked, onPick, checkButton }) {
  const target = resolveEntry(exercise.targetId);
  const choices = exercise.choiceIds.map(resolveEntry);

  const handlePick = (id) => {
    playOnSelect(exercise, id);
    onPick(id);
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">ฟังแล้วเลือกคำที่ตรงกัน</div>
        <div className="word">
          <button type="button" className="spk" onClick={() => manualReplay(target.id)}>
            🔊
          </button>
          <button type="button" className="spk" onClick={() => manualReplay(target.id, { slow: true })}>
            🐢
          </button>
        </div>
      </div>
      <div>
        <ChoiceGrid
          choices={choices}
          selected={selected}
          correctId={exercise.targetId}
          checked={checked}
          onPick={handlePick}
          optClassName="optAudio"
          renderChoice={(entry) => (
            <>
              <div className="hz optAudioHz">{entry.hanzi}</div>
              <div className="py">{entry.pinyin}</div>
            </>
          )}
        />
        {checkButton}
      </div>
    </>
  );
}
