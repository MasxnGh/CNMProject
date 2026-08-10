import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameNav from "../../components/ui/GameNav.jsx";
import { useGame } from "../../state/GameContext.jsx";
import { loadBoard, getEntries, MAX_DISPLAYED } from "../../lib/board.js";
import { AVA } from "../../lib/art.js";
import CATEGORIES from "../../content/categories.json";
import CONFIG from "../../content/config.json";
import "./Board.css";

export default function Board() {
  const navigate = useNavigate();
  const { selection } = useGame();

  // Safe default for the first render — the real data only ever loads in an
  // effect, so server-rendered and first-client-rendered markup always match.
  const [board, setBoard] = useState({ version: 1, entries: {} });
  const [catId, setCatId] = useState(selection.catIds[0] || CATEGORIES[0].id);
  const [diffId, setDiffId] = useState(selection.diffId);

  useEffect(() => {
    setBoard(loadBoard());
  }, []);

  const category = CATEGORIES.find((c) => c.id === catId);
  const difficulty = CONFIG.difficulties.find((d) => d.id === diffId);
  const entries = getEntries(board, catId, diffId).slice(0, MAX_DISPLAYED);

  return (
    <>
      <GameNav zh="榜" th="กระดานคะแนน" onBack={() => navigate("/setup")} />
      <div className="gwrap">
        <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 8 }}>หมวด</div>
        <div className="lbF">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={c.id === catId ? "on" : ""} onClick={() => setCatId(c.id)}>
              {c.th}
            </button>
          ))}
        </div>

        <div style={{ fontSize: 12, color: "var(--ink3)", marginBottom: 8 }}>ระดับ</div>
        <div className="lbF">
          {CONFIG.difficulties.map((d) => (
            <button key={d.id} type="button" className={d.id === diffId ? "on" : ""} onClick={() => setDiffId(d.id)}>
              {d.zh} {d.th}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 6 }}>
          {entries.length ? (
            entries.map((row, i) => (
              <div key={i} className={`lbRow r${i + 1}`} style={{ animationDelay: `${i * 45}ms` }}>
                <div className="rk">{i + 1}</div>
                <div className="av" dangerouslySetInnerHTML={{ __html: AVA[row.avatar] || AVA.fox }} />
                <div className="nm">
                  <b>{row.name}</b>
                  <span>
                    {row.mode}
                    {row.date ? ` · ${row.date}` : ""}
                  </span>
                </div>
                <div className="pt">{row.score.toLocaleString()}</div>
              </div>
            ))
          ) : (
            <div className="empty">
              <b>ยังไม่มีสถิติในหมวดนี้</b>
              ลองเล่นหมวด{category?.th} ระดับ{difficulty?.th} ให้จบสักรอบ
              <br />
              แล้วคะแนนของคุณจะขึ้นมาที่นี่
            </div>
          )}
        </div>
      </div>
    </>
  );
}
