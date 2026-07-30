import { motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Check, Mic, Volume2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { canRecognizeSpeech, listenForChinese, scorePronunciationOverlap } from "../utils/pronunciation";

const STATUS = { idle: "idle", listening: "listening", recognized: "recognized", error: "error" };

export default function PronunciationMission({ missionView, onSubmit, disabled, onPlayAudio }) {
  const reduceMotion = useReducedMotion();
  const supported = canRecognizeSpeech();
  const [status, setStatus] = useState(STATUS.idle);
  const [transcript, setTranscript] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const stopRef = useRef(null);

  useEffect(() => {
    setStatus(STATUS.idle);
    setTranscript("");
    setErrorMessage("");
    stopRef.current = null;
  }, [missionView.id]);

  // Cancels an in-flight listen if the mission unmounts mid-recording.
  useEffect(() => () => stopRef.current?.(), []);

  const target = missionView.chineseText;

  const startListening = () => {
    if (disabled || status === "listening") return;
    setStatus(STATUS.listening);
    setErrorMessage("");
    stopRef.current = listenForChinese({
      onResult: (text) => {
        setTranscript(text);
        setStatus(STATUS.recognized);
      },
      onError: (message) => {
        setErrorMessage(message);
        setStatus(STATUS.error);
      },
    });
  };

  const submitRecognized = () => {
    onSubmit({
      type: "pronunciation",
      attempted: true,
      selfReported: false,
      recognized: transcript,
      overlapScore: scorePronunciationOverlap(target, transcript),
    });
  };

  const submitSelfReport = () => {
    onSubmit({ type: "pronunciation", attempted: true, selfReported: true, recognized: null, overlapScore: null });
  };

  return (
    <div className="mission-shell pronunciation-mission">
      <div className="trace-meta" aria-live="polite">
        {missionView.promptPinyin ? <i className="card-pinyin">{missionView.promptPinyin}</i> : null}
        <strong>{target}</strong>
        <span>{missionView.thaiMeaning}</span>
      </div>

      <button type="button" className="sound-button" onClick={() => onPlayAudio?.()} disabled={disabled}>
        <Volume2 size={19} />
        ฟังเสียงต้นฉบับ
      </button>

      {!supported ? (
        <div className="pronunciation-fallback">
          <p>
            <AlertTriangle size={18} aria-hidden="true" />
            เบราว์เซอร์นี้ไม่รองรับการฟังเสียงพูด ลองออกเสียงคำนี้เอง แล้วกดยืนยัน
          </p>
          <motion.button
            type="button"
            className="game-button primary"
            whileTap={reduceMotion ? undefined : { y: 2 }}
            onClick={submitSelfReport}
            disabled={disabled}
          >
            <Check size={19} />
            ฉันพูดแล้ว
          </motion.button>
        </div>
      ) : (
        <div className="pronunciation-recorder">
          <motion.button
            type="button"
            className={`pronunciation-mic ${status === STATUS.listening ? "listening" : ""}`}
            onClick={startListening}
            disabled={disabled || status === STATUS.listening}
            aria-label={status === STATUS.listening ? "กำลังฟัง" : "กดเพื่อพูด"}
            animate={status === STATUS.listening && !reduceMotion ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={status === STATUS.listening ? { duration: 0.9, repeat: Infinity, ease: "easeInOut" } : undefined}
          >
            <Mic size={28} />
          </motion.button>

          <p className="pronunciation-status" aria-live="polite">
            {status === STATUS.idle && "กดไมค์แล้วอ่านออกเสียงคำนี้"}
            {status === STATUS.listening && "กำลังฟัง..."}
            {status === STATUS.recognized && `ระบบได้ยินว่า "${transcript || "(ไม่ชัดเจน)"}"`}
            {status === STATUS.error && errorMessage}
          </p>

          {status === STATUS.recognized ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <motion.button
                type="button"
                className="game-button secondary"
                whileTap={reduceMotion ? undefined : { y: 2 }}
                onClick={startListening}
                disabled={disabled}
              >
                <Mic size={19} />
                พูดใหม่
              </motion.button>
              <motion.button
                type="button"
                className="game-button primary"
                whileTap={reduceMotion ? undefined : { y: 2 }}
                onClick={submitRecognized}
                disabled={disabled}
              >
                <Check size={19} />
                ตรวจคำตอบ
              </motion.button>
            </div>
          ) : null}

          {status === STATUS.error ? (
            <motion.button
              type="button"
              className="game-button primary"
              whileTap={reduceMotion ? undefined : { y: 2 }}
              onClick={submitSelfReport}
              disabled={disabled}
            >
              <Check size={19} />
              ฉันพูดแล้ว
            </motion.button>
          ) : null}
        </div>
      )}
    </div>
  );
}
