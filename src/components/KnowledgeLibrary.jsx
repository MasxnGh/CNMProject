import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Search, Volume2 } from "lucide-react";
import { levels } from "../data/levels";
import { speakChinese } from "../utils/speech";
import PlayerStatus from "./PlayerStatus";

const allItems = levels.flatMap((level) => level.knowledge.map((item) => ({ ...item, levelId: level.id, levelTitle: level.title })));
const categories = ["ทั้งหมด", ...new Set(allItems.map((item) => item.category))];

export default function KnowledgeLibrary({ progress, onBack }) {
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [query, setQuery] = useState("");
  const unlocked = useMemo(() => new Set(progress.unlockedKnowledge), [progress.unlockedKnowledge]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const matches = allItems.filter((item) => {
      const categoryMatch = activeCategory === "ทั้งหมด" || item.category === activeCategory;
      const text = `${item.hanzi} ${item.pinyin} ${item.thai} ${item.example ?? ""} ${item.levelTitle}`.toLowerCase();
      return categoryMatch && (!normalizedQuery || text.includes(normalizedQuery));
    });
    // Words you have actually collected lead; sealed ones trail behind, so the
    // page opens on the collection rather than on dozens of locks.
    return [...matches].sort((a, b) => Number(unlocked.has(b.id)) - Number(unlocked.has(a.id)));
  }, [activeCategory, query, unlocked]);

  return (
    <motion.section className="scene dq-scene v2-scene v2-library-scene" initial={{ opacity: 0, x: 35 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -35 }}>
      <div className="v2-starry-field" aria-hidden="true" />
      <div className="dq-container">
        <div className="v2-page-top">
          <motion.button className="v2-icon-button" whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }} onClick={onBack} aria-label="กลับ">
            <ArrowLeft size={23} />
          </motion.button>
          <div>
            <h1>สมุดคำศัพท์นักเดินทาง</h1>
            <p>คำศัพท์ทุกคำที่เก็บได้ระหว่างเดินทาง จะถูกจดไว้ที่นี่พร้อมเสียงอ่าน</p>
          </div>
        </div>
        <PlayerStatus progress={progress} />

        <div className="v2-library-command">
          <div className="v2-library-counter">
            <strong>{progress.unlockedKnowledge.length}/{allItems.length}</strong>
            <span>คำศัพท์ที่เก็บได้</span>
          </div>
          <label className="v2-search-box">
            <Search size={18} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาจีน / พินอิน / คำแปล" />
          </label>
        </div>

        <div className="v2-category-dock" aria-label="เลือกหมวดความรู้">
          {categories.map((category) => (
            <motion.button key={category} className={activeCategory === category ? "active" : ""} whileHover={{ y: -2 }} whileTap={{ y: 2 }} onClick={() => setActiveCategory(category)}>
              {category}
            </motion.button>
          ))}
        </div>

        <div className="v2-knowledge-grid">
          {visibleItems.map((item, index) => {
            const isUnlocked = unlocked.has(item.id);
            return (
              <motion.article
                key={item.id}
                className={`v2-knowledge-crystal dq-silk ${isUnlocked ? "open" : "closed"}`}
                initial={{ opacity: 0, y: 22, rotateX: -8 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                exit={{ opacity: 0, y: 20 }}
                /* Cap the stagger: with 76 cards an uncapped delay left the
                   tail of the grid invisible for a full second. */
                transition={{ delay: Math.min(index, 22) * 0.012, type: "spring", stiffness: 150, damping: 18 }}
                whileHover={isUnlocked ? { y: -6, rotateY: 2 } : {}}
              >
                {isUnlocked ? (
                  <>
                    <div className="v2-crystal-head">
                      <div>
                        <h3>{item.hanzi}</h3>
                        <p>{item.pinyin}</p>
                      </div>
                      <motion.button className="v2-sound-button" whileHover={{ scale: 1.1, rotate: 6 }} whileTap={{ scale: 0.9 }} onClick={() => speakChinese(item.hanzi)} aria-label="ฟังเสียง">
                        <Volume2 size={19} />
                      </motion.button>
                    </div>
                    <strong className="v2-thai-meaning">{item.thai}</strong>
                    <p className="v2-example">{item.example}</p>
                    <span className="v2-knowledge-tag">ด่าน {item.levelId}: {item.levelTitle}</span>
                  </>
                ) : (
                  <div className="v2-locked-crystal">
                    <Lock size={36} />
                    <strong>ยังปิดผนึกอยู่</strong>
                    <span>ผ่านด่าน {item.levelId} เพื่อเปิดการ์ดนี้</span>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
