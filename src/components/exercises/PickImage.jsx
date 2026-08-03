import { vocabById } from "./content.js";
import { manualReplay, playOnSelect } from "../../lib/audioPolicy.js";
import ChoiceGrid from "./ChoiceGrid.jsx";

const GRADIENT_ANGLES = [45, 90, 135, 180, 225, 270, 315, 360];

function angleFor(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return GRADIENT_ANGLES[hash % GRADIENT_ANGLES.length];
}

function VisualTile({ visual, hanzi }) {
  if (visual?.type === "image") {
    return <img src={visual.value} alt="" className="optVisual" />;
  }
  if (visual?.type === "emoji") {
    return (
      <span className="optVisual optEmoji" aria-hidden="true">
        {visual.value}
      </span>
    );
  }
  return (
    <span className="optVisual optHanziFallback" aria-hidden="true">
      {hanzi}
    </span>
  );
}

export default function PickImage({ exercise, selected, checked, onPick, checkButton }) {
  const target = vocabById.get(exercise.targetId);
  const choices = exercise.choiceIds.map((id) => vocabById.get(id));

  const handlePick = (id) => {
    playOnSelect(exercise, id);
    onPick(id);
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">เลือกภาพที่ตรงกับคำนี้</div>
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
          correctId={exercise.targetId}
          checked={checked}
          onPick={handlePick}
          optClassName="optVisualCard"
          getChoiceStyle={(word) => ({ "--card-angle": `${angleFor(word.id)}deg` })}
          renderChoice={(word) => (
            <>
              <VisualTile visual={word.visual} hanzi={word.hanzi} />
              <span className="optLabel">{word.th}</span>
            </>
          )}
        />
        {checkButton}
      </div>
    </>
  );
}
