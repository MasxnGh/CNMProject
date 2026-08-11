import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import GameNav from "../../components/ui/GameNav.jsx";
import Button from "../../components/ui/Button.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import ResultSky from "./ResultSky.jsx";
import { useGame } from "../../state/GameContext.jsx";
import { useRun } from "../../state/RunContext.jsx";
import { loadBoard, saveBoard, recordScore, getEntries } from "../../lib/board.js";
import { submitScore } from "../../lib/globalBoard.js";
import VOCAB from "../../content/vocab.json";
import CONFIG from "../../content/config.json";
import "./Result.css";

const vocabById = new Map(VOCAB.map((w) => [w.id, w]));

function gradeFor(accuracy) {
  if (accuracy >= 90) return "优";
  if (accuracy >= 75) return "良";
  if (accuracy >= 50) return "中";
  return "加";
}

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { player, selection, mastery } = useGame();
  const { run, startRun } = useRun();
  const [isNewRecord, setIsNewRecord] = useState(false);
  const recordedRef = useRef(false);

  const mode = CONFIG.modes.find((m) => m.id === selection.modeId);
  const diff = CONFIG.difficulties.find((d) => d.id === selection.diffId);

  useEffect(() => {
    if (!run) navigate("/setup", { replace: true });
  }, [run, navigate]);

  // Record this run once — to the shared leaderboard and to the local one,
  // which doubles as the offline fallback the Board page reads when Supabase
  // can't be reached. Zen mode never scores/records (per the mode's own
  // rules), and a zero score isn't worth a row.
  useEffect(() => {
    if (!run || recordedRef.current) return;
    if (mode.id === "zen" || run.score <= 0) return;
    recordedRef.current = true;

    let board = loadBoard();
    const entry = {
      name: player.name || "ผู้เล่น",
      avatar: player.avatar,
      score: run.score,
      mode: mode.th,
      date: new Date().toLocaleDateString("th-TH", { day: "numeric", month: "short" }),
    };
    let beatRecord = false;
    for (const catId of selection.catIds) {
      const prevTop = getEntries(board, catId, selection.diffId)[0]?.score || 0;
      board = recordScore(board, catId, selection.diffId, entry);
      if (run.score > prevTop) beatRecord = true;
    }
    saveBoard(board);
    setIsNewRecord(beatRecord);

    // fire-and-forget: a failed upload must not block or break the result screen
    submitScore({
      name: player.name || "ผู้เล่น",
      avatar: player.avatar,
      score: run.score,
      modeId: mode.id,
      diffId: selection.diffId,
      catIds: selection.catIds,
      accuracy: run.tot ? Math.round((run.ok / run.tot) * 100) : 0,
      bestCombo: run.best,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  const kites = useMemo(() => {
    const count = run?.ok || 0;
    return Array.from({ length: count }, () => ({
      x: Math.random(),
      y: Math.random(),
      size: Math.random(),
      tilt: (Math.random() - 0.5) * 0.4,
      colorIdx: Math.floor(Math.random() * 4),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.ok]);

  if (!run) return null;

  const accuracy = run.tot ? Math.round((run.ok / run.tot) * 100) : 0;
  const grade = gradeFor(accuracy);
  const reason = location.state?.reason || "จบเกม";
  const leveledWords = run.leveledWordIds.map((id) => vocabById.get(id)).filter(Boolean);

  return (
    <>
      <GameNav zh="结果" th="สรุปผล" onBack={() => navigate("/setup")} />
      <div className="gwrap">
        <ResultSky kites={kites} />

        <div className="rHero">
          <div className="rz zh">{grade}</div>
          <div className="rs ser">{run.score}</div>
          <div className="rl">
            {reason} · คะแนนรวม
          </div>
          {isNewRecord && <div className="rnew">สถิติสูงสุดใหม่ของหมวดนี้</div>}
        </div>

        <div className="stats">
          <div className="stat">
            <b>
              {run.ok}/{run.tot}
            </b>
            <span>ตอบถูก</span>
          </div>
          <div className="stat">
            <b>{accuracy}%</b>
            <span>ความแม่นยำ</span>
          </div>
          <div className="stat">
            <b>{run.best}</b>
            <span>คอมโบสูงสุด</span>
          </div>
          <div className="stat">
            <b>{run.mult.toFixed(1)}</b>
            <span>ตัวคูณสุดท้าย</span>
          </div>
        </div>

        <div className="panel">
          <h3>คำที่เลื่อนขั้นในรอบนี้</h3>
          {leveledWords.length ? (
            <div className="wgrid">
              {leveledWords.slice(0, 12).map((w) => {
                const lv = mastery[w.id] || 0;
                return (
                  <div className="wc" key={w.id}>
                    <Illustration vocabKey={w.art} category={w.cat} char={w.hanzi[0]} size={64} alt={w.hanzi} />
                    <div className="h">{w.hanzi}</div>
                    <div className="t">{w.thai}</div>
                    <div className="dots">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <i key={n} className={n <= lv ? "f" : ""} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "var(--ink3)", fontSize: 13.5 }}>ยังไม่มีคำที่เลื่อนขั้นในรอบนี้</div>
          )}
        </div>

        <div className="rActions">
          <Button
            block
            onClick={() => {
              startRun(diff);
              navigate("/play");
            }}
          >
            เล่นอีกครั้ง
          </Button>
          <Button block variant="ghost" onClick={() => navigate("/board")}>
            ดูกระดานคะแนน
          </Button>
          <Button block variant="ghost" onClick={() => navigate("/setup")}>
            เปลี่ยนหมวดหรือระดับ
          </Button>
        </div>
      </div>
    </>
  );
}
