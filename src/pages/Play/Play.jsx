import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sheet from "../../components/ui/Sheet.jsx";
import Button from "../../components/ui/Button.jsx";
import Toast from "../../components/ui/Toast.jsx";
import Illustration from "../../components/ui/Illustration.jsx";
import PlaySky from "./PlaySky.jsx";
import CompassPad from "./CompassPad.jsx";
import ClockPad from "./ClockPad.jsx";
import OrderPad from "./OrderPad.jsx";
import MatchPad from "./MatchPad.jsx";
import { useGame } from "../../state/GameContext.jsx";
import { useRun } from "../../state/RunContext.jsx";
import { useBurst } from "../../state/BurstContext.jsx";
import { generateQuestion, KINDS, RISE_MULTIPLIER } from "../../lib/question.js";
import { decideAfterQuestion } from "../../lib/runFlow.js";
import { vibrate } from "../../lib/vibrate.js";
import { playWord, playClock, stop as stopSpeech } from "../../lib/speech.js";
import VOCAB from "../../content/vocab.json";
import CONFIG from "../../content/config.json";
import "./Play.css";

const BURST_COLORS = ["#6FA294", "#C08A2E", "#CE4430", "#3F6BA8"];

// kinds where the full Chinese text is already shown as the *prompt*, not
// the thing being tested — safe to speak (auto or via the speaker button)
// without handing over the answer. This is deliberately the ONE list used
// for both: a kind that isn't safe to auto-speak isn't safe for a manual
// button either, since pressing it would just read the answer out loud.
const SPEAKABLE_KINDS = new Set(["zh2th", "zh2img", "compass", "clock"]);

function speakTarget(q) {
  if (!q || !SPEAKABLE_KINDS.has(q.kind)) return;
  if (q.kind === "clock") playClock(q.clock);
  else playWord(q.word.id);
}

export default function Play() {
  const navigate = useNavigate();
  const { selection, mastery, recordCorrect } = useGame();
  const { run, patchRun, addLeveledWord } = useRun();
  const { triggerBurst } = useBurst();

  const diff = CONFIG.difficulties.find((d) => d.id === selection.diffId);
  const mode = CONFIG.modes.find((m) => m.id === selection.modeId);
  const isHard = selection.diffId === "hard";
  const isZen = mode.id === "zen";
  const hasMod = (id) => Boolean(run && run.mods.includes(id));

  const questionIdRef = useRef(0);
  function makeQuestion(masterySnapshot, mods) {
    questionIdRef.current += 1;
    return {
      id: questionIdRef.current,
      ...generateQuestion({
        vocab: VOCAB,
        catIds: selection.catIds,
        optionCount: diff.options,
        mastery: masterySnapshot,
        sequences: CONFIG.sequences,
        clocks: CONFIG.clocks,
        mods,
      }),
    };
  }

  const [question, setQuestion] = useState(() => (run ? makeQuestion(mastery, run.mods) : null));
  const [locked, setLocked] = useState(false);
  const [answered, setAnswered] = useState(null); // { correctId, wrongId }
  const [flash, setFlash] = useState(null);
  const [shake, setShake] = useState(false);
  const [comboBadge, setComboBadge] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [exitOpen, setExitOpen] = useState(false);

  const kiteRef = useRef(null);
  const spkRef = useRef(null);
  const dzRef = useRef(null);
  const kitePercentRef = useRef(-26);
  const lockedRef = useRef(false);
  const runRef = useRef(run);
  const masteryRef = useRef(mastery);
  const rafRef = useRef(null);
  const comboTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const shakeTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (!run) navigate("/setup", { replace: true });
  }, [run, navigate]);

  useEffect(() => {
    runRef.current = run;
  }, [run]);

  useEffect(() => {
    masteryRef.current = mastery;
  }, [mastery]);

  // rise loop — (re)starts every time a new question is set. Kite/speaker
  // position is driven straight through refs, not React state, so this stays
  // smooth at 60fps without re-rendering the whole page every frame.
  useEffect(() => {
    if (!run || !question) return undefined;

    lockedRef.current = false;
    setLocked(false);
    setAnswered(null);
    kitePercentRef.current = -26;

    const kiteEl = kiteRef.current;
    if (kiteEl) {
      kiteEl.classList.remove("ok", "no");
      kiteEl.style.bottom = "-26%";
    }
    if (spkRef.current) spkRef.current.style.bottom = "calc(-26% - 62px)";
    if (dzRef.current) dzRef.current.classList.remove("on");

    speakTarget(question);

    let seconds = diff.riseSeconds * (RISE_MULTIPLIER[question.kind] || 1);
    if (hasMod("rush")) seconds /= 2;
    if (hasMod("slow")) seconds *= 2;
    if (isZen) seconds *= 3;
    if (mode.id === "endless") seconds /= runRef.current.up;

    const perFrame = 100 / (seconds * 60);
    let last = performance.now();

    function loop(now) {
      const dt = Math.min((now - last) / 16.7, 3);
      last = now;
      kitePercentRef.current += perFrame * dt;
      const kY = kitePercentRef.current;
      if (kiteEl) kiteEl.style.bottom = `${kY}%`;
      if (spkRef.current) spkRef.current.style.bottom = `calc(${kY}% - 62px)`;
      if (dzRef.current) dzRef.current.classList.toggle("on", kY > 66);

      if (kY >= 82 && !lockedRef.current) {
        handleMiss();
        return;
      }
      if (!lockedRef.current) rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question, run]);

  useEffect(
    () => () => {
      clearTimeout(comboTimerRef.current);
      clearTimeout(flashTimerRef.current);
      clearTimeout(shakeTimerRef.current);
      clearTimeout(toastTimerRef.current);
      stopSpeech();
    },
    [],
  );

  function flashFor(kind) {
    setFlash(kind);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), 480);
  }

  function showToast(msg) {
    setToastMsg(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 1500);
  }

  function nextQuestion() {
    setQuestion(makeQuestion(masteryRef.current, runRef.current.mods));
  }

  function advance() {
    const r = runRef.current;
    const decision = decideAfterQuestion({ modeId: mode.id, round: r.round, qIn: r.qIn, miss: r.miss });

    if (decision === "result") {
      const reason = r.miss >= 3 ? "พลาดครบ 3 ครั้ง" : "จบครบ 3 รอบ";
      navigate("/result", { state: { reason } });
      return;
    }
    if (decision === "modifier") {
      patchRun({ qIn: r.qIn + 1 });
      navigate("/modifier");
      return;
    }
    patchRun({ qIn: r.qIn + 1 });
    nextQuestion();
  }

  /** Wrong answer, shared by both resolvers: absorb via shield once per run, else count a miss. */
  function registerMiss() {
    if (hasMod("shield") && !run.shield) {
      patchRun({ shield: 1 });
      showToast("เกราะกันช่วยไว้!");
    } else {
      patchRun({ miss: run.miss + 1 });
    }
  }

  function handleAnswer(opt, buttonEl) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);

    const correct = opt.id === question.word.id;
    setAnswered({ correctId: question.word.id, wrongId: correct ? null : opt.id });
    flashFor(correct ? "ok" : "no");

    const rect = buttonEl.getBoundingClientRect();

    if (correct) {
      const kY = kitePercentRef.current;
      const speedBonus = Math.max(0, Math.round((82 - kY) * 1.6));
      const combo = run.combo + 1;
      const comboBonus = 1 + combo * (hasMod("chain") ? 0.26 : 0.12);
      const gain = isZen ? 0 : Math.round((90 + speedBonus) * run.mult * comboBonus);
      const up = mode.id === "endless" ? Math.min(2.4, run.up + 0.045) : run.up;

      patchRun({ tot: run.tot + 1, score: run.score + gain, combo, best: Math.max(run.best, combo), ok: run.ok + 1, up });

      recordCorrect(question.word.id, isHard);
      addLeveledWord(question.word.id);
      if (kiteRef.current) kiteRef.current.classList.add("ok");
      triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, BURST_COLORS, 44);

      if (combo >= 3) {
        setComboBadge({ text: `ต่อเนื่อง ×${combo}${gain ? `  +${gain}` : ""}`, hot: combo >= 5 });
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setComboBadge(null), 1300);
      }

      vibrate(28);
      setTimeout(advance, 1050);
    } else {
      setComboBadge(null);
      if (kiteRef.current) kiteRef.current.classList.add("no");

      if (mode.id === "perfect") {
        patchRun({ tot: run.tot + 1, combo: 0 });
        setTimeout(() => navigate("/result", { state: { reason: "ตอบผิด" } }), 900);
        return;
      }

      patchRun({ tot: run.tot + 1, combo: 0 });
      registerMiss();
      setShake(true);
      clearTimeout(shakeTimerRef.current);
      shakeTimerRef.current = setTimeout(() => setShake(false), 350);
      vibrate([20, 50, 20]);
      setTimeout(advance, 1550);
    }
  }

  /**
   * Central resolver for all 4 special kinds (compass/clock/order/match) —
   * every one of them calls this, and only this, when the question ends.
   * Scoring/combo/mastery/feedback lives here exactly once, not per kind.
   */
  function resolveSpecial(correct, rect, masteryWordId) {
    if (lockedRef.current) return;
    lockedRef.current = true;
    setLocked(true);
    flashFor(correct ? "ok" : "no");

    if (correct) {
      const kY = kitePercentRef.current;
      const speedBonus = Math.max(0, Math.round((82 - kY) * 1.6));
      const combo = run.combo + 1;
      const comboBonus = 1 + combo * (hasMod("chain") ? 0.26 : 0.12);
      const gain = isZen ? 0 : Math.round((110 + speedBonus) * run.mult * comboBonus);
      const up = mode.id === "endless" ? Math.min(2.4, run.up + 0.045) : run.up;

      patchRun({ tot: run.tot + 1, score: run.score + gain, combo, best: Math.max(run.best, combo), ok: run.ok + 1, up });

      if (masteryWordId) {
        recordCorrect(masteryWordId, isHard);
        addLeveledWord(masteryWordId);
      }
      if (kiteRef.current) kiteRef.current.classList.add("ok");
      if (rect) triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, BURST_COLORS, 44);

      if (combo >= 3) {
        setComboBadge({ text: `ต่อเนื่อง ×${combo}${gain ? `  +${gain}` : ""}`, hot: combo >= 5 });
        clearTimeout(comboTimerRef.current);
        comboTimerRef.current = setTimeout(() => setComboBadge(null), 1300);
      }

      vibrate(28);
      setTimeout(advance, 1150);
    } else {
      setComboBadge(null);
      if (kiteRef.current) kiteRef.current.classList.add("no");

      if (mode.id === "perfect") {
        patchRun({ tot: run.tot + 1, combo: 0 });
        setTimeout(() => navigate("/result", { state: { reason: "ตอบผิด" } }), 900);
        return;
      }

      patchRun({ tot: run.tot + 1, combo: 0 });
      registerMiss();
      vibrate([20, 50, 20]);
      setTimeout(advance, 1650);
    }
  }

  function handleMiss() {
    if (lockedRef.current) return;

    if (!KINDS.includes(question.kind)) {
      // special kinds funnel every ending — including a timeout — through the shared resolver
      resolveSpecial(false, null, null);
      return;
    }

    lockedRef.current = true;
    setLocked(true);
    setAnswered({ correctId: question.word.id, wrongId: null });
    flashFor("no");
    setComboBadge(null);
    if (kiteRef.current) kiteRef.current.classList.add("no");

    if (mode.id === "perfect") {
      patchRun({ tot: run.tot + 1, combo: 0 });
      setTimeout(() => navigate("/result", { state: { reason: "ปล่อยว่าวหลุด" } }), 1000);
      return;
    }

    patchRun({ tot: run.tot + 1, combo: 0 });
    registerMiss();
    vibrate([30, 60, 30]);
    setTimeout(advance, 1500);
  }

  function renderQuestionBody() {
    const w = question.word;
    const pin = diff.pinyin && !hasMod("nopin");
    switch (question.kind) {
      case "img2zh":
        return (
          <>
            <div className="im">
              <Illustration vocabKey={w.art} category={w.cat} char={w.hanzi[0]} size={130} alt={w.hanzi} />
            </div>
            <div className="hint">ภาพนี้คือคำจีนคำไหน</div>
          </>
        );
      case "zh2img":
        return (
          <>
            {pin && <div className="py">{w.pinyin}</div>}
            <div className="zh2 zh">{w.hanzi}</div>
            <div className="hint">เลือกภาพที่ตรงกับคำนี้</div>
          </>
        );
      case "zh2th":
        return (
          <>
            {pin && <div className="py">{w.pinyin}</div>}
            <div className="zh2 zh">{w.hanzi}</div>
            <div className="hint">คำนี้แปลว่าอะไร</div>
          </>
        );
      case "th2zh":
        return (
          <>
            <div className="th">{w.thai}</div>
            <div className="hint">เลือกคำจีนที่ตรงกัน</div>
          </>
        );
      case "compass":
        return (
          <>
            <div className="hint">กดลูกศรตามทิศที่คำนี้บอก</div>
            {pin && <div className="py">{w.pinyin}</div>}
            <div className="zh2 zh">{w.hanzi}</div>
          </>
        );
      case "clock":
        return (
          <>
            <div className="hint">เวลานี้ตรงกับนาฬิกาเรือนไหน</div>
            {pin && <div className="py">{question.clock.pinyin}</div>}
            <div className="zh2 zh">{question.clock.hanzi}</div>
          </>
        );
      case "order":
        return (
          <>
            <div className="kindGlyph">🔢</div>
            <div className="hint">{question.sequence.title}</div>
          </>
        );
      case "match":
        return (
          <>
            <div className="kindGlyph">🧩</div>
            <div className="hint">จับคู่ภาพกับคำให้ครบ 3 คู่</div>
          </>
        );
      default:
        return null;
    }
  }

  function renderOptionBody(opt) {
    if (question.imageSide === "a") {
      return (
        <div className="ai big">
          <Illustration vocabKey={opt.art} category={opt.cat} char={opt.hanzi[0]} size={80} alt={opt.hanzi} />
        </div>
      );
    }
    if (question.kind === "zh2th") {
      return <div className="at">{opt.thai}</div>;
    }
    return (
      <div>
        <div className="az zh">{opt.hanzi}</div>
        {diff.pinyin && !hasMod("nopin") && <div className="ap">{opt.pinyin}</div>}
      </div>
    );
  }

  if (!run || !question) return null;

  const roundLabel = mode.id === "risk" ? `${run.round}/3` : "—";
  const missLabel = mode.id === "perfect" ? "0/1" : isZen ? "—" : `${run.miss}/3`;

  return (
    <div className="play-view">
      <PlaySky />
      <div className="dz" ref={dzRef}>
        <div className="zl">เขตลมบน</div>
      </div>

      <div className="pTop">
        <button type="button" className="hc" onClick={() => setExitOpen(true)}>
          ✕
        </button>
        <div className="hc">
          <span className="lb">รอบ</span>
          <span>{roundLabel}</span>
        </div>
        <div className="hc sc">
          <span className="lb">คะแนน</span>
          <span>{isZen ? "—" : run.score}</span>
        </div>
        <div className="hc mx">×{run.mult.toFixed(1)}</div>
        <div className="hc">
          <span className="lb">พลาด</span>
          <span>{missLabel}</span>
        </div>
      </div>

      {run.mods.length > 0 && (
        <div className="amods">
          {run.mods.map((id) => {
            const m = CONFIG.modifiers.find((x) => x.id === id);
            if (!m) return null;
            return (
              <span key={id} className="amod" style={{ "--c": m.color, "--cl": m.color }}>
                {m.zh} {m.th}
              </span>
            );
          })}
        </div>
      )}

      <div className="stage">
        <div className="kite" ref={kiteRef}>
          <div className="body">{renderQuestionBody()}</div>
          <div className="tail" />
        </div>
      </div>

      {SPEAKABLE_KINDS.has(question.kind) && (
        <button type="button" className="spkB" ref={spkRef} onClick={() => speakTarget(question)} aria-label="ฟังเสียงอ่าน">
          🔊
        </button>
      )}

      <div className="dock">
        {question.kind === "compass" && (
          <CompassPad
            key={question.id}
            vector={question.vector}
            locked={locked}
            onResolve={(correct, rect) => resolveSpecial(correct, rect, question.word.id)}
          />
        )}
        {question.kind === "clock" && (
          <ClockPad
            key={question.id}
            clock={question.clock}
            options={question.options}
            locked={locked}
            onResolve={(correct, rect) => resolveSpecial(correct, rect, null)}
          />
        )}
        {question.kind === "order" && (
          <OrderPad
            key={question.id}
            sequence={question.sequence}
            locked={locked}
            onResolve={(correct, rect) => resolveSpecial(correct, rect, null)}
          />
        )}
        {question.kind === "match" && (
          <MatchPad
            key={question.id}
            words={question.matchWords}
            locked={locked}
            onResolve={(correct, rect) => resolveSpecial(correct, rect, question.matchWords[0].id)}
          />
        )}
        {KINDS.includes(question.kind) && (
          <div className={`aGrid${shake ? " shk" : ""}`}>
            {question.options.map((opt) => {
              let cls = "aB";
              if (question.imageSide === "a") cls += " imgOpt";
              if (answered) {
                if (opt.id === answered.correctId) cls += " good";
                else if (opt.id === answered.wrongId) cls += " bad";
              }
              return (
                <button
                  key={opt.id}
                  type="button"
                  className={cls}
                  disabled={locked}
                  onClick={(e) => handleAnswer(opt, e.currentTarget)}
                >
                  {renderOptionBody(opt)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className={`combo${comboBadge ? " on" : ""}${comboBadge?.hot ? " hot" : ""}`}>
        {comboBadge?.text}
      </div>
      <div className={`play-flash${flash ? ` ${flash}` : ""}`} />
      <Toast open={!!toastMsg} message={toastMsg} tone="success" />

      <Sheet open={exitOpen} onClose={() => setExitOpen(false)} title="ออกจากเกม?">
        <p>คะแนนรอบนี้จะไม่ถูกบันทึก</p>
        <Sheet.Actions>
          <Button block onClick={() => navigate("/setup")}>
            ออกเลย
          </Button>
          <Button block variant="ghost" onClick={() => setExitOpen(false)}>
            ยกเลิก
          </Button>
        </Sheet.Actions>
      </Sheet>
    </div>
  );
}
