import { motion, useReducedMotion } from "framer-motion";
import { Check, Eraser, Eye, Undo2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { scoreStrokeSet } from "../utils/hanziCoverage";

const drawStroke = (context, stroke) => {
  if (!stroke.length) return;
  context.beginPath();
  context.moveTo(stroke[0].x, stroke[0].y);
  stroke.slice(1).forEach((point) => context.lineTo(point.x, point.y));
  context.stroke();
};

export default function HanziTraceMission({ missionView, onSubmit, disabled, feedback }) {
  const canvasRef = useRef(null);
  const currentStrokeRef = useRef(null);
  const canvasSizeRef = useRef({ width: 0, height: 0 });
  const [strokes, setStrokes] = useState([]);
  const [guideVisible, setGuideVisible] = useState(true);
  const reduceMotion = useReducedMotion();
  const mode = missionView.mechanics?.mode ?? "practice";

  const configureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const context = canvas.getContext("2d");
    const bounds = canvas.getBoundingClientRect();
    const width = Math.max(1, bounds.width);
    const height = Math.max(1, bounds.height);
    const ratio = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvasSizeRef.current = { width, height };
    context.scale(ratio, ratio);
    context.lineCap = "round";
    context.lineJoin = "round";
    context.lineWidth = 9;
    context.strokeStyle = "#8f1c1b";
    return context;
  };

  useEffect(() => {
    setStrokes([]);
    currentStrokeRef.current = null;
    configureCanvas();
  }, [missionView.id]);

  useEffect(() => {
    if (mode === "practice") {
      setGuideVisible(true);
      return undefined;
    }
    setGuideVisible(true);
    const timeoutId = window.setTimeout(() => setGuideVisible(false), 2500);
    return () => window.clearTimeout(timeoutId);
  }, [missionView.id, mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    const { width, height } = canvasSizeRef.current;
    context.clearRect(0, 0, width, height);
    strokes.forEach((stroke) => drawStroke(context, stroke));
  }, [strokes]);

  const pointerPosition = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };

  const start = (event) => {
    if (disabled) return;
    event.preventDefault();
    const point = pointerPosition(event);
    currentStrokeRef.current = [point];
    const context = canvasRef.current.getContext("2d");
    context.beginPath();
    context.moveTo(point.x, point.y);
    canvasRef.current.setPointerCapture?.(event.pointerId);
  };

  const move = (event) => {
    if (!currentStrokeRef.current || disabled) return;
    event.preventDefault();
    const point = pointerPosition(event);
    currentStrokeRef.current.push(point);
    const context = canvasRef.current.getContext("2d");
    context.lineTo(point.x, point.y);
    context.stroke();
  };

  const stop = (event) => {
    const stroke = currentStrokeRef.current;
    if (!stroke) return;
    currentStrokeRef.current = null;
    setStrokes((current) => [...current, stroke]);
    canvasRef.current.releasePointerCapture?.(event.pointerId);
  };

  const clear = () => {
    currentStrokeRef.current = null;
    setStrokes([]);
  };

  const undo = () => setStrokes((current) => current.slice(0, -1));

  const submit = () => {
    const metrics = scoreStrokeSet(strokes, canvasSizeRef.current);
    onSubmit({ type: "hanziTrace", ...metrics, attempted: metrics.strokeCount > 0 });
  };

  const pointCount = strokes.reduce((total, stroke) => total + stroke.length, 0);
  const minStrokePoints = missionView.mechanics?.minStrokePoints ?? 28;

  return (
    <div className="mission-shell trace-mission">
      <div className="trace-board">
        {guideVisible ? <div className="trace-guide" aria-hidden="true">{missionView.characterToTrace}</div> : null}
        {feedback?.correct ? <motion.div className="trace-stamp" initial={reduceMotion ? false : { scale: 0, rotate: -12 }} animate={{ scale: 1, rotate: -8 }}>ผ่าน</motion.div> : null}
        <canvas
          ref={canvasRef}
          className="trace-canvas"
          style={{ touchAction: "none" }}
          aria-label="พื้นที่เขียนตัวอักษรจีน"
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={stop}
          onPointerCancel={stop}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
      <div className="trace-meta" aria-live="polite">
        {missionView.promptPinyin ? <i className="card-pinyin">{missionView.promptPinyin}</i> : null}
        <strong>{missionView.characterToTrace}</strong>
        <span>{missionView.thaiMeaning}</span>
        <small>{strokes.length} เส้น, {pointCount}/{minStrokePoints} จุด</small>
      </div>
      <div className={`grid gap-3 ${mode === "challenge" ? "grid-cols-2 sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        <motion.button type="button" className="game-button secondary" whileTap={reduceMotion ? undefined : { y: 2 }} onClick={undo} disabled={disabled || strokes.length === 0}>
          <Undo2 size={19} />
          ย้อนกลับ
        </motion.button>
        <motion.button type="button" className="game-button secondary" whileTap={reduceMotion ? undefined : { y: 2 }} onClick={clear} disabled={disabled || strokes.length === 0}>
          <Eraser size={19} />
          ล้าง
        </motion.button>
        {mode === "challenge" ? (
          <motion.button type="button" className="game-button secondary" whileTap={reduceMotion ? undefined : { y: 2 }} onClick={() => setGuideVisible((visible) => !visible)} disabled={disabled}>
            <Eye size={19} />
            {guideVisible ? "ซ่อนเส้นนำ" : "แสดงเส้นนำ"}
          </motion.button>
        ) : null}
        <motion.button type="button" className="game-button primary" whileTap={reduceMotion ? undefined : { y: 2 }} onClick={submit} disabled={disabled || strokes.length === 0}>
          <Check size={19} />
          ตรวจ
        </motion.button>
      </div>
    </div>
  );
}
