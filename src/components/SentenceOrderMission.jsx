import { motion } from "framer-motion";
import { Check, Eraser, Gauge, Undo2, Volume2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { shuffleOptions } from "../utils/shuffle";
import { containsHanzi } from "./useAnswerDraft";

export default function SentenceOrderMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const wordBank = useMemo(() => shuffleOptions(missionView.options).map((word, index) => ({ id: `${word}-${index}`, word })), [missionView.id, missionView.options]);
  const [selectedWords, setSelectedWords] = useState([]);
  const selectedIds = new Set(selectedWords.map((item) => item.id));
  // Falls back to the full tray size when there are no decoys, so untouched
  // missions behave exactly as before.
  const ready = selectedWords.length === (missionView.answerLength ?? wordBank.length);

  const submit = () => {
    onSubmit(selectedWords.map((item) => item.word));
  };

  const pick = (item) => {
    if (disabled || selectedIds.has(item.id)) return;
    setSelectedWords((current) => [...current, item]);
    if (containsHanzi(item.word)) onPlayAudio?.({ text: item.word });
  };

  /* Tapping a placed word takes just that one back, instead of only the
     undo-last-only button - a mis-tap deep in the sequence shouldn't force
     undoing everything after it. */
  const removeAt = (index) => {
    if (disabled) return;
    setSelectedWords((current) => current.filter((_, i) => i !== index));
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
          <div className="flex shrink-0 gap-2">
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
            <motion.button
              type="button"
              className="sound-button small"
              whileTap={{ scale: 0.92 }}
              onClick={() => onPlayAudio?.({ slow: true })}
              disabled={disabled}
              aria-label="ฟังเสียงประโยคช้าๆ"
            >
              <Gauge size={20} />
            </motion.button>
          </div>
        ) : null}
      </div>
      <div className={`order-zone ${feedback?.correct ? "correct" : feedback ? "wrong" : ""}`}>
        {selectedWords.length ? selectedWords.map((item, index) => {
          const verdict = feedback?.parts?.[index];
          const marked = verdict && !feedback.correct ? verdict.status : null;
          return (
            <motion.button
              key={item.id}
              type="button"
              layout
              className={marked ? `slot-${marked}` : undefined}
              onClick={() => removeAt(index)}
              disabled={disabled}
              aria-label={`เอา ${item.word} ออกจากช่องที่ ${index + 1}`}
            >
              {item.word}
              {marked === "wrong" ? <b className="slot-expected">ควรเป็น {verdict.expected}</b> : null}
            </motion.button>
          );
        }) : <em>แตะคำด้านล่างเพื่อเรียงประโยค</em>}
      </div>
      <div className="word-bank">
        {wordBank.map((item) => (
          <motion.button
            key={item.id}
            layout
            className="word-chip"
            whileHover={{ y: -2, scale: 1.05 }}
            whileTap={{ y: 2, scale: 0.95 }}
            onClick={() => pick(item)}
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
