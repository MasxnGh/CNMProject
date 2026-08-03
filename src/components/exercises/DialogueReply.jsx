import { resolveEntry } from "./content.js";
import { manualReplay, playOnSelect } from "../../lib/audioPolicy.js";
import ChoiceGrid from "./ChoiceGrid.jsx";
import "../game/chat.css";

export default function DialogueReply({ exercise, selected, checked, onPick, checkButton }) {
  const promptId = exercise.promptId || exercise.promptSentenceId;
  const prompt = resolveEntry(promptId);
  const choices = exercise.choiceIds.map(resolveEntry);
  const correctId = exercise.correctId;
  const isCorrect = checked && selected === correctId;
  const chosenEntry = selected ? resolveEntry(selected) : null;
  const correctEntry = resolveEntry(correctId);

  const handlePick = (id) => {
    if (checked) return;
    playOnSelect(exercise, id);
    onPick(id);
  };

  const playerClass = [
    "chatBubble",
    "player",
    chosenEntry && "filled",
    checked && isCorrect && "correct",
    checked && !isCorrect && "shake",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <div className="quizL">
        <div className="ask">เลือกคำตอบที่เหมาะสม</div>
      </div>
      <div>
        <div className="chatBubbleRow left">
          <div className="chatBubble prompt">
            <button type="button" className="spk chatSpk" onClick={() => manualReplay(promptId)}>
              🔊
            </button>
            <button type="button" className="spk chatSpk" onClick={() => manualReplay(promptId, { slow: true })}>
              🐢
            </button>
            <div>
              <div className="py">{prompt.pinyin}</div>
              <div className="hz chatHz">{prompt.hanzi}</div>
            </div>
          </div>
        </div>

        <div className="chatBubbleRow right">
          <div className={playerClass}>
            {chosenEntry ? (
              <div>
                <div className="py">{chosenEntry.pinyin}</div>
                <div className="hz chatHz">{chosenEntry.hanzi}</div>
              </div>
            ) : (
              <span>เลือกคำตอบด้านล่าง</span>
            )}
          </div>
        </div>

        <ChoiceGrid
          choices={choices}
          selected={selected}
          correctId={correctId}
          checked={checked}
          onPick={handlePick}
          optClassName="optDialogue"
          renderChoice={(entry) => (
            <>
              <div className="hz optDialogueHz">{entry.hanzi}</div>
              <div className="py">{entry.pinyin}</div>
              <div className="optDialogueTh">{entry.th}</div>
            </>
          )}
        />

        {checked && !isCorrect && (
          <div className="chipContext">
            คำตอบที่ถูกต้องคือ <b>{correctEntry.hanzi}</b> ({correctEntry.pinyin}) — {correctEntry.th}
            {chosenEntry && (
              <>
                <br />
                &ldquo;{chosenEntry.hanzi}&rdquo; ({chosenEntry.th}) ยังไม่ใช่คำตอบของประโยคนี้
              </>
            )}
          </div>
        )}

        {checkButton}
      </div>
    </>
  );
}
