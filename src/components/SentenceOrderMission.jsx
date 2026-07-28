import { motion } from "framer-motion";
import { Check, Eraser, Undo2, Volume2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { shuffleOptions } from "../utils/shuffle";

export default function SentenceOrderMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const wordBank = useMemo(() => shuffleOptions(missionView.options).map((word, index) => ({ id: `${word}-${index}`, word })), [missionView.id, missionView.options]);
  const [selectedWords, setSelectedWords] = useState([]);
  const selectedIds = new Set(selectedWords.map((item) => item.id));
  const ready = selectedWords.length === wordBank.length;

  const submit = () => {
    onSubmit(selectedWords.map((item) => item.word));
  };

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          {/* Listen-first withholds the translation, so the audio button becomes
              the only way in and the prompt says so. */}
          <strong>{missionView.listenFirst ? "คุณได้ยินว่าอะไร?" : missionView.thaiMeaning}</strong>
          <small>{missionView.instruction}</small>
        </div>
        {missionView.listenFirst && missionView.hasAudio ? (
          <motion.button
            type="button"
            className="sound-button"
            whileTap={{ scale: 0.92 }}
            onClick={() => onPlayAudio?.()}
            disabled={disabled}
            aria-label="ฟังเสียงประโยค"
          >
            <Volume2 size={25} />
          </motion.button>
        ) : null}
      </div>
      <div className={`order-zone ${feedback?.correct ? "correct" : feedback ? "wrong" : ""}`}>
        {selectedWords.length ? selectedWords.map((item, index) => {
          const verdict = feedback?.parts?.[index];
          const marked = verdict && !feedback.correct ? verdict.status : null;
          return (
            <span key={item.id} className={marked ? `slot-${marked}` : undefined}>
              {item.word}
              {marked === "wrong" ? <b className="slot-expected">ควรเป็น {verdict.expected}</b> : null}
            </span>
          );
        }) : <em>แตะคำด้านล่างเพื่อเรียงประโยค</em>}
      </div>
      <div className="word-bank">
        {wordBank.map((item) => (
          <motion.button
            key={item.id}
            className="word-chip"
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ y: 2, scale: 0.95 }}
            onClick={() => !selectedIds.has(item.id) && setSelectedWords((current) => [...current, item])}
            disabled={disabled || selectedIds.has(item.id)}
          >
            {missionView.optionPinyin?.[item.word]
              ? <i className="card-pinyin">{missionView.optionPinyin[item.word]}</i>
              : null}
            {item.word}
          </motion.button>
        ))}
      </div>
      <div className="mission-controls">
        <motion.button className="game-button secondary" whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={() => setSelectedWords((current) => current.slice(0, -1))} disabled={disabled || selectedWords.length === 0}>
          <Undo2 size={19} />
          ย้อนกลับ
        </motion.button>
        <motion.button className="game-button secondary" whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={() => setSelectedWords([])} disabled={disabled}>
          <Eraser size={19} />
          ล้าง
        </motion.button>
        <motion.button className="game-button primary" whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={submit} disabled={disabled || !ready}>
          <Check size={19} />
          ตรวจ
        </motion.button>
      </div>
    </div>
  );
}
