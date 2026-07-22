import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import PandaGuide from "./PandaGuide";
import ProgressBar from "./ProgressBar";

const messages = [
  "กำลังประกอบแผนที่เกาะดาว...",
  "กำลังชาร์จผลึกเสียงพินอิน...",
  "กำลังเรียกแพนด้านักผจญภัย...",
  "กำลังเปิดประตูมังกร...",
  "กำลังเตรียมภารกิจภาษาจีน...",
];

export default function LoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const readyRef = useRef(false);
  const message = useMemo(() => messages[Math.min(messages.length - 1, Math.floor(progress / 21))], [progress]);

  useEffect(() => {
    let cancelled = false;
    const markReady = () => {
      if (!cancelled) readyRef.current = true;
    };
    const readiness = typeof document !== "undefined" && document.fonts?.ready
      ? document.fonts.ready.then(markReady).catch(markReady)
      : Promise.resolve().then(markReady);
    const safetyReady = window.setTimeout(markReady, 420);
    const timer = window.setInterval(() => {
      setProgress((current) => Math.min(100, current + (readyRef.current ? 18 : 11)));
    }, 90);
    return () => {
      cancelled = true;
      void readiness;
      window.clearTimeout(safetyReady);
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const done = window.setTimeout(onComplete, 260);
      return () => window.clearTimeout(done);
    }
  }, [onComplete, progress]);

  return (
    <motion.section
      className="scene v2-scene v2-loading-scene grid min-h-screen place-items-center overflow-hidden px-5 py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.015 }}
      transition={{ duration: 0.32, ease: "easeOut" }}
    >
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="v2-dragon-silhouette" aria-hidden="true" />
      <div className="v2-floating-island island-a" />
      <div className="v2-floating-island island-b" />
      <motion.div
        className="v2-loading-gate"
        initial={{ y: 38, opacity: 0, scale: 0.92 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 150, damping: 18 }}
      >
        <div className="v2-gate-ring">
          <PandaGuide text="ประตูดาวพร้อมแล้ว!" />
        </div>
        <motion.h1 initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 165, damping: 15 }}>
          Dujeen Quest
        </motion.h1>
        <p>ภารกิจผจญภัยพิชิตภาษาจีน</p>
        <motion.div className="v2-loading-message" key={message} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Star size={18} fill="currentColor" />
          {message}
        </motion.div>
        <div className="v2-loading-progress">
          <ProgressBar value={progress} max={100} label="Portal Sync" />
          <strong>{Math.round(Math.min(100, progress))}%</strong>
        </div>
      </motion.div>
    </motion.section>
  );
}
