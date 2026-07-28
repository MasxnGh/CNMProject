import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Route, Star } from "lucide-react";
import { getLevelsBySet, stageSets } from "../data/levels";
import { getCurrentLevelId, getLevelStars, isLevelCompleted, isLevelUnlocked } from "../utils/gameLogic";
import LevelCard from "./LevelCard";
import { getCheckpointLevels, isCheckpointCleared } from "../utils/checkpoint";
import PlayerStatus from "./PlayerStatus";

export default function MapPage({ setId, progress, onBack, onPlayLevel, onPlayCheckpoint }) {
  const checkpointLevels = getCheckpointLevels(progress, setId);
  const checkpointCleared = isCheckpointCleared(progress, setId);
  const set = stageSets.find((item) => item.id === Number(setId));
  const setLevels = getLevelsBySet(setId);
  const currentLevelId = getCurrentLevelId(progress);
  const setStars = setLevels.reduce((total, level) => total + getLevelStars(progress, level.id), 0);
  const mapRef = useRef(null);
  const [route, setRoute] = useState({ width: 1, height: 1, points: "" });
  /* One stop is open at a time, and the route opens on wherever the player
     left off rather than making them hunt for it. */
  const [openLevelId, setOpenLevelId] = useState(null);

  useEffect(() => {
    setOpenLevelId(setLevels.some((level) => level.id === currentLevelId) ? currentLevelId : null);
  }, [setId, currentLevelId]);

  useLayoutEffect(() => {
    const map = mapRef.current;
    if (!map) return undefined;

    const syncRoute = () => {
      const bounds = map.getBoundingClientRect();
      /* Measured on the node rather than its slot: an open detail sheet makes
         the slot much taller, which would drag the path away from the stops. */
      const points = [...map.querySelectorAll(".v2-level-island")]
        .map((slot) => {
          const rect = slot.getBoundingClientRect();
          return `${Math.round(rect.left - bounds.left + rect.width / 2)},${Math.round(rect.top - bounds.top + rect.height / 2)}`;
        })
        .join(" ");
      setRoute({ width: Math.max(1, Math.round(bounds.width)), height: Math.max(1, Math.round(bounds.height)), points });
    };

    const observer = new ResizeObserver(syncRoute);
    observer.observe(map);
    window.addEventListener("resize", syncRoute);
    const initialFrame = requestAnimationFrame(syncRoute);
    const settledRoute = window.setTimeout(syncRoute, 500);

    return () => {
      cancelAnimationFrame(initialFrame);
      window.clearTimeout(settledRoute);
      window.removeEventListener("resize", syncRoute);
      observer.disconnect();
    };
  }, [setId]);

  return (
    <motion.section
      className="scene dq-scene v2-scene v2-map-scene"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
    >
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="dq-container">
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
        {checkpointLevels.length > 1 && !checkpointCleared ? (
          <motion.button
            type="button"
            className="v2-checkpoint-gate dq-silk"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -3 }}
            whileTap={{ y: 2 }}
            onClick={() => onPlayCheckpoint?.(setId)}
          >
            <span className="dq-seal v2-checkpoint-seal" aria-hidden="true">試</span>
            <span className="min-w-0">
              <b>ข้ามด่านด้วยบททดสอบ</b>
              <small>รู้อยู่แล้ว? สอบผ่านครั้งเดียวเพื่อข้าม {checkpointLevels.length} ด่านที่เหลือ</small>
            </span>
          </motion.button>
        ) : null}

        <div className="v2-map-legend">
          <span><Route size={18} /> เส้นทางในบทนี้</span>
          <strong><Star size={18} fill="currentColor" /> {setStars}/{setLevels.length * 3} ดาว</strong>
        </div>
        <div ref={mapRef} className="v2-constellation-map">
          <svg className="v2-route-beam" viewBox={`0 0 ${route.width} ${route.height}`} aria-hidden="true">
            <defs>
              <linearGradient id={`route-beam-${set?.id ?? setId}`} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="rgba(53, 208, 172, 0.75)" />
                <stop offset="0.5" stopColor="rgba(255, 215, 107, 0.95)" />
                <stop offset="1" stopColor="rgba(53, 208, 172, 0.75)" />
              </linearGradient>
            </defs>
            <polyline points={route.points} stroke={`url(#route-beam-${set?.id ?? setId})`} />
          </svg>
          {setLevels.map((level, index) => (
            <div key={level.id} className={`v2-route-slot slot-${index}`}>
              <LevelCard
                level={level}
                unlocked={isLevelUnlocked(progress, level.id)}
                completed={isLevelCompleted(progress, level.id)}
                current={currentLevelId === level.id}
                stars={getLevelStars(progress, level.id)}
                onPlay={onPlayLevel}
                open={openLevelId === level.id}
                /* Selecting, not toggling: one stop stays open, so there is
                   always a way to start and no tap leaves the route blank. */
                onOpen={setOpenLevelId}
              />
            </div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
