import { motion, useReducedMotion } from "framer-motion";
import { Check, Eraser, Keyboard, ListOrdered, Undo2 } from "lucide-react";
import React, { useMemo, useState } from "react";
import { shuffleOptions } from "../utils/shuffle";
import { containsHanzi } from "./useAnswerDraft";

/** Translate the Thai prompt into Chinese - arrange word chips, or switch to typing it. */
export default function TranslateSentenceMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const reduceMotion = useReducedMotion();
  const wordBank = useMemo(() => shuffleOptions(missionView.options).map((word, index) => ({ id: `${word}-${index}`, word })), [missionView.id, missionView.options]);
  const [selectedWords, setSelectedWords] = useState([]);
  const [mode, setMode] = useState("chips");
  const [typedText, setTypedText] = useState("");
  const selectedIds = new Set(selectedWords.map((item) => item.id));
  const ready = mode === "chips"
    ? selectedWords.length === (missionView.answerLength ?? wordBank.length)
    : typedText.trim().length > 0;

  const pick = (item) => {
    if (disabled || selectedIds.has(item.id)) return;
    setSelectedWords((current) => [...current, item]);
    if (containsHanzi(item.word)) onPlayAudio?.({ text: item.word });
  };

  const removeAt = (index) => {
    if (disabled) return;
    setSelectedWords((current) => current.filter((_, i) => i !== index));
  };

  const submit = () => onSubmit(mode === "chips" ? selectedWords.map((item) => item.word) : typedText);

  const switchMode = (nextMode) => {
    if (disabled || mode === nextMode) return;
    setMode(nextMode);
  };

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          <strong>{missionView.thaiMeaning}</strong>
          <small className="mission-directive">{missionView.instruction}</small>
        </div>
      </div>

      <div className="translate-mode-toggle" role="group" aria-label="เลือกวิธีตอบ">
        <button type="button" className={mode === "chips" ? "active" : ""} onClick={() => switchMode("chips")} disabled={disabled} aria-pressed={mode === "chips"}>
          <ListOrdered size={16} />
          เรียงคำ
        </button>
        <button type="button" className={mode === "keyboard" ? "active" : ""} onClick={() => switchMode("keyboard")} disabled={disabled} aria-pressed={mode === "keyboard"}>
          <Keyboard size={16} />
          พิมพ์คำตอบ
        </button>
      </div>

      {mode === "chips" ? (
        <>
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
                whileHover={reduceMotion ? undefined : { y: -2, scale: 1.05 }}
                whileTap={reduceMotion ? undefined : { y: 2, scale: 0.95 }}
                onClick={() => pick(item)}
                disabled={disabled || selectedIds.has(item.id)}
              >
                {missionView.optionPinyin?.[item.word] ? <i className="card-pinyin">{missionView.optionPinyin[item.word]}</i> : null}
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
        </>
      ) : (
        <div className="translate-keyboard">
          <input
            type="text"
            className="translate-keyboard-input"
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            disabled={disabled}
            placeholder="พิมพ์ประโยคภาษาจีน..."
            aria-label="พิมพ์คำแปลภาษาจีน"
          />
          <motion.button type="button" className="game-button primary w-full" whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={submit} disabled={disabled || !ready}>
            <Check size={19} />
            ตรวจ
          </motion.button>
        </div>
      )}
    </div>
  );
}
