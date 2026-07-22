import { motion } from "framer-motion";
import { ArrowLeft, Route, Star } from "lucide-react";
import { getLevelsBySet, stageSets } from "../data/levels";
import { getCurrentLevelId, getLevelStars, isLevelCompleted, isLevelUnlocked } from "../utils/gameLogic";
import LevelCard from "./LevelCard";
import PlayerStatus from "./PlayerStatus";

export default function MapPage({ setId, progress, onBack, onPlayLevel }) {
  const set = stageSets.find((item) => item.id === Number(setId));
  const setLevels = getLevelsBySet(setId);
  const currentLevelId = getCurrentLevelId(progress);
  const setStars = setLevels.reduce((total, level) => total + getLevelStars(progress, level.id), 0);

  return (
    <motion.section
      className="scene v2-scene v2-map-scene min-h-screen px-4 py-5 sm:px-6 lg:px-10"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="mx-auto max-w-7xl">
        <div className="v2-page-top">
          <motion.button className="v2-icon-button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onBack} aria-label="กลับไปหน้าเลือกชุดด่าน">
            <ArrowLeft size={23} />
          </motion.button>
          <div>
            <h1>{set?.title}</h1>
            <p>{set?.description}</p>
          </div>
        </div>
        <PlayerStatus progress={progress} />
        <div className="v2-map-legend">
          <span><Route size={18} /> Constellation Route</span>
          <strong><Star size={18} fill="currentColor" /> {setStars}/{setLevels.length * 3} ดาว</strong>
        </div>
        <div className="v2-constellation-map">
          <div className="v2-route-beam" />
          {setLevels.map((level, index) => (
            <div key={level.id} className={`v2-route-slot slot-${index}`}>
              <LevelCard
                level={level}
                unlocked={isLevelUnlocked(progress, level.id)}
                completed={isLevelCompleted(progress, level.id)}
                current={currentLevelId === level.id}
                stars={getLevelStars(progress, level.id)}
                onPlay={onPlayLevel}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
