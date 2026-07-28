import { motion, useReducedMotion } from "framer-motion";
import { Check, Volume2 } from "lucide-react";
import React, { useMemo } from "react";
import { shuffleOptions } from "../utils/shuffle";
import useAnswerDraft from "./useAnswerDraft";

/**
 * Pick the picture that matches the word. The cards carry a picture and a Thai
 * label but never the Chinese, so the choice is made on meaning rather than by
 * spotting the same characters twice.
 */
export default function ImageChoiceMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const reduceMotion = useReducedMotion();
  const items = useMemo(
    () => shuffleOptions(missionView.items ?? []),
    [missionView.id, missionView.items],
  );
  const { selected, pick } = useAnswerDraft({ missionId: missionView.id, disabled, onPlayAudio });

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          {missionView.promptPinyin ? <span className="prompt-pinyin">{missionView.promptPinyin}</span> : null}
          <strong>{missionView.chineseText}</strong>
          {missionView.instruction ? <small className="mission-directive">{missionView.instruction}</small> : null}
        </div>
        {missionView.hasAudio ? (
          <motion.button
            type="button"
            className="sound-button"
            whileHover={reduceMotion ? undefined : { scale: 1.1 }}
            whileTap={reduceMotion ? undefined : { scale: 0.9 }}
            onClick={() => onPlayAudio?.()}
            disabled={disabled}
            aria-label="ฟังเสียงภาษาจีน"
          >
            <Volume2 size={25} />
          </motion.button>
        ) : null}
      </div>

      <div className="image-grid">
        {items.map((item) => {
          const isCorrectChoice = feedback && item.label === feedback.correctOption;
          const isWrongChoice = feedback && item.label === feedback.selectedValue && item.label !== feedback.correctOption;
          return (
            <motion.button
              type="button"
              key={item.label}
              className={`image-card ${selected === item.label ? "picked" : ""} ${isCorrectChoice ? "correct" : ""} ${isWrongChoice ? "wrong" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -4 }}
              whileTap={reduceMotion ? undefined : { y: 2, scale: 0.98 }}
              onClick={() => pick(item.label)}
              disabled={disabled}
              aria-pressed={selected === item.label}
            >
              <span className="image-card-art" aria-hidden="true">{item.emoji}</span>
              <b>{item.label}</b>
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
