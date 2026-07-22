import { motion } from "framer-motion";
import { ArrowRight, Map, Medal, RotateCcw, Sparkles, Star, Trophy } from "lucide-react";
import { useEffect } from "react";
import { badges } from "../data/badges";
import { playWinSound } from "../utils/speech";
import Confetti from "./Confetti";
import PandaGuide from "./PandaGuide";
import ProgressBar from "./ProgressBar";

export default function ResultPage({ result, progress, onNext, onMap, onRetry, onVictory }) {
  const passed = result?.passed;
  const earnedBadges = badges.filter((badge) => result?.earned.badges.includes(badge.id));
  const nextAction = result?.isVictory ? onVictory : onNext;

  useEffect(() => {
    if (passed) playWinSound();
  }, [passed]);

  return (
    <motion.section
      className={`scene v2-scene v2-result-scene min-h-screen px-4 py-8 sm:px-6 lg:px-10 ${passed ? "passed" : "failed"}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.04 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      {passed ? <Confetti /> : null}
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[360px_1fr]">
        <aside className="v2-reward-side">
          <div className="v2-reward-orb">
            <Trophy size={54} />
            <span>{passed ? "CLEAR" : "RETRY"}</span>
          </div>
          <PandaGuide mood={passed ? "happy" : "sad"} text={passed ? "ดาวของคุณสว่างขึ้นแล้ว!" : "ลองใหม่อีกครั้ง เกือบถึงแล้ว!"} />
        </aside>
        <motion.main className="v2-result-panel" initial={{ y: 35, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 170, damping: 18 }}>
          <div className="v2-result-title">
            <span>{result.level.title}</span>
            <h1>{passed ? "ภารกิจสำเร็จ" : "ภารกิจยังไม่สำเร็จ"}</h1>
            <p>ตอบถูก {result.correct}/{result.total} • คะแนน {result.score} • ใช้ Hint {result.hintsUsed}</p>
          </div>

          <div className="v2-result-stars" aria-label={`${result.stars} ดาว`}>
            {[1, 2, 3].map((star) => (
              <motion.span
                key={star}
                className={star <= result.stars ? "earned" : "empty"}
                initial={{ y: 30, scale: 0, rotate: -35, opacity: 0 }}
                animate={{ y: 0, scale: 1, rotate: star <= result.stars ? [0, 18, -8, 0] : 0, opacity: 1 }}
                transition={{ delay: 0.16 * star, type: "spring", stiffness: 220, damping: 13 }}
              >
                <Star size={52} fill="currentColor" />
              </motion.span>
            ))}
          </div>

          {passed && result.earned.newRecord ? <div className="v2-record-ribbon">ทำสถิติใหม่! ได้ดาวเพิ่ม +{result.earned.stars}</div> : null}
          {!passed ? <div className="v2-record-ribbon muted">ต้องตอบถูกอย่างน้อย 3 ภารกิจเพื่อผ่านด่าน</div> : null}

          <div className="v2-reward-grid">
            <div><Sparkles /><strong>+{result.earned.xp}</strong><span>XP</span></div>
            <div><Sparkles /><strong>+{result.earned.coins}</strong><span>Coins</span></div>
            <div><Star /><strong>{result.stars}/3</strong><span>Stars</span></div>
          </div>

          <div className="v2-xp-panel">
            <ProgressBar value={progress.xp % 120} max={120} label={`Level ${progress.level} XP`} />
          </div>

          <div className="v2-result-info">
            <section>
              <h2>ความรู้ที่ใช้ในด่าน</h2>
              <ul>
                {result.level.knowledge.slice(0, 5).map((item) => (
                  <li key={item.id}><strong>{item.hanzi}</strong> <span>{item.pinyin}</span> = {item.thai}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2>รางวัลพิเศษ</h2>
              {result.earned.repeated ? <p>ด่านนี้เคยผ่านแล้ว ระบบเก็บดาวสูงสุดไว้ ไม่ลดดาวเดิม</p> : null}
              {passed && result.earned.knowledge.length ? <p>ปลดล็อกคลังความรู้ใหม่ {result.earned.knowledge.length} รายการ</p> : null}
              {earnedBadges.length ? earnedBadges.map((badge) => <div key={badge.id} className="v2-badge-chip"><Medal size={18} /> {badge.name}</div>) : <p>{passed ? "ไม่มี Badge ใหม่ในรอบนี้" : "ลองเล่นซ้ำเพื่อเก็บดาวเพิ่ม"}</p>}
            </section>
          </div>

          <div className="v2-result-actions">
            <motion.button className="v2-button glass" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onMap}><Map size={20} /> กลับแผนที่</motion.button>
            <motion.button className="v2-button ghost" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onRetry}><RotateCcw size={20} /> เล่นซ้ำเก็บ 3 ดาว</motion.button>
            <motion.button className="v2-button primary" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={nextAction} disabled={!passed}><ArrowRight size={20} /> {result?.isVictory ? "ไปห้องสมบัติ" : "ไปด่านถัดไป"}</motion.button>
          </div>
        </motion.main>
      </div>
    </motion.section>
  );
}
