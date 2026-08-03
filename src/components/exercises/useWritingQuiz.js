import { useCallback, useRef, useState } from "react";
import { prefersReducedMotion } from "./hanziWriterConfig.js";

const HINT_AFTER_MISSES = 3;

// Drives a HanziWriter quiz across the 1-2 characters of a word mounted on
// `writerRef.current`, including undo/clear/watch-demo and drawn-path
// bookkeeping. Shared between WriteCharacter.jsx (one exercise, one mount)
// and the free-write page (one persistent instance reused across many words
// via setCharacter) - this bookkeeping is identical either way, and it's
// fiddly enough (stroke-index tracking, hint timing, path array slicing)
// that duplicating it would risk the two copies drifting out of sync.
export function useWritingQuiz(writerRef, { onMistakeSound, onCorrectSound } = {}) {
  const charactersRef = useRef([]);
  const onWordCompleteRef = useRef(() => {});
  const onCharDoneRef = useRef(() => {});
  const nextStrokeIndexRef = useRef(0);
  const missesOnStrokeRef = useRef(0);
  const totalMistakesRef = useRef(0);
  const usedHintRef = useRef(false);
  const charIndexRef = useRef(0);
  const drawnPathsRef = useRef([]);
  const charStartPathCountRef = useRef(0);

  const [charIndex, setCharIndex] = useState(0);
  const [canUndo, setCanUndo] = useState(false);

  const buildQuizOptions = useCallback(
    () => ({
      showHintAfterMisses: false,
      highlightOnComplete: true,
      onMistake: () => {
        totalMistakesRef.current += 1;
        missesOnStrokeRef.current += 1;
        onMistakeSound?.();

        if (missesOnStrokeRef.current === HINT_AFTER_MISSES) {
          const strokeNum = nextStrokeIndexRef.current;
          if (prefersReducedMotion()) {
            // Static color flash, not a drawing animation, and (unlike
            // animateStroke) never cancels the active quiz.
            writerRef.current.highlightStroke(strokeNum);
          } else {
            writerRef.current.animateStroke(strokeNum, {
              onComplete: () => {
                writerRef.current.quiz({ ...buildQuizOptions(), quizStartStrokeNum: strokeNum });
              },
            });
          }
        }
      },
      onCorrectStroke: (strokeData) => {
        missesOnStrokeRef.current = 0;
        nextStrokeIndexRef.current = strokeData.strokeNum + 1;
        drawnPathsRef.current.push(strokeData.drawnPath.pathString);
        setCanUndo(true);
        onCorrectSound?.();
      },
      onComplete: () => onCharDoneRef.current(),
    }),
    [writerRef, onMistakeSound, onCorrectSound],
  );

  const startCharacterAt = useCallback(
    (index) => {
      nextStrokeIndexRef.current = 0;
      missesOnStrokeRef.current = 0;
      charStartPathCountRef.current = drawnPathsRef.current.length;
      setCanUndo(false);

      onCharDoneRef.current = () => {
        const characters = charactersRef.current;
        if (index + 1 < characters.length) {
          const nextIndex = index + 1;
          charIndexRef.current = nextIndex;
          setCharIndex(nextIndex);
          writerRef.current.setCharacter(characters[nextIndex]).then(() => startCharacterAt(nextIndex));
        } else {
          onWordCompleteRef.current({
            gaveUp: false,
            usedHint: usedHintRef.current,
            totalMistakes: totalMistakesRef.current,
            drawnPaths: [...drawnPathsRef.current],
          });
        }
      };

      // Quiz.startQuiz() removes any in-progress drawn strokes itself, so a
      // plain quiz() restart is already a clean slate - no manual hide/clear needed.
      writerRef.current.quiz({ ...buildQuizOptions(), quizStartStrokeNum: 0 });
    },
    [writerRef, buildQuizOptions],
  );

  // Point the hook at a new word: `characters` is the array of hanzi chars,
  // `onWordComplete` fires once every character in it has been written.
  const startWord = useCallback(
    (characters, onWordComplete) => {
      charactersRef.current = characters;
      onWordCompleteRef.current = onWordComplete;
      charIndexRef.current = 0;
      setCharIndex(0);
      totalMistakesRef.current = 0;
      usedHintRef.current = false;
      drawnPathsRef.current = [];
      charStartPathCountRef.current = 0;
      startCharacterAt(0);
    },
    [startCharacterAt],
  );

  const handleUndo = useCallback(() => {
    const targetStrokeNum = Math.max(0, nextStrokeIndexRef.current - 1);
    nextStrokeIndexRef.current = targetStrokeNum;
    missesOnStrokeRef.current = 0;
    drawnPathsRef.current = drawnPathsRef.current.slice(0, -1);
    setCanUndo(targetStrokeNum > 0);
    writerRef.current?.quiz({ ...buildQuizOptions(), quizStartStrokeNum: targetStrokeNum });
  }, [writerRef, buildQuizOptions]);

  const handleClearAll = useCallback(() => {
    drawnPathsRef.current = drawnPathsRef.current.slice(0, charStartPathCountRef.current);
    startCharacterAt(charIndexRef.current);
  }, [startCharacterAt]);

  const handleWatchDemo = useCallback(() => {
    usedHintRef.current = true;
    const resumeAt = nextStrokeIndexRef.current;

    if (prefersReducedMotion()) {
      // Same static flash as the auto-hint, on whichever stroke is next -
      // no drawing animation, and the quiz is never interrupted.
      writerRef.current?.highlightStroke(resumeAt);
      return;
    }

    writerRef.current?.animateCharacter({
      onComplete: () => {
        writerRef.current.quiz({ ...buildQuizOptions(), quizStartStrokeNum: resumeAt });
      },
    });
  }, [writerRef, buildQuizOptions]);

  const giveUp = useCallback(() => {
    onWordCompleteRef.current({
      gaveUp: true,
      usedHint: usedHintRef.current,
      totalMistakes: totalMistakesRef.current,
      drawnPaths: [],
    });
  }, []);

  return { charIndex, canUndo, startWord, handleUndo, handleClearAll, handleWatchDemo, giveUp };
}
