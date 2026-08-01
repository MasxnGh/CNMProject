import { Mic } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import Button from "../ui/Button.jsx";
import { playSentence, playSfx } from "../../lib/audio.js";
import { findMissingChars } from "../../lib/pronunciationMatch.js";
import { canRecognizeSpeech, listenForChinese, scorePronunciationOverlap } from "../../utils/pronunciation.js";
import "../../styles/game-speak-aloud.css";

/**
 * dujeen-quest-gameplay-prompts.md Prompt D - "พูดตาม". Reuses
 * utils/pronunciation.js's canRecognizeSpeech/listenForChinese/
 * scorePronunciationOverlap as-is (already shared, browser-agnostic,
 * proven by the old engine's PronunciationMission) rather than
 * reimplementing speech recognition. The mic-level ripple and hold-to-
 * record gesture are new; mic permission is only requested on the first
 * press, never on mount.
 *
 * exercise: { sentence } - target { hanzi, pinyin, th, id }
 * onSkip: distinct from onAnswer - always available, doesn't affect score
 *   (used both for the player's own "ข้ามข้อนี้" and for unsupported browsers)
 */
export default function SpeakAloud({ exercise, onAnswer, onSkip }) {
  const { sentence } = exercise;
  const supported = canRecognizeSpeech();
  const [recording, setRecording] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [tier, setTier] = useState(null);
  const [missingChars, setMissingChars] = useState([]);

  const stopRecognitionRef = useRef(null);
  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);

  const stopMeter = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioCtxRef.current?.close?.();
    audioCtxRef.current = null;
    setMicLevel(0);
  };

  useEffect(() => () => {
    stopRecognitionRef.current?.();
    stopMeter();
  }, []);

  const startMeter = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / data.length;
        setMicLevel(average / 255);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mic denied/unavailable - the ripple just won't show; recognition
      // (started separately below) reports its own failure silently too.
    }
  };

  const startRecording = () => {
    if (!supported || recording) return;
    setTier(null);
    setMissingChars([]);
    setRecording(true);
    startMeter();
    stopRecognitionRef.current = listenForChinese({
      onResult: (transcript) => {
        const missing = findMissingChars(sentence.hanzi, transcript);
        const score = scorePronunciationOverlap(sentence.hanzi, transcript);
        if (missing.length === 0) {
          setTier("great");
          playSfx("stamp");
          playSfx("correct");
          window.setTimeout(() => onAnswer(true), 900);
        } else if (score > 0.5) {
          setTier("close");
          setMissingChars(missing);
        } else {
          setTier("retry");
        }
      },
      onError: () => setTier("retry"),
      onEnd: () => {
        setRecording(false);
        stopMeter();
      },
    });
  };

  const stopRecording = () => {
    stopRecognitionRef.current?.();
    setRecording(false);
    stopMeter();
  };

  if (!supported) {
    return (
      <div className="exercise">
        <div className="exercise-prompt-area">
          <p className="exercise-instruction">โจทย์นี้ต้องใช้ไมโครโฟนซึ่งเบราว์เซอร์นี้ไม่รองรับ</p>
        </div>
        <div className="exercise-options-area">
          <Button variant="ghost" onClick={onSkip}>
            ข้ามข้อนี้
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise">
      <div className="exercise-prompt-area">
        <div className="exercise-prompt">
          <button type="button" className="exercise-speaker" onClick={() => playSentence(sentence.id)} aria-label="ฟังตัวอย่าง">
            <strong className="exercise-hanzi">{sentence.hanzi}</strong>
          </button>
        </div>
        <div className="exercise-pinyin">{sentence.pinyin}</div>
        <p className="exercise-instruction">พูดตาม</p>
      </div>

      <div className="exercise-options-area">
        <div className="speak-aloud-mic-area">
          <button
            type="button"
            className={`speak-aloud-mic ${recording ? "is-recording" : ""}`}
            style={{ "--mic-level": micLevel }}
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerLeave={() => recording && stopRecording()}
            aria-label={recording ? "กำลังอัดเสียง ปล่อยเพื่อจบ" : "กดค้างเพื่อพูด"}
          >
            <span className="speak-aloud-ripple" aria-hidden="true" />
            <Mic size={32} />
          </button>
          <p className="speak-aloud-status" aria-live="polite">
            {recording ? "กำลังฟัง ปล่อยเพื่อจบ..." : "กดค้างปุ่มไมค์แล้วพูดตาม"}
          </p>

          {tier === "close" ? (
            <p className="speak-aloud-feedback">
              ใกล้แล้ว! คำที่ยังไม่ตรง: <strong>{missingChars.join(" ")}</strong>
            </p>
          ) : null}
          {tier === "retry" ? <p className="speak-aloud-feedback">ลองอีกครั้งนะ</p> : null}
        </div>

        <Button variant="ghost" onClick={onSkip}>
          ข้ามข้อนี้
        </Button>
      </div>
    </div>
  );
}
