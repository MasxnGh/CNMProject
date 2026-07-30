import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";
import React, { useMemo } from "react";
import { shuffleOptions } from "../utils/shuffle";
import useAnswerDraft from "./useAnswerDraft";

/**
 * One sentence shown complete in one language, its translation shown with a
 * single word blanked out in the other - fill the blank from a chip row that
 * includes a couple of decoys. Covers both directions from the same
 * component: fixedLang "zh" blanks the Thai translation (fill-the-Thai-gap),
 * fixedLang "th" blanks the Chinese sentence (fill-the-Chinese-gap).
 */
export default function TranslationBlankMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const reduceMotion = useReducedMotion();
  const options = useMemo(() => shuffleOptions(missionView.options), [missionView.id, missionView.options]);
  const { selected, pick } = useAnswerDraft({ missionId: missionView.id, disabled, onPlayAudio });

  const [before, after] = missionView.blankTemplate.split("___");

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          {missionView.fixedPinyin ? <span className="prompt-pinyin">{missionView.fixedPinyin}</span> : null}
          <strong>{missionView.fixedText}</strong>
          {missionView.instruction ? <small className="mission-directive">{missionView.instruction}</small> : null}
        </div>
      </div>

      <div className="translation-blank-line">
        {before}
        <span className={`translation-blank-slot ${selected ? "filled" : ""}`}>{selected ?? "___"}</span>
        {after}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isCorrectChoice = feedback && option === feedback.correctOption;
          const isWrongChoice = feedback && option === feedback.selectedValue && option !== feedback.correctOption;
          return (
            <motion.button
              type="button"
              key={option}
              className={`answer-button ${selected === option ? "picked" : ""} ${isCorrectChoice ? "correct" : ""} ${isWrongChoice ? "wrong" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { y: 2 }}
              onClick={() => pick(option)}
              disabled={disabled}
              aria-pressed={selected === option}
            >
              {option}
            </motion.button>
          );
        })}
      </div>

      <motion.button
        type="button"
        className="game-button primary w-full"
        whileHover={reduceMotion ? undefined : { y: -2 }}
        whileTap={reduceMotion ? undefined : { y: 2 }}
        onClick={() => onSubmit(selected)}
        disabled={disabled || selected === null}
      >
        <Check size={19} />
        ตรวจคำตอบ
      </motion.button>
    </div>
  );
}
