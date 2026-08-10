import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useRun } from "../../state/RunContext.jsx";
import { shuffle } from "../../lib/question.js";
import CONFIG from "../../content/config.json";
import "./Modifier.css";

export default function Modifier() {
  const navigate = useNavigate();
  const { run, applyModifier } = useRun();

  useEffect(() => {
    if (!run) navigate("/setup", { replace: true });
  }, [run, navigate]);

  const offered = useMemo(() => {
    if (!run) return [];
    const notHeld = CONFIG.modifiers.filter((m) => !run.mods.includes(m.id));
    return shuffle(notHeld).slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run?.round]);

  if (!run) return null;

  function pick(modifier) {
    applyModifier(modifier.id, modifier.multiplier);
    navigate("/play");
  }

  return (
    <div className="gwrap">
      <div className="modW">
        <div className="kk2">จบรอบที่ {run.round}</div>
        <h2 className="screenTitle">เลือกการ์ดพลิกกติกา</h2>
        <p className="screenSub">มีผลกับรอบถัดไป · ยิ่งเสี่ยงยิ่งคูณสูง</p>

        <div className="mcards">
          {offered.map((m, i) => (
            <button
              key={m.id}
              type="button"
              className="mk"
              style={{ "--c": m.color, "--rot": `${(i - 1) * 1.4}deg`, animationDelay: `${i * 120}ms` }}
              onClick={() => pick(m)}
            >
              <div className="mz zh">{m.zh}</div>
              <div className="mt">{m.th}</div>
              <div className="md2">{m.description}</div>
              <div className={`mx2${m.multiplier < 1 ? " dn" : ""}`}>คูณ ×{m.multiplier.toFixed(1)}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
