import { useEffect, useRef, useState } from "react";
import { resolveEntry } from "./content.js";
import { manualReplay, playEntry } from "../../lib/audioPolicy.js";
import "../game/speak.css";

const HANZI_RE = /[一-鿿]/;

function compareHanzi(targetHanzi, transcript) {
  const targetChars = [...targetHanzi].filter((ch) => HANZI_RE.test(ch));
  const transcriptChars = [...(transcript || "")].filter((ch) => HANZI_RE.test(ch));

  let matchCount = 0;
  const mismatches = [];
  targetChars.forEach((ch, i) => {
    if (transcriptChars[i] === ch) matchCount += 1;
    else mismatches.push(ch);
  });

  const ratio = targetChars.length ? matchCount / targetChars.length : 0;
  if (ratio === 1) return { tier: "perfect", mismatches: [] };
  if (ratio > 0.5) return { tier: "partial", mismatches };
  return { tier: "low", mismatches };
}

function getSpeechRecognition() {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  return Ctor ? new Ctor() : null;
}

export default function SpeakAloud({ exercise, checked, onResult, onSkip }) {
  const target = resolveEntry(exercise.targetId);
  const [recording, setRecording] = useState(false);
  const [volume, setVolume] = useState(0);
  const [result, setResult] = useState(null);

  const streamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    playEntry(exercise.targetId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exercise.id]);

  const stopVisualizer = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setVolume(0);
  };

  useEffect(() => stopVisualizer, []);

  const startVisualizer = async () => {
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
        const avg = data.reduce((sum, v) => sum + v, 0) / data.length;
        setVolume(Math.min(avg / 130, 1));
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // Mic denied/unavailable - recording UI just won't show levels.
    }
  };

  const handlePressStart = () => {
    if (checked || recording) return;
    const recognition = getSpeechRecognition();
    if (!recognition) return;

    setResult(null);
    setRecording(true);
    startVisualizer();

    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || "";
      const tierResult = compareHanzi(target.hanzi, transcript);
      setResult(tierResult);
      const correct = tierResult.tier === "perfect";
      onResult({ correct, quality: correct ? "good" : "again" });
    };
    recognition.onerror = () => {
      const tierResult = { tier: "low", mismatches: [] };
      setResult(tierResult);
      onResult({ correct: false, quality: "again" });
    };
    recognition.onend = () => {
      setRecording(false);
      stopVisualizer();
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const handlePressEnd = () => {
    if (!recording) return;
    recognitionRef.current?.stop();
  };

  return (
    <>
      <div className="quizL">
        <div className="ask">พูดตามให้ตรงกับคำนี้</div>
        <div className="word">
          <button type="button" className="spk" onClick={() => manualReplay(exercise.targetId)}>
            🔊
          </button>
          <div>
            <div className="py">{target.pinyin}</div>
            <div className="hz">{target.hanzi}</div>
          </div>
        </div>
      </div>
      <div>
        <div className="micStage">
          <button
            type="button"
            className={["micBtn", recording && "recording"].filter(Boolean).join(" ")}
            style={{ "--volume": volume }}
            onPointerDown={handlePressStart}
            onPointerUp={handlePressEnd}
            onPointerLeave={handlePressEnd}
            disabled={checked}
          >
            🎙️
          </button>
          <p className="micHint">{recording ? "กำลังฟัง... ปล่อยเมื่อพูดจบ" : "กดค้างแล้วพูดตาม"}</p>
        </div>

        {result && (
          <div className={`speakResult tier-${result.tier}`}>
            {result.tier === "perfect" && "ออกเสียงตรงทุกคำ เยี่ยมมาก!"}
            {result.tier === "partial" && (
              <>
                ตรงเกินครึ่งแล้ว ลองฟังคำที่ยังไม่ตรง: <b>{result.mismatches.join(" ")}</b>
              </>
            )}
            {result.tier === "low" && "ยังไม่ตรงพอ ลองฟังตัวอย่างแล้วพูดใหม่อีกครั้ง"}
          </div>
        )}

        <button type="button" className="skipBtn" onClick={onSkip}>
          ข้ามข้อนี้
        </button>
      </div>
    </>
  );
}
