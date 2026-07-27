import { motion } from "framer-motion";
import { BookOpen, Compass, Medal, Play, RotateCcw, Sparkles, Star } from "lucide-react";
import PandaGuide from "./PandaGuide";
import PlayerStatus from "./PlayerStatus";

export default function HomePage({ progress, onStart, onLibrary, onBadges, onReset }) {
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
              <span>Dujeen</span>
              <strong>Quest</strong>
            </motion.div>
            <h1>ภารกิจผจญภัยพิชิตภาษาจีน</h1>
            <p>เดินทางผ่านเกาะลอยแห่งแดนมังกร แก้ปริศนาพินอิน ฟังเสียง จับคู่คำศัพท์ เขียนฮั่นจื้อ และสะสมดาวเพื่อเปิดด่านใหม่</p>
            <div className="v2-hero-actions">
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
                Badge
              </motion.button>
              <motion.button className="v2-button ghost" whileHover={{ y: -3 }} whileTap={{ y: 3 }} onClick={onReset}>
                <RotateCcw size={20} />
                เริ่มใหม่
              </motion.button>
            </div>
          </motion.div>

          <motion.div className="v2-hero-stage" initial={{ x: 36, opacity: 0, scale: 0.94 }} animate={{ x: 0, opacity: 1, scale: 1 }} transition={{ delay: 0.08, type: "spring", stiffness: 140, damping: 18 }}>
            <div className="v2-orbit-map" aria-hidden="true">
              <span className="v2-orbit-ring" />
              <span className="v2-map-island one"><Compass size={24} /></span>
              <span className="v2-map-island two"><BookOpen size={24} /></span>
              <span className="v2-map-island three"><Medal size={24} /></span>
              <span className="v2-map-star a" />
              <span className="v2-map-star b" />
              <span className="v2-map-star c" />
            </div>
            <div className="v2-hero-stat-card">
              <Sparkles size={22} />
              <div>
                <span>Star Gate</span>
                <strong>{progress.totalStars ?? 0}/45 ดาว</strong>
              </div>
            </div>
            <PandaGuide text="เลือกภารกิจ แล้วตามดาวไป!" />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
}
