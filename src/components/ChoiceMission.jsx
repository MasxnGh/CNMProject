import { motion } from "framer-motion";
import { Check, Headphones, Volume2 } from "lucide-react";
import React, { useMemo } from "react";
import { shuffleOptions } from "../utils/shuffle";
import useAnswerDraft, { containsHanzi } from "./useAnswerDraft";

export default function ChoiceMission({ missionView, onSubmit, disabled, feedback, onPlayAudio, audioOnly = false, boss = false }) {
  const options = useMemo(() => shuffleOptions(missionView.options), [missionView.id, missionView.options]);
  const { selected, pick } = useAnswerDraft({ missionId: missionView.id, disabled, onPlayAudio });
  const headline = audioOnly ? "ฟังเสียงจากแผ่นหยก" : missionView.chineseText ?? missionView.question;
  const question = audioOnly || missionView.question === headline ? null : missionView.question;
  const directive = audioOnly ? "กดฟังเสียงแล้วเลือกคำที่ได้ยิน" : missionView.instruction;

  return (
    <div className={`mission-shell ${boss ? "boss-mission" : ""}`}>
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          {question ? <p className="mission-question">{question}</p> : null}
          {/* Several prompts hold Thai scene-setting rather than Chinese, and a
              reading above those would be nonsense. */}
          {missionView.promptPinyin && containsHanzi(headline)
            ? <span className="prompt-pinyin">{missionView.promptPinyin}</span>
            : null}
          <strong>{headline}</strong>
          {!audioOnly && missionView.thaiMeaning ? <small>{missionView.thaiMeaning}</small> : null}
          {directive ? <small className="mission-directive">{directive}</small> : null}
        </div>
        {missionView.hasAudio && (
          <motion.button className="sound-button" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => onPlayAudio?.()} disabled={disabled} aria-label="ฟังเสียงภาษาจีน">
            {audioOnly ? <Headphones size={26} /> : <Volume2 size={25} />}
          </motion.button>
        )}
      </div>

      {boss ? (
        <div className="boss-bar" aria-label="พลังบอส">
          <span style={{ width: `${Math.max(8, missionView.mechanics?.bossHp ?? 60)}%` }} />
          <strong>พลังมังกรผู้พิทักษ์</strong>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isCorrectChoice = feedback && option === feedback.correctOption;
          const isWrongChoice = feedback && option === feedback.selectedValue && option !== feedback.correctOption;
          return (
            <motion.button
              type="button"
              key={option}
              className={`answer-button ${selected === option ? "picked" : ""} ${isCorrectChoice ? "correct" : ""} ${isWrongChoice ? "wrong" : ""}`}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ y: 3, scale: 0.98 }}
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
        whileHover={{ y: -2 }}
        whileTap={{ y: 2 }}
        onClick={() => onSubmit(selected)}
        disabled={disabled || selected === null}
      >
        <Check size={19} />
        ตรวจคำตอบ
      </motion.button>
    </div>
  );
}
