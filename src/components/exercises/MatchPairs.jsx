import { useEffect, useMemo, useRef, useState } from "react";
import { vocabById } from "./content.js";
import { playOnSelect } from "../../lib/audioPolicy.js";
import { shuffleChoices } from "../../lib/distractors.js";
import { playTap, playWrong } from "../../lib/sfx.js";
import { hapticCorrect, hapticWrong } from "../../lib/haptics.js";
import "./MatchPairs.css";

const MISTAKE_HARD_MIN = 2;
const MISTAKE_AGAIN_MIN = 5;
const WRONG_FLASH_MS = 300;

function qualityFor(mistakes) {
  if (mistakes >= MISTAKE_AGAIN_MIN) return "again";
  if (mistakes >= MISTAKE_HARD_MIN) return "hard";
  return "good";
}

// Self-reporting (family B, like write_character) - there's no check button,
// the exercise finishes itself once every pair is matched. Audio side
// (left) must be listened to; the Thai side (right) never carries audio.
export default function MatchPairs({ exercise, onResult }) {
  const wordIds = exercise.wordIds;
  const leftWords = useMemo(() => wordIds.map((id) => vocabById.get(id)), [wordIds]);

  const rightOrder = useMemo(() => {
    let order = shuffleChoices(wordIds);
    if (order.every((id, i) => id === wordIds[i])) order = shuffleChoices(wordIds);
    return order;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);
  const rightWords = useMemo(() => rightOrder.map((id) => vocabById.get(id)), [rightOrder]);

  const [pending, setPending] = useState(null); // { side: 'left'|'right', id }
  const [matched, setMatched] = useState(() => new Set());
  const [fading, setFading] = useState(() => new Set());
  const [wrongPair, setWrongPair] = useState(null); // { leftId, rightId }
  const mistakesRef = useRef(0);
  const doneRef = useRef(false);
  const onResultRef = useRef(onResult);
  useEffect(() => {
    onResultRef.current = onResult;
  });

  useEffect(() => {
    if (matched.size === wordIds.length && !doneRef.current) {
      doneRef.current = true;
      const mistakes = mistakesRef.current;
      onResultRef.current?.({ correct: true, quality: qualityFor(mistakes), mistakes });
    }
  }, [matched, wordIds.length]);

  const handleTap = (side, id) => {
    if (matched.has(id) || wrongPair) return;

    // Every left (audio) tap plays that word's sound, whether it's starting
    // a fresh selection or being the second tap of a match attempt.
    if (side === "left") playOnSelect(exercise, id);

    if (!pending || pending.side === side) {
      setPending({ side, id });
      return;
    }

    const leftId = side === "left" ? id : pending.id;
    const rightId = side === "right" ? id : pending.id;
    setPending(null);

    if (leftId === rightId) {
      playTap();
      hapticCorrect();
      setMatched((prev) => new Set(prev).add(leftId));
      // One tick later, so the class change (and its CSS transition) starts
      // from the "just matched" green state rather than skipping straight
      // to faded.
      setTimeout(() => setFading((prev) => new Set(prev).add(leftId)), 0);
    } else {
      mistakesRef.current += 1;
      playWrong();
      hapticWrong();
      setWrongPair({ leftId, rightId });
      setTimeout(() => setWrongPair(null), WRONG_FLASH_MS);
    }
  };

  const cellClass = (side, id) => {
    const classes = ["matchCell", side === "left" ? "matchCellAudio" : "matchCellText"];
    if (matched.has(id)) classes.push("matched", fading.has(id) ? "matchedFaded" : "");
    else if (wrongPair && (side === "left" ? wrongPair.leftId === id : wrongPair.rightId === id)) classes.push("wrong");
    else if (pending?.side === side && pending.id === id) classes.push("selected");
    return classes.filter(Boolean).join(" ");
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">จับคู่ให้ถูกต้อง</div>
      </div>
      <div className="matchBoard">
        <div className="matchCol">
          {leftWords.map((word) => (
            <button
              key={word.id}
              type="button"
              className={cellClass("left", word.id)}
              onClick={() => handleTap("left", word.id)}
              disabled={matched.has(word.id)}
              aria-label={`ฟังเสียง ${word.hanzi}`}
            >
              {!matched.has(word.id) && "🔊"}
            </button>
          ))}
        </div>
        <div className="matchCol">
          {rightWords.map((word) => (
            <button
              key={word.id}
              type="button"
              className={cellClass("right", word.id)}
              onClick={() => handleTap("right", word.id)}
              disabled={matched.has(word.id)}
            >
              {!matched.has(word.id) && word.th}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
