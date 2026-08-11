import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameNav from "../../components/ui/GameNav.jsx";
import { useGame } from "../../state/GameContext.jsx";
import { loadBoard, getEntries, MAX_DISPLAYED } from "../../lib/board.js";
import { fetchTopScores, subscribeToScores, MAX_ROWS } from "../../lib/globalBoard.js";
import { hasSupabase } from "../../lib/supabase.js";
import { AVA } from "../../lib/art.js";
import CATEGORIES from "../../content/categories.json";
import CONFIG from "../../content/config.json";
import "./Board.css";

const modeLabel = (id) => CONFIG.modes.find((m) => m.id === id)?.th || id;

const shortDate = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  } catch {
    return "";
  }
};

export default function Board() {
  const navigate = useNavigate();
  const { selection } = useGame();

  const [catId, setCatId] = useState(selection.catIds[0] || CATEGORIES[0].id);
  const [diffId, setDiffId] = useState(selection.diffId);

  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | online | offline
  const [justArrived, setJustArrived] = useState(null); // row id to highlight

  // keep the current filter readable from the realtime callback without
  // re-subscribing on every keystroke-level state change
  const catRef = useRef(catId);
  useEffect(() => {
    catRef.current = catId;
  }, [catId]);

  /** Local board is the fallback shape: {name, avatar, score, mode, date}. */
  const localRows = useCallback(
    () =>
      getEntries(loadBoard(), catId, diffId)
        .slice(0, MAX_DISPLAYED)
        .map((r, i) => ({ id: `local-${i}`, ...r, isLocal: true })),
    [catId, diffId],
  );

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    fetchTopScores(catId, diffId).then(({ rows: data, error }) => {
      if (cancelled) return;
      if (error) {
        setRows(localRows());
        setStatus("offline");
        return;
      }
      setRows(data);
      setStatus("online");
    });

    return () => {
      cancelled = true;
    };
  }, [catId, diffId, localRows]);

  // live updates: a new score anywhere in the world slots itself into the list
  useEffect(() => {
    if (!hasSupabase) return undefined;
    return subscribeToScores(diffId, (row) => {
      if (!row.cat_ids?.includes(catRef.current)) return; // different category board
      setRows((prev) => {
        if (prev.some((r) => r.id === row.id)) return prev;
        return [...prev, row].sort((a, b) => b.score - a.score).slice(0, MAX_ROWS);
      });
      setJustArrived(row.id);
      setStatus("online");
    });
  }, [diffId]);

  const category = CATEGORIES.find((c) => c.id === catId);
  const difficulty = CONFIG.difficulties.find((d) => d.id === diffId);

  return (
    <>
      <GameNav zh="榜" th="กระดานคะแนน" onBack={() => navigate("/setup")} />
      <div className="gwrap">
        <div className="lbStatus">
          {status === "loading" && <span className="lbDot loading" />}
          {status === "online" && <span className="lbDot live" />}
          {status === "offline" && <span className="lbDot off" />}
          {status === "loading" && "กำลังโหลดคะแนน..."}
          {status === "online" && "สดจากผู้เล่นทุกคน · อัปเดตอัตโนมัติ"}
          {status === "offline" && "ออฟไลน์ · แสดงเฉพาะคะแนนในเครื่องนี้"}
        </div>

        <div className="lbLabel">หมวด</div>
        <div className="lbF">
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" className={c.id === catId ? "on" : ""} onClick={() => setCatId(c.id)}>
              {c.icon} {c.th}
            </button>
          ))}
        </div>

        <div className="lbLabel">ระดับ</div>
        <div className="lbF">
          {CONFIG.difficulties.map((d) => (
            <button key={d.id} type="button" className={d.id === diffId ? "on" : ""} onClick={() => setDiffId(d.id)}>
              {d.zh} {d.th}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 6 }}>
          {rows.length ? (
            rows.map((row, i) => (
              <div
                key={row.id}
                className={`lbRow r${i + 1}${row.id === justArrived ? " fresh" : ""}`}
                style={{ animationDelay: `${Math.min(i, 10) * 45}ms` }}
              >
                <div className="rk">{i + 1}</div>
                <div className="av" dangerouslySetInnerHTML={{ __html: AVA[row.avatar] || AVA.fox }} />
                <div className="nm">
                  <b>{row.name}</b>
                  <span>
                    {row.isLocal ? row.mode : modeLabel(row.mode_id)}
                    {row.isLocal
                      ? row.date && ` · ${row.date}`
                      : `${row.accuracy ? ` · แม่น ${row.accuracy}%` : ""} · ${shortDate(row.created_at)}`}
                  </span>
                </div>
                <div className="pt">{row.score.toLocaleString()}</div>
              </div>
            ))
          ) : status === "loading" ? (
            <div className="empty">
              <b>กำลังโหลด...</b>
            </div>
          ) : (
            <div className="empty">
              <b>ยังไม่มีใครทำสถิติในหมวดนี้</b>
              ลองเล่นหมวด{category?.th} ระดับ{difficulty?.th} ให้จบสักรอบ
              <br />
              แล้วคะแนนของคุณจะขึ้นมาเป็นคนแรก
            </div>
          )}
        </div>
      </div>
    </>
  );
}
