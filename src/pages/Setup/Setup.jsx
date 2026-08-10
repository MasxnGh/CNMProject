import { useNavigate } from "react-router-dom";
import GameNav from "../../components/ui/GameNav.jsx";
import Button from "../../components/ui/Button.jsx";
import { useGame } from "../../state/GameContext.jsx";
import { useRun } from "../../state/RunContext.jsx";
import { ART } from "../../lib/art.js";
import CATEGORIES from "../../content/categories.json";
import VOCAB from "../../content/vocab.json";
import CONFIG from "../../content/config.json";
import "./Setup.css";

const wordCountByCat = (catId) => VOCAB.filter((w) => w.cat === catId).length;

export default function Setup() {
  const navigate = useNavigate();
  const { selection, setDiff, toggleCategory, setMode } = useGame();
  const { startRun } = useRun();

  const diff = CONFIG.difficulties.find((d) => d.id === selection.diffId);
  const mode = CONFIG.modes.find((m) => m.id === selection.modeId);
  const isMaze = mode.id === "maze";
  const selectedWordCount = VOCAB.filter((w) => selection.catIds.includes(w.cat)).length;

  const goLabel = isMaze
    ? "เริ่มเล่น · เขาวงกต"
    : `เริ่มเล่น · ${mode.th} · ${diff.th}`;

  function handleStart() {
    if (!isMaze) startRun(diff);
    navigate(isMaze ? "/maze" : "/play");
  }

  return (
    <>
      <GameNav
        zh="设置"
        th="ตั้งค่าการเล่น"
        onBack={() => navigate("/")}
        right={
          <button type="button" className="ico" onClick={() => navigate("/board")}>
            🏆
          </button>
        }
      />
      <div className="gwrap">
        <div className="secT">
          <div className="k">1</div>
          <h3>ระดับความยาก</h3>
        </div>
        <div className="diffs">
          {CONFIG.difficulties.map((d) => (
            <button
              key={d.id}
              type="button"
              className={`diff${d.id === selection.diffId ? " on" : ""}`}
              style={{ "--c": d.color, "--cl": d.colorLight }}
              onClick={() => setDiff(d.id)}
            >
              <div className="dh">
                <span className="dz zh">{d.zh}</span>
                <span className="dt">{d.th}</span>
                <span className="dx">×{d.multiplier.toFixed(1)}</span>
              </div>
              <div className="dm">{d.description}</div>
            </button>
          ))}
        </div>

        <div id="catSec">
          <div className={`secT lockable${isMaze ? " locked" : ""}`}>
            <div className="k">2</div>
            <h3>
              หมวดคำศัพท์{" "}
              <span className="catCount">
                · {selection.catIds.length} หมวด ({selectedWordCount} คำ)
              </span>
            </h3>
          </div>

          <div className={`lockNote${isMaze ? " on" : ""}`}>
            <div className="li" dangerouslySetInnerHTML={{ __html: ART.maze }} />
            <div>
              <b>โหมดเขาวงกตใช้หมวดทิศทางอยู่แล้ว</b>
              <p>
                คำสั่งทั้งหมดในเขาวงกตเป็นคำบอกทิศทาง เช่น 向左走 · 往东走
                <br />
                จึงไม่ต้องเลือกหมวดเอง เปลี่ยนเป็นโหมดอื่นเมื่อไหร่ ตัวเลือกจะกลับมา
              </p>
            </div>
          </div>

          <div className={`cats lockable${isMaze ? " locked" : ""}`}>
            {CATEGORIES.map((c) => {
              const on = selection.catIds.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  className={`cat${on ? " on" : ""}`}
                  style={{ "--c": c.color, "--cl": c.colorLight }}
                  onClick={() => toggleCategory(c.id)}
                  disabled={isMaze}
                >
                  <div className="ci" dangerouslySetInnerHTML={{ __html: ART[c.icon] || "" }} />
                  <div className="cz">{c.zh}</div>
                  <div className="cn">{c.th}</div>
                  <div className="cc">{wordCountByCat(c.id)} คำ</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="secT">
          <div className="k">3</div>
          <h3>โหมดการเล่น</h3>
        </div>
        <div className="mds">
          {CONFIG.modes.map((m) => {
            const on = selection.modeId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                className={`md${on ? " on" : ""}${m.wide ? " wide" : ""}`}
                style={{ "--c": m.color, "--cl": m.colorLight }}
                onClick={() => setMode(m.id)}
              >
                {m.badge && <span className="bg">{m.badge}</span>}
                <div className="mart" dangerouslySetInnerHTML={{ __html: ART[m.icon] || "" }} />
                <div className="mtop">
                  <div className="mi zh">{m.zh}</div>
                  <div>
                    <div className="mn">{m.th}</div>
                    <div className="mpy">{m.pinyin}</div>
                  </div>
                  <div className="mchk">✓</div>
                </div>
                <div className="mm">{m.description}</div>
                <div className="mtags">
                  {m.tags.map((t) => (
                    <span key={t}>{t}</span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <div className="goBar">
          <Button block onClick={handleStart}>
            {goLabel}
          </Button>
        </div>
      </div>
    </>
  );
}
