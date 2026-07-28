import { motion } from "framer-motion";
import { BookOpen, Lock, Medal, Play, RotateCcw, Star } from "lucide-react";
import { stageSets } from "../data/levels";
import { getSetProgress } from "../utils/gameLogic";
import PandaGuide from "./PandaGuide";
import PlayerStatus from "./PlayerStatus";

/* Each chapter carries a seal glyph, so the hero shows the journey itself
   rather than repeating the buttons that sit beside it. */
const chapterSeals = ["市", "節", "殿"];

export default function HomePage({ progress, onStart, onLibrary, onBadges, onReset }) {
  const totalStars = progress.totalStars ?? 0;
  const chapters = stageSets.map((set, index) => {
    const { stars, maxStars } = getSetProgress(progress, set.id);
    return {
      id: set.id,
      seal: chapterSeals[index] ?? "旅",
      unlocked: totalStars >= (set.requiredStars ?? 0),
      cleared: maxStars > 0 && stars >= maxStars,
      stars,
      maxStars,
      requiredStars: set.requiredStars ?? 0,
    };
  });

  return (
    <motion.section
      className="scene dq-scene v2-scene v2-home-scene overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, x: -35 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="v2-dragon-silhouette" aria-hidden="true" />
      <div className="dq-container flex flex-col">
        <PlayerStatus progress={progress} compact />
        <div className="v2-home-grid">
          <motion.div className="v2-hero-copy" initial={{ x: -34, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ type: "spring", stiffness: 150, damping: 18 }}>
            <motion.div className="v2-logo-mark" initial={{ scale: 0.82, rotate: -4 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 180, damping: 14 }}>
              <motion.span
                className="dq-seal v2-title-seal"
                aria-hidden="true"
                initial={{ scale: 1.9, opacity: 0, rotate: -14 }}
                animate={{ scale: 1, opacity: 1, rotate: -5 }}
                transition={{ delay: 0.32, type: "spring", stiffness: 460, damping: 17 }}
              >
                旅
              </motion.span>
              <span>Dujeen</span>
              <strong>Quest</strong>
            </motion.div>
            <h1>ภารกิจผจญภัยพิชิตภาษาจีน</h1>
            <p>เดินทางผ่านเกาะลอยแห่งแดนมังกร แก้ปริศนาพินอิน ฟังเสียง จับคู่คำศัพท์ เขียนฮั่นจื้อ และสะสมดาวเพื่อเปิดด่านใหม่</p>
            <div className="v2-hero-actions" role="group" aria-label="Quest actions">
              <motion.button className="v2-button primary" whileHover={{ y: -4, scale: 1.02 }} whileTap={{ y: 4, scale: 0.98 }} onClick={onStart}>
                <Play size={24} />
                เริ่มการผจญภัย
              </motion.button>
              <motion.button className="v2-button glass" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onLibrary}>
                <BookOpen size={21} />
                คลังความรู้
              </motion.button>
              <motion.button className="v2-button glass" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onBadges}>
                <Medal size={21} />
                ตราสะสม
              </motion.button>
              <motion.button className="v2-button ghost" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onReset}>
                <RotateCcw size={20} />
                เริ่มใหม่
              </motion.button>
            </div>
          </motion.div>

          <motion.div className="v2-hero-stage dq-silk" initial={{ x: 36, opacity: 0, scale: 0.94 }} animate={{ x: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.08, type: "spring", stiffness: 140, damping: 18 }}>
            <div className="v2-journey">
              <span className="v2-journey-title">เส้นทางคัมภีร์</span>
              <ol className="v2-journey-road">
                {chapters.map((chapter, index) => (
                  <motion.li
                    key={chapter.id}
                    className={`v2-journey-stop ${chapter.cleared ? "cleared" : ""} ${chapter.unlocked ? "open" : "locked"}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.24 + index * 0.09, duration: 0.32 }}
                  >
                    <span className={`dq-seal ${chapter.cleared ? "earned" : ""} v2-journey-seal`} aria-hidden="true">
                      {chapter.unlocked ? chapter.seal : <Lock size={17} />}
                    </span>
                    <b>{chapter.unlocked ? `${chapter.stars}/${chapter.maxStars}` : `ต้องมี ${chapter.requiredStars} ดาว`}</b>
                  </motion.li>
                ))}
              </ol>
              <div className="v2-journey-total">
                <Star size={17} fill="currentColor" aria-hidden="true" />
                <strong>{totalStars}</strong>
                <span>/ 45 ดาวบนเส้นทาง</span>
              </div>
            </div>
            <PandaGuide text="เลือกภารกิจ แล้วออกเดินทางกันเลย!" />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
