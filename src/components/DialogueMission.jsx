import { motion, useReducedMotion } from "framer-motion";
import { Check, Volume2 } from "lucide-react";
import React, { useMemo } from "react";
import { shuffleOptions } from "../utils/shuffle";
import useAnswerDraft from "./useAnswerDraft";

/**
 * Reply in a conversation. The other speaker's line sits in a bubble on the
 * left and the player's reply lands in a bubble on the right, so the choice is
 * framed as speaking rather than as answering a quiz.
 */
export default function DialogueMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const reduceMotion = useReducedMotion();
  const options = useMemo(() => shuffleOptions(missionView.options), [missionView.id, missionView.options]);
  const { selected, pick } = useAnswerDraft({ missionId: missionView.id, disabled, onPlayAudio });

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          {missionView.question ? <p className="mission-question">{missionView.question}</p> : null}
          {missionView.instruction ? <small className="mission-directive">{missionView.instruction}</small> : null}
        </div>
      </div>

      <div className="dialogue-thread">
        <div className="dialogue-line them">
          <div className="dialogue-bubble">
            {missionView.speakerPinyin ? <span className="prompt-pinyin">{missionView.speakerPinyin}</span> : null}
            <strong>{missionView.speakerLine}</strong>
            {missionView.speakerThai ? <small>{missionView.speakerThai}</small> : null}
          </div>
          {missionView.hasAudio ? (
            <motion.button
              type="button"
              className="sound-button"
              whileTap={reduceMotion ? undefined : { scale: 0.9 }}
              onClick={() => onPlayAudio?.()}
              disabled={disabled}
              aria-label="ฟังเสียงบทสนทนา"
            >
              <Volume2 size={22} />
            </motion.button>
          ) : null}
        </div>

        <div className="dialogue-line me">
          <div className={`dialogue-bubble reply ${selected ? "filled" : ""}`}>
            {selected ? <strong>{selected}</strong> : <em>เลือกคำตอบด้านล่าง</em>}
          </div>
        </div>
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
