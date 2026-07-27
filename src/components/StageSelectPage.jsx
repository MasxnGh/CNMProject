import { motion } from "framer-motion";
import { ArrowLeft, Crown, Landmark, Lock, Map, Scroll, Sparkles, Star } from "lucide-react";
import { stageSets } from "../data/levels";
import { getSetProgress, getSetStatus } from "../utils/gameLogic";
import PlayerStatus from "./PlayerStatus";
import ProgressBar from "./ProgressBar";

const stageIcons = [Landmark, Scroll, Crown];

export default function StageSelectPage({ progress, onOpenSet, onHome }) {
  return (
    <motion.section
      className="scene dq-scene v2-scene v2-stage-scene"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="dq-container">
        <div className="v2-page-top">
          <motion.button className="v2-icon-button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onHome} aria-label="กลับหน้าแรก">
            <ArrowLeft size={23} />
          </motion.button>
          <div>
            <h1>เลือกประตูภารกิจ</h1>
            <p>แต่ละชุดคือดินแดนใหม่บนแผนที่ดาว สะสมดาวให้ถึงเงื่อนไขเพื่อเปิดประตูถัดไป</p>
          </div>
        </div>
        <PlayerStatus progress={progress} />
        <div className="v2-chapter-grid">
          {stageSets.map((set, index) => {
            const Icon = stageIcons[index] ?? Map;
            const { completed, total, stars, maxStars } = getSetProgress(progress, set.id);
            const status = getSetStatus(progress, set.id);
            const unlocked = set.requiredStars === 0 || progress.totalStars >= set.requiredStars;
            return (
              <motion.article
                key={set.id}
                className={`v2-chapter-portal set-${set.id} ${unlocked ? "unlocked" : "locked"} ${completed === total ? "cleared" : ""}`}
                initial={{ opacity: 0, y: 34, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 150, damping: 18 }}
                whileHover={unlocked ? { y: -10, rotate: index === 1 ? 1.2 : -1.2 } : {}}
              >
                <div className="v2-portal-light" />
                <div className="v2-chapter-emblem">
                  {unlocked ? <Icon size={38} /> : <Lock size={38} />}
                </div>
                <span className="v2-chapter-number">Chapter {set.id}</span>
                <h2>{set.title.replace(`ชุดที่ ${set.id}: `, "")}</h2>
                <p>{set.description}</p>
                <div className="v2-chapter-stars">
                  <Star size={18} fill="currentColor" />
                  <strong>{stars}/{maxStars}</strong>
                  <span>{set.requiredStars ? `ต้องมี ${set.requiredStars} ดาว` : "เปิดทันที"}</span>
                </div>
                <ProgressBar value={stars} max={maxStars} label="Gate Power" />
                <div className="v2-chapter-footer">
                  <span>{status}</span>
                  <motion.button className="v2-button mini" whileHover={unlocked ? { y: -2 } : {}} whileTap={unlocked ? { y: 2 } : {}} onClick={() => unlocked && onOpenSet(set.id)} disabled={!unlocked}>
                    <Map size={18} />
                    เข้าแผนที่
                  </motion.button>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
