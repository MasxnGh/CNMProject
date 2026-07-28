import { motion, useReducedMotion } from "framer-motion";
import { Check, Volume2 } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

const seedNumber = (seed) => {
  let hash = 2166136261;
  for (const character of String(seed)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

export const shuffleWithSeed = (items, seed) => {
  const result = [...items];
  let state = seedNumber(seed) || 1;
  const random = () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
};

const removeFirst = (items, itemToRemove) => {
  const index = items.indexOf(itemToRemove);
  if (index < 0) return items;
  return [...items.slice(0, index), ...items.slice(index + 1)];
};

const findDerangedRightOrder = (leftOptions, rightOptions, rightByLeft) => {
  const search = (rowIndex, remaining, chosen) => {
    if (rowIndex >= leftOptions.length) return chosen;

    const forbidden = rightByLeft.get(leftOptions[rowIndex]);
    const preferred = remaining.filter((option) => option !== forbidden);
    const fallback = remaining.filter((option) => option === forbidden);

    for (const option of [...preferred, ...fallback]) {
      if (option === forbidden && preferred.length > 0) continue;
      const resolved = search(rowIndex + 1, removeFirst(remaining, option), [...chosen, option]);
      if (resolved && resolved.every((right, index) => rightByLeft.get(leftOptions[index]) !== right)) return resolved;
    }

    return null;
  };

  return search(0, rightOptions, []);
};

export const orderRightAvoidingAlignedPairs = (leftOptions, leftCards, rightCards, seed) => {
  const shuffledRight = shuffleWithSeed(rightCards, seed);
  if (leftOptions.length !== shuffledRight.length || leftCards.length !== rightCards.length || rightCards.length < 2) {
    return shuffledRight;
  }

  const rightByLeft = new Map(leftCards.map((left, index) => [left, rightCards[index]]));
  const hasAlignedPair = shuffledRight.some((right, index) => rightByLeft.get(leftOptions[index]) === right);
  if (!hasAlignedPair) return shuffledRight;

  return findDerangedRightOrder(leftOptions, shuffledRight, rightByLeft) ?? shuffledRight;
};

export default function MatchingMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const reduceMotion = useReducedMotion();
  const retrySeed = missionView.retrySeed ?? missionView.mechanics?.retrySeed ?? 0;
  const seed = `${missionView.id}:${retrySeed}`;
  const leftOptions = useMemo(() => shuffleWithSeed(missionView.leftCards ?? [], `${seed}:left`), [missionView.id, missionView.leftCards, retrySeed]);
  const rightOptions = useMemo(
    () => orderRightAvoidingAlignedPairs(leftOptions, missionView.leftCards ?? [], missionView.rightCards ?? [], `${seed}:right`),
    [leftOptions, missionView.id, missionView.leftCards, missionView.rightCards, retrySeed],
  );
  const [activeLeft, setActiveLeft] = useState(null);
  const [matches, setMatches] = useState({});
  const [connectionLines, setConnectionLines] = useState([]);
  const [lineCanvas, setLineCanvas] = useState({ width: 0, height: 0 });
  const boardRef = useRef(null);
  const leftRefs = useRef({});
  const rightRefs = useRef({});

  const ready = Object.keys(matches).length === (missionView.leftCards ?? []).length;
  const usedAnswers = new Set(Object.values(matches));
  const pairNumbers = new Map(Object.keys(matches).map((left, index) => [left, index + 1]));
  const leftByAnswer = new Map(Object.entries(matches).map(([left, right]) => [right, left]));
  const pairNumberFor = (answer) => pairNumbers.get(leftByAnswer.get(answer));

  useEffect(() => {
    const measureLines = () => {
      const board = boardRef.current;
      if (!board) return;

      const boardRect = board.getBoundingClientRect();
      const nextLines = Object.entries(matches)
        .map(([left, right]) => {
          const leftNode = leftRefs.current[left];
          const rightNode = rightRefs.current[right];
          if (!leftNode || !rightNode) return null;

          const leftRect = leftNode.getBoundingClientRect();
          const rightRect = rightNode.getBoundingClientRect();
          const gap = Math.max(12, rightRect.left - leftRect.right);
          // Keep the drawn segment the dominant part of the gutter, so the
          // connector still reads as a line on narrow phone boards.
          const portInset = Math.min(20, Math.max(3, gap * 0.16));
          return {
            id: `${left}-${right}`,
            x1: leftRect.right - boardRect.left + portInset,
            y1: leftRect.top + leftRect.height / 2 - boardRect.top,
            x2: rightRect.left - boardRect.left - portInset,
            y2: rightRect.top + rightRect.height / 2 - boardRect.top,
          };
        })
        .filter(Boolean);

      setLineCanvas({ width: boardRect.width, height: boardRect.height });
      setConnectionLines(nextLines);
    };

    measureLines();
    window.addEventListener("resize", measureLines);
    return () => window.removeEventListener("resize", measureLines);
  }, [matches, missionView.id]);

  const chooseMatch = (option) => {
    if (!activeLeft || disabled) return;
    setMatches((current) => {
      const next = Object.fromEntries(Object.entries(current).filter(([, value]) => value !== option));
      next[activeLeft] = option;
      return next;
    });
    setActiveLeft(null);
  };

  const submit = () => onSubmit(matches);

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          <small className="mission-directive">{missionView.instruction}</small>
        </div>
        {missionView.hasAudio ? (
          <motion.button className="sound-button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onPlayAudio?.()} disabled={disabled} aria-label="ฟังเสียงภาษาจีน">
            <Volume2 size={25} />
          </motion.button>
        ) : null}
      </div>

      <div className={`matching-board ${feedback?.correct ? "correct" : feedback ? "wrong" : ""}`} ref={boardRef}>
        <svg className="match-lines" width={lineCanvas.width} height={lineCanvas.height} viewBox={`0 0 ${Math.max(lineCanvas.width, 1)} ${Math.max(lineCanvas.height, 1)}`} aria-hidden="true">
          <defs>
            <linearGradient id={`matchLineGradient-${missionView.id}`} x1="0%" x2="100%" y1="0%" y2="0%">
              <stop offset="0%" stopColor="#b62924" />
              <stop offset="42%" stopColor="#f7b833" />
              <stop offset="100%" stopColor="#2f8f74" />
            </linearGradient>
          </defs>
          {connectionLines.map((line) => {
            const horizontal = Math.max(54, Math.abs(line.x2 - line.x1));
            const curve = Math.max(28, horizontal * 0.34);
            const path = `M ${line.x1} ${line.y1} C ${line.x1 + curve} ${line.y1}, ${line.x2 - curve} ${line.y2}, ${line.x2} ${line.y2}`;
            return (
              <g key={line.id}>
                <circle cx={line.x1} cy={line.y1} r="5" fill="#b62924" />
                <circle cx={line.x2} cy={line.y2} r="5" fill="#2f8f74" />
                <motion.path className="match-line-glow" d={path} fill="none" stroke="#f7b833" strokeLinecap="round" strokeWidth="14" initial={reduceMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.2 }} transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }} />
                <motion.path className="match-line-main" d={path} fill="none" stroke={`url(#matchLineGradient-${missionView.id})`} strokeLinecap="round" strokeWidth="6" initial={reduceMotion ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: reduceMotion ? 0 : 0.55, ease: "easeOut" }} />
                {!reduceMotion ? <motion.path className="match-line-flow" d={path} fill="none" stroke="#fff8cf" strokeLinecap="round" strokeWidth="2.5" strokeDasharray="7 17" initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: 0.2 }} /> : null}
              </g>
            );
          })}
        </svg>

        <div className="match-column">
          {leftOptions.map((left) => (
            <motion.button
              key={left}
              ref={(node) => {
                if (node) leftRefs.current[left] = node;
              }}
              className={`match-item ${activeLeft === left ? "active" : ""} ${matches[left] ? "matched" : ""}`}
              whileHover={reduceMotion ? undefined : { x: 4 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => !matches[left] && setActiveLeft(left)}
              disabled={disabled || Boolean(matches[left])}
            >
              {matches[left] ? <b className="match-pair-number" aria-hidden="true">{pairNumbers.get(left)}</b> : null}
              <span>{left}</span>
              <small>{matches[left] ?? "เลือกคำแปล"}</small>
            </motion.button>
          ))}
        </div>
        <div className="match-column">
          {rightOptions.map((option) => (
            <motion.button
              key={option}
              ref={(node) => {
                if (node) rightRefs.current[option] = node;
              }}
              className={`match-answer ${usedAnswers.has(option) ? "selected" : ""}`}
              whileHover={reduceMotion ? undefined : { x: -4 }}
              whileTap={reduceMotion ? undefined : { scale: 0.98 }}
              onClick={() => chooseMatch(option)}
              disabled={disabled || !activeLeft || usedAnswers.has(option)}
            >
              {usedAnswers.has(option) ? <b className="match-pair-number" aria-hidden="true">{pairNumberFor(option)}</b> : null}
              {option}
            </motion.button>
          ))}
        </div>
      </div>

      <div aria-label="คู่ที่จับแล้ว" className="md:hidden" aria-live="polite">
        <span className="mission-label">คู่ที่จับแล้ว {Object.keys(matches).length}/{leftOptions.length}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(matches).map(([left, right]) => <span key={left} className="rounded-md bg-emerald-50 px-3 py-2 font-bold text-emerald-900">{left} - {right}</span>)}
        </div>
      </div>

      <motion.button className="game-button primary w-full" whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={submit} disabled={disabled || !ready}>
        <Check size={19} />
        ตรวจคำตอบ
      </motion.button>
    </div>
  );
}
