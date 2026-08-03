import { useEffect, useRef, useState } from "react";
import HanziWriter from "hanzi-writer";
import { vocabById, playEntry } from "./content.js";
import { buildWriterOptions } from "./hanziWriterConfig.js";
import { useWritingQuiz } from "./useWritingQuiz.js";
import { useWriteGlow } from "./useWriteGlow.js";
import WritingStage from "./WritingStage.jsx";
import { classifyWriteResult } from "./writeCharacterResult.js";
import { playTap, playWrong } from "../../lib/sfx.js";
import { hapticCorrect, hapticWrong } from "../../lib/haptics.js";
import "./WriteCharacter.css";

const HARD_MISTAKE_THRESHOLD = 5;

function onMistakeSound() {
  playWrong();
  hapticWrong();
}

function onCorrectSound() {
  playTap();
  hapticCorrect();
}

// entry.hanzi may be 1-2 characters (vocab.writable only allows up to 2) -
// each is written in turn on the same canvas via HanziWriter.setCharacter,
// driven by useWritingQuiz.
export default function WriteCharacter({ exercise, guided = true, onResult, onUnavailable }) {
  const target = vocabById.get(exercise.targetId);
  const characters = target ? [...target.hanzi] : [];

  const containerRef = useRef(null);
  const glowRef = useRef(null);
  const writerRef = useRef(null);
  const canvasSizeRef = useRef(0);
  const onResultRef = useRef(onResult);
  const onUnavailableRef = useRef(onUnavailable);

  const [unavailable, setUnavailable] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    onResultRef.current = onResult;
    onUnavailableRef.current = onUnavailable;
  });

  const { charIndex, canUndo, startWord, handleUndo, handleClearAll, handleWatchDemo, giveUp } = useWritingQuiz(
    writerRef,
    { onMistakeSound, onCorrectSound },
  );

  useWriteGlow(containerRef, glowRef);

  const handleWordComplete = ({ gaveUp, usedHint, totalMistakes, drawnPaths }) => {
    const quality = classifyWriteResult({
      gaveUp,
      usedHint,
      totalMistakes,
      hardMistakeThreshold: HARD_MISTAKE_THRESHOLD,
    });

    if (!gaveUp) setCompleted(true);
    onResultRef.current?.({
      correct: !gaveUp,
      quality,
      usedHint,
      totalMistakes,
      drawnPaths,
      canvasSize: canvasSizeRef.current,
    });
  };

  useEffect(() => {
    const containerNode = containerRef.current;
    if (characters.length === 0 || !containerNode) return undefined;

    const size = containerNode.clientWidth;
    canvasSizeRef.current = size;
    const writer = HanziWriter.create(
      containerNode,
      characters[0],
      buildWriterOptions({
        size,
        guided,
        onLoadCharDataError: () => {
          setUnavailable(true);
          onUnavailableRef.current?.();
        },
      }),
    );
    writerRef.current = writer;
    startWord(characters, handleWordComplete);

    return () => {
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
      // HanziWriter has no destroy() - it injects an <svg> straight into this
      // node with no way to detach it otherwise, which leaks a second,
      // still-listening instance on the next mount (React StrictMode's
      // double-invoke makes this obvious, but it'd leak on any real remount
      // too, e.g. moving between write_character questions).
      containerNode.replaceChildren();
    };
    // Mounts once per exercise attempt - the parent remounts this component
    // via a `key` change when the question itself changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!target || characters.length === 0 || unavailable) return null;

  return (
    <>
      <div className="quizL">
        <div className="ask">เขียนตัวอักษรนี้</div>
        <div className="word">
          <button type="button" className="spk" onClick={() => playEntry(target.id)}>
            🔊
          </button>
          <div>
            <div className="py">{target.pinyin}</div>
            <div className="writeTh">{target.th}</div>
          </div>
        </div>
        {characters.length > 1 && (
          <div className="writeCharProgress">
            ตัวที่ {charIndex + 1}/{characters.length}
          </div>
        )}
      </div>

      <div>
        <WritingStage containerRef={containerRef} glowRef={glowRef} completed={completed} />

        <div className="writeHelpers">
          <button type="button" className="writeHelperBtn" onClick={handleUndo} disabled={!canUndo}>
            ↩ ลบขีดล่าสุด
          </button>
          <button type="button" className="writeHelperBtn" onClick={handleClearAll}>
            ล้างทั้งหมด
          </button>
          <button type="button" className="writeHelperBtn" onClick={handleWatchDemo}>
            👁 ดูวิธีเขียน
          </button>
        </div>
        <button type="button" className="writeGiveUp" onClick={giveUp}>
          ยอมแพ้ ข้ามข้อนี้
        </button>
      </div>
    </>
  );
}
