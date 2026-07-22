import { motion } from "framer-motion";
import { Headphones, Volume2 } from "lucide-react";
import React, { useMemo } from "react";

const shuffle = (items) =>
  [...items]
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);

export default function ChoiceMission({ missionView, onSubmit, disabled, feedback, onPlayAudio, audioOnly = false, boss = false }) {
  const options = useMemo(() => shuffle(missionView.options ?? []), [missionView.id, missionView.options]);

  return (
    <div className={`mission-shell ${boss ? "boss-mission" : ""}`}>
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          <strong>{audioOnly ? "ฟังเสียงจากแผ่นหยก" : missionView.chineseText ?? missionView.question}</strong>
          <small>{audioOnly ? "กดฟังเสียงแล้วเลือกคำที่ได้ยิน" : missionView.thaiMeaning || missionView.instruction}</small>
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
              key={option}
              className={`answer-button ${isCorrectChoice ? "correct" : ""} ${isWrongChoice ? "wrong" : ""}`}
              whileHover={{ y: -3, scale: 1.015 }}
              whileTap={{ y: 3, scale: 0.98 }}
              onClick={() => onSubmit(option)}
              disabled={disabled}
            >
              {option}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
