import { motion, useReducedMotion } from "framer-motion";
import { Volume2 } from "lucide-react";
import React, { useMemo } from "react";
import { shuffleOptions } from "../utils/shuffle";

const toneMarks = [
  "āēīōūǖĀĒĪŌŪǕ",
  "áéíóúǘÁÉÍÓÚǗ",
  "ǎěǐǒǔǚǍĚǏǑǓǙ",
  "àèìòùǜÀÈÌÒÙǛ",
];

const tonePath = {
  1: "M4 10 L44 10",
  2: "M4 34 L44 8",
  3: "M4 10 C14 36 34 36 44 10",
  4: "M4 8 L44 34",
  5: "M4 22 L44 22",
};

const getTone = (value) => {
  const numeric = String(value).match(/[1-5]/)?.[0];
  if (numeric) return Number(numeric);
  const index = toneMarks.findIndex((marks) => [...String(value)].some((character) => marks.includes(character)));
  return index >= 0 ? index + 1 : 5;
};

function ToneContour({ tone }) {
  return (
    <svg role="img" aria-label={`เส้นระดับเสียงวรรณยุกต์ ${tone}`} viewBox="0 0 48 40" width="48" height="40">
      <path d={tonePath[tone]} fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
    </svg>
  );
}

export default function ToneChoiceMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const reduceMotion = useReducedMotion();
  const options = useMemo(() => shuffleOptions(missionView.options), [missionView.id, missionView.options]);
  const headline = missionView.chineseText ?? missionView.question;
  const question = missionView.question === headline ? null : missionView.question;

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          {question ? <p className="mission-question">{question}</p> : null}
          <strong>{headline}</strong>
          {missionView.thaiMeaning ? <small>{missionView.thaiMeaning}</small> : null}
          {missionView.instruction ? <small className="mission-directive">{missionView.instruction}</small> : null}
        </div>
        {missionView.hasAudio ? (
          <motion.button type="button" className="sound-button" onClick={() => onPlayAudio?.()} disabled={disabled} aria-label="ฟังเสียงภาษาจีน" whileTap={reduceMotion ? undefined : { scale: 0.92 }}>
            <Volume2 size={25} />
          </motion.button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isCorrectChoice = feedback && option === feedback.correctOption;
          const isWrongChoice = feedback && option === feedback.selectedValue && option !== feedback.correctOption;
          return (
            <motion.button
              type="button"
              key={option}
              aria-label={option}
              className={`answer-button ${isCorrectChoice ? "correct" : ""} ${isWrongChoice ? "wrong" : ""} flex items-center justify-between gap-3`}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { y: 2 }}
              onClick={() => onSubmit(option)}
              disabled={disabled}
            >
              <span>{option}</span>
              <ToneContour tone={getTone(option)} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
