import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import HanziWriter from "hanzi-writer";
import vocab from "../content/vocab.json";
import { useProgress } from "../lib/progress.js";
import { recordWriteCompletion } from "../lib/writeProgress.js";
import { buildWriterOptions } from "../components/exercises/hanziWriterConfig.js";
import { useWritingQuiz } from "../components/exercises/useWritingQuiz.js";
import { useWriteGlow } from "../components/exercises/useWriteGlow.js";
import WritingStage from "../components/exercises/WritingStage.jsx";
import { manualReplay } from "../lib/audioPolicy.js";
import { playTap, playWrong } from "../lib/sfx.js";
import { hapticCorrect, hapticWrong } from "../lib/haptics.js";
import Button from "../components/ui/Button.jsx";
import "../components/exercises/exercises.css";
import "./FreeWrite.css";

function onMistakeSound() {
  playWrong();
  hapticWrong();
}

function onCorrectSound() {
  playTap();
  hapticCorrect();
}

export default function FreeWrite() {
  const navigate = useNavigate();
  const [progress, setProgress] = useProgress();

  // Free-write still writes a whole word sequentially (unlike the
  // write_character exercise, which now only ever asks for one character),
  // so a word only qualifies here if every one of its characters is
  // writable, not just some of them.
  const knownWords = useMemo(
    () =>
      vocab.filter(
        (word) =>
          progress.completedLessons.includes(word.lessonId) &&
          [...word.hanzi].every((ch) => word.writableChars.includes(ch)),
      ),
    [progress.completedLessons],
  );

  const [selectedId, setSelectedId] = useState(null);
  const [guided, setGuided] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);

  const containerRef = useRef(null);
  const glowRef = useRef(null);
  const writerRef = useRef(null);
  const canvasSizeRef = useRef(0);
  const guidedRef = useRef(true);
  const selectedWordRef = useRef(null);

  const { charIndex, canUndo, startWord, handleUndo, handleClearAll, handleWatchDemo, giveUp } = useWritingQuiz(
    writerRef,
    { onMistakeSound, onCorrectSound },
  );

  useWriteGlow(containerRef, glowRef);

  const selectedWord = knownWords.find((word) => word.id === selectedId) || null;

  const handleWordComplete = (result) => {
    const word = selectedWordRef.current;
    setCompleted(!result.gaveUp);
    setGaveUp(result.gaveUp);
    if (result.gaveUp) writerRef.current?.showCharacter();

    setProgress((current) =>
      recordWriteCompletion(current, {
        correct: !result.gaveUp,
        guided: guidedRef.current,
        usedHint: result.usedHint,
        totalMistakes: result.totalMistakes,
        entryId: word?.id,
        hanzi: word?.hanzi,
        drawnPaths: result.drawnPaths,
        canvasSize: canvasSizeRef.current,
      }),
    );
  };

  // The writing container (WritingStage below) stays mounted for the whole
  // page - toggled with plain CSS, never conditionally rendered - so this
  // effect can create ONE HanziWriter instance the first time a word is
  // picked and then just reuse it via setCharacter/startWord from then on.
  // (Conditionally mounting the container per word would detach the
  // instance from a container that no longer exists in the DOM, and
  // recreating an instance per word would leak a global listener each time -
  // HanziWriter has no destroy(), see WriteCharacter.jsx's cleanup comment.)
  useEffect(() => {
    if (!selectedWord || !containerRef.current) return;
    selectedWordRef.current = selectedWord;
    setCompleted(false);
    setGaveUp(false);
    setUnavailable(false);

    const chars = [...selectedWord.hanzi];

    if (!writerRef.current) {
      const size = containerRef.current.clientWidth;
      canvasSizeRef.current = size;
      writerRef.current = HanziWriter.create(
        containerRef.current,
        chars[0],
        buildWriterOptions({
          size,
          guided: guidedRef.current,
          onLoadCharDataError: () => setUnavailable(true),
        }),
      );
      startWord(chars, handleWordComplete);
    } else {
      writerRef.current
        .setCharacter(chars[0])
        .then(() => startWord(chars, handleWordComplete))
        .catch(() => setUnavailable(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  useEffect(
    () => () => {
      writerRef.current?.cancelQuiz();
      writerRef.current = null;
      containerRef.current?.replaceChildren();
    },
    [],
  );

  const toggleGuided = (next) => {
    setGuided(next);
    guidedRef.current = next;
    if (!writerRef.current) return;
    if (next) writerRef.current.showOutline();
    else writerRef.current.hideOutline();
  };

  const handleWriteAgain = () => {
    if (!selectedWord || !writerRef.current) return;
    setCompleted(false);
    setGaveUp(false);
    startWord([...selectedWord.hanzi], handleWordComplete);
  };

  const handlePickAnother = () => {
    setSelectedId(null);
  };

  const charCount = selectedWord ? [...selectedWord.hanzi].length : 0;

  return (
    <div className="wrap">
      <div className="top">
        <button
          type="button"
          className="back"
          onClick={selectedWord ? handlePickAnother : () => navigate("/review")}
        >
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div className="h2">ฝึกเขียนอิสระ</div>
          <div className="h1">{selectedWord ? selectedWord.pinyin : "เลือกคำที่จะเขียน"}</div>
        </div>
      </div>

      {!selectedWord &&
        (knownWords.length === 0 ? (
          <div className="emptyState">
            <div className="emptyStateIcon">✍️</div>
            <h1>ยังไม่มีคำให้ฝึกเขียน</h1>
            <p>เรียนด่านแรกๆ ให้จบก่อน แล้วคำที่เขียนได้จะมาโผล่ที่นี่</p>
            <Button variant="primary" onClick={() => navigate("/chapters")}>
              ไปเรียน
            </Button>
          </div>
        ) : (
          <div className="writeWordGrid">
            {knownWords.map((word) => (
              <button type="button" key={word.id} className="writeWordChip" onClick={() => setSelectedId(word.id)}>
                <b>{word.hanzi}</b>
                <i>{word.pinyin}</i>
              </button>
            ))}
          </div>
        ))}

      {/* Always rendered (never conditionally mounted) so the HanziWriter
          instance created inside WritingStage's container survives picking
          a different word - just hidden with CSS while there's no word or
          data is missing. */}
      <div style={{ display: selectedWord && !unavailable ? "block" : "none" }}>
        <div className="guideToggle">
          <button type="button" className={guided ? "on" : ""} onClick={() => toggleGuided(true)}>
            โหมดมีเส้นนำทาง
          </button>
          <button type="button" className={!guided ? "on" : ""} onClick={() => toggleGuided(false)}>
            โหมดไม่มีเส้นนำทาง
          </button>
        </div>

        <div className="quizGrid">
          <div className="quizL">
            <div className="ask">เขียนตัวอักษรนี้</div>
            <div className="word">
              <button type="button" className="spk" onClick={() => selectedWord && manualReplay(selectedWord.id)}>
                🔊
              </button>
              <div>
                <div className="py">{selectedWord?.pinyin}</div>
                <div className="writeTh">{selectedWord?.th}</div>
              </div>
            </div>
            {charCount > 1 && (
              <div className="writeCharProgress">
                ตัวที่ {charIndex + 1}/{charCount}
              </div>
            )}
          </div>

          <div>
            <WritingStage containerRef={containerRef} glowRef={glowRef} completed={completed} />

            {(completed || gaveUp) && (
              <div className={["freeWriteFeedback", completed ? "ok" : "no"].join(" ")}>
                {completed ? "เขียนถูกแล้ว เก่งมาก!" : "ยังไม่ถูก ลองดูวิธีเขียนแล้วเขียนใหม่ได้เลย"}
              </div>
            )}

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

            {completed || gaveUp ? (
              <div className="freeWriteActions">
                <Button variant="primary" onClick={handleWriteAgain}>
                  เขียนใหม่
                </Button>
                <Button variant="ghost" onClick={handlePickAnother}>
                  เลือกคำอื่น
                </Button>
              </div>
            ) : (
              <button type="button" className="writeGiveUp" onClick={giveUp}>
                ยอมแพ้ ดูเฉลย
              </button>
            )}
          </div>
        </div>
      </div>

      {selectedWord && unavailable && (
        <div className="emptyState">
          <div className="emptyStateIcon">🏮</div>
          <h1>คำนี้ยังเขียนไม่ได้</h1>
          <p>ข้อมูลลำดับขีดของคำนี้ยังไม่มี ลองเลือกคำอื่นได้เลย</p>
          <Button variant="primary" onClick={handlePickAnother}>
            เลือกคำอื่น
          </Button>
        </div>
      )}
    </div>
  );
}
