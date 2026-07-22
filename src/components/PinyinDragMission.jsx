import { motion, useReducedMotion } from "framer-motion";
import React, { useEffect, useState } from "react";

export default function PinyinDragMission({ missionView, onSubmit, disabled, feedback }) {
  const [selected, setSelected] = useState(null);
  const [dropped, setDropped] = useState(null);
  const reduceMotion = useReducedMotion();
  const [prefix = "", suffix = ""] = (missionView.pinyinPattern ?? "_").split("_");
  const helpId = `pinyin-drop-help-${missionView.id}`;

  useEffect(() => {
    if (feedback && !feedback.correct) {
      setSelected(null);
      setDropped(null);
    }
  }, [feedback]);

  const submit = (value) => {
    if (!value || disabled) return;
    setDropped(value);
    onSubmit(value);
  };

  const onDragStart = (event, value) => {
    event.dataTransfer.setData("text/plain", value);
    event.dataTransfer.effectAllowed = "move";
  };

  const onDrop = (event) => {
    event.preventDefault();
    submit(event.dataTransfer.getData("text/plain"));
  };

  const isCorrect = feedback?.correct;
  const isWrong = feedback && !feedback.correct;

  return (
    <div className="mission-shell">
      <div className="pinyin-board">
        <div className="pinyin-card">
          <span>{missionView.chineseText}</span>
          <small>{missionView.thaiMeaning}</small>
        </div>
        <div className="pinyin-equation">
          <strong>{prefix}</strong>
          <motion.button
            type="button"
            className={`drop-zone ${selected ? "selected" : ""} ${isCorrect ? "correct" : ""} ${isWrong ? "wrong" : ""}`}
            aria-describedby={helpId}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDrop}
            onClick={() => submit(selected)}
            animate={reduceMotion ? {} : isWrong ? { x: [0, -8, 8, -5, 5, 0] } : isCorrect ? { scale: [1, 1.08, 1] } : {}}
            disabled={disabled}
          >
            {dropped ?? selected ?? "_"}
          </motion.button>
          <strong>{suffix}</strong>
        </div>
        <p className="pinyin-pattern">{missionView.pinyinPattern}</p>
      </div>

      <div className="vowel-tray">
        {(missionView.options ?? []).map((item) => (
          <motion.button
            type="button"
            key={item}
            className={`vowel-chip ${selected === item ? "active" : ""}`}
            draggable={!disabled}
            onDragStart={(event) => onDragStart(event, item)}
            whileHover={reduceMotion ? undefined : { y: -4, scale: 1.06 }}
            whileTap={reduceMotion ? undefined : { y: 2, scale: 0.95 }}
            onClick={() => {
              if (disabled) return;
              if (selected === item) submit(item);
              else setSelected(item);
            }}
            disabled={disabled}
          >
            {item}
          </motion.button>
        ))}
      </div>
      <p id={helpId} className="mission-help">ช่องวางคำตอบ: มือถือแตะตัวเลือกแล้วแตะช่องว่างเพื่อวางคำตอบ</p>
    </div>
  );
}
