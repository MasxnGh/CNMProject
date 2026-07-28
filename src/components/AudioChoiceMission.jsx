import { motion, useReducedMotion } from "framer-motion";
import { Headphones } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { shuffleOptions } from "../utils/shuffle";

export default function AudioChoiceMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  const [speaking, setSpeaking] = useState(false);
  const cleanupRef = useRef(null);
  const mountedRef = useRef(true);
  const reduceMotion = useReducedMotion();
  const options = useMemo(() => shuffleOptions(missionView.options), [missionView.id, missionView.options]);

  const releasePlayback = useCallback((updateState = true) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (updateState && mountedRef.current) setSpeaking(false);
  }, []);

  useEffect(() => () => {
    mountedRef.current = false;
    releasePlayback(false);
  }, [releasePlayback]);

  useEffect(() => {
    if (disabled) releasePlayback();
  }, [disabled, releasePlayback]);

  const play = () => {
    if (disabled || speaking) return;
    releasePlayback();
    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      releasePlayback();
    };
    let started = false;
    const callbacks = {
      onStart: () => {
        started = true;
        if (mountedRef.current) setSpeaking(true);
      },
      onEnd: finish,
      onError: finish,
    };
    const cleanupPlayback = onPlayAudio?.(callbacks);
    const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
    let pollId = null;
    if (!started && synth?.speaking) {
      callbacks.onStart();
      pollId = window.setInterval(() => {
        if (!synth.speaking) callbacks.onEnd();
      }, 100);
    }
    const parentCleanup = typeof cleanupPlayback === "function" ? cleanupPlayback : null;
    const cleanup = () => {
      if (pollId !== null) window.clearInterval(pollId);
      if (parentCleanup) parentCleanup();
      else if (synth?.speaking) synth.cancel?.();
    };
    if (finished) cleanup();
    else cleanupRef.current = cleanup;
  };

  return (
    <div className="mission-shell">
      <div className="mission-prompt">
        <div className="min-w-0">
          <span className="mission-label">{missionView.title}</span>
          <strong>ฟังเสียงจากแผ่นหยก</strong>
          <small>กดฟังเสียงแล้วเลือกคำที่ได้ยิน</small>
        </div>
        <motion.button
          type="button"
          className="sound-button"
          onClick={play}
          disabled={disabled || speaking}
          aria-label="ฟังเสียงภาษาจีน"
          aria-pressed={speaking}
          animate={speaking && !reduceMotion ? { scale: [1, 1.08, 1] } : {}}
        >
          <Headphones size={26} />
        </motion.button>
      </div>
      {speaking ? <p role="status" className="mission-help">กำลังเล่นเสียง</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => {
          const isCorrectChoice = feedback && option === feedback.correctOption;
          const isWrongChoice = feedback && option === feedback.selectedValue && option !== feedback.correctOption;
          return (
            <motion.button
              type="button"
              key={option}
              className={`answer-button ${isCorrectChoice ? "correct" : ""} ${isWrongChoice ? "wrong" : ""}`}
              whileHover={reduceMotion ? undefined : { y: -3 }}
              whileTap={reduceMotion ? undefined : { y: 2 }}
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
