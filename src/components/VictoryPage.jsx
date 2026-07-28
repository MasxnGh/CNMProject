import { motion, useReducedMotion } from "framer-motion";
import { Coins, Crown, Home, Medal, RotateCcw, Sparkles, Star } from "lucide-react";
import { useEffect } from "react";
import { playWinSound } from "../utils/speech";
import Confetti from "./Confetti";
import PandaGuide from "./PandaGuide";

export default function VictoryPage({ progress, onHome, onReset }) {
  const perfectLevels = Object.values(progress.levelStars ?? {}).filter((stars) => Number(stars) === 3).length;
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    playWinSound();
  }, []);

  return (
    <motion.section
      className="scene dq-scene v2-scene v2-victory-scene overflow-hidden"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Confetti count={64} />
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="v2-treasure-beam" />
      <div className="dq-game-container grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
        <div className="v2-final-chamber">
          <motion.div className="v2-arcane-chest" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 145, damping: 15 }}>
            <span className="lid" />
            <span className="body" />
            <span className="light" />
            <PandaGuide text="สมบัติแห่งความรู้เป็นของคุณ!" />
          </motion.div>
        </div>
        <main className="v2-victory-panel">
          <h1>ยินดีด้วย! คุณพิชิตภารกิจ Dujeen Quest สำเร็จแล้ว</h1>
          <div className="v2-victory-stats">
            <div><Sparkles /><strong>{progress.xp}</strong><span>ค่าประสบการณ์</span></div>
            <div><Coins /><strong>{progress.coins}</strong><span>เหรียญ</span></div>
            <div><Star /><strong>{progress.totalStars ?? 0}</strong><span>ดาวสะสม</span></div>
            <div><Medal /><strong>{progress.badges.length}</strong><span>ตราสะสม</span></div>
            <div><Crown /><strong>{perfectLevels}/15</strong><span>ด่านสามดาว</span></div>
          </div>
          {/* The journey ends the way it was tracked: with a seal. */}
          <div className="v2-certificate">
            <motion.span
              className="dq-seal earned v2-certificate-seal"
              aria-hidden="true"
              initial={reduceMotion ? { opacity: 0 } : { scale: 2.8, opacity: 0, rotate: -22 }}
              animate={reduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1, rotate: -9 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 420, damping: 16 }}
            >
              畢
            </motion.span>
            <span className="v2-certificate-eyebrow">ตราประจำผู้พิชิตเส้นทาง</span>
            <strong>พิชิตภารกิจ Dujeen Quest</strong>
            <p>ผ่านครบ 15 ด่าน สะสมดาว ปลดล็อกคลังความรู้ และเปิดสมบัติแห่งความรู้ภาษาจีน</p>
          </div>
          <div className="v2-result-actions">
            <motion.button className="v2-button glass" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onHome}><Home size={20} /> กลับหน้าแรก</motion.button>
            <motion.button className="v2-button primary" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onReset}><RotateCcw size={20} /> เริ่มผจญภัยใหม่</motion.button>
          </div>
        </main>
      </div>
    </motion.section>
  );
}
