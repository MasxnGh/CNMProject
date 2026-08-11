import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameNav from "../../components/ui/GameNav.jsx";
import DirectionPad from "../../components/ui/DirectionPad.jsx";
import Sheet from "../../components/ui/Sheet.jsx";
import Button from "../../components/ui/Button.jsx";
import { useBurst } from "../../state/BurstContext.jsx";
import { vibrate } from "../../lib/vibrate.js";
import { initMaze, commandFor } from "../../lib/maze.js";
import CONFIG from "../../content/config.json";
import "./Maze.css";

const { levels: MAX_LEVEL, maxWrong: MAX_WRONG } = CONFIG.maze;

export default function Maze() {
  const navigate = useNavigate();
  const { triggerBurst } = useBurst();

  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState(() => initMaze(1));
  const [score, setScore] = useState(0);
  const [steps, setSteps] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [busy, setBusy] = useState(false);
  const [wrongDir, setWrongDir] = useState(null);
  const [flash, setFlash] = useState(null);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [clearedOpen, setClearedOpen] = useState(false);
  const [overOpen, setOverOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const gameOver = clearedOpen || overOpen;

  const wrongTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const stepTimerRef = useRef(null);

  useEffect(() => {
    setWrongDir(null);
  }, [maze.command]);

  useEffect(
    () => () => {
      clearTimeout(wrongTimerRef.current);
      clearTimeout(flashTimerRef.current);
      clearTimeout(stepTimerRef.current);
    },
    [],
  );

  function flashFor(kind) {
    setFlash(kind);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), 420);
  }

  function handlePress(dir, el) {
    if (busy) return;
    const want = maze.command;
    const isRightDir = dir.dx === want.dx && dir.dy === want.dy;

    if (!isRightDir) {
      setWrongDir(dir);
      clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongDir(null), 420);
      setScore((s) => Math.max(0, s - 30));
      flashFor("no");
      vibrate([20, 50, 20]);

      // wrong presses accumulate across the whole run, not per level — without
      // a cap the 4-button pad can just be brute-forced until it's right
      const nextWrong = wrong + 1;
      setWrong(nextWrong);
      if (nextWrong >= MAX_WRONG) {
        setBusy(true); // freeze the pad so the run can't continue past its own ending
        stepTimerRef.current = setTimeout(() => setOverOpen(true), 620);
      }
      return;
    }

    // the route is planned at level start and never crosses a wall, so a
    // correct press simply advances one step along it
    const nextIdx = maze.idx + 1;

    const rect = el.getBoundingClientRect();
    setSteps((s) => s + 1);
    setScore((s) => s + 60);
    flashFor("ok");
    vibrate(24);
    triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ["#6FA294", "#C08A2E"], 14);

    setMaze((m) => ({ ...m, idx: nextIdx, pos: m.route[nextIdx] }));
    setBusy(true);

    if (nextIdx === maze.route.length - 1) {
      setScore((s) => s + 300);
      const clearedLast = level >= MAX_LEVEL;
      stepTimerRef.current = setTimeout(() => (clearedLast ? setClearedOpen(true) : setVictoryOpen(true)), 600);
    } else {
      stepTimerRef.current = setTimeout(() => {
        setMaze((m) => ({ ...m, command: commandFor(m.route, m.idx) }));
        setBusy(false);
      }, 480);
    }
  }

  function handleNextLevel() {
    setVictoryOpen(false);
    const nextLevel = level + 1;
    setLevel(nextLevel);
    setMaze(initMaze(nextLevel));
    setBusy(false);
  }

  /** Full reset — wrong presses carry across levels, so they have to clear here too. */
  function handleRestart() {
    setClearedOpen(false);
    setOverOpen(false);
    setLevel(1);
    setMaze(initMaze(1));
    setScore(0);
    setSteps(0);
    setWrong(0);
    setWrongDir(null);
    setBusy(false);
  }

  function cellClass(d) {
    return wrongDir && d.dx === wrongDir.dx && d.dy === wrongDir.dy ? "bad" : "";
  }

  const cells = [];
  for (let r = 0; r < maze.n; r++) {
    for (let c = 0; c < maze.n; c++) {
      let cls = "mzCell";
      if (maze.walls.has(`${r},${c}`)) cls += " wall";
      if (r === maze.n - 1 && c === maze.n - 1) cls += " goal";
      if (r === maze.pos[0] && c === maze.pos[1]) cls += " you";
      cells.push(<div key={`${r},${c}`} className={cls} />);
    }
  }

  return (
    <div>
      <GameNav zh="迷宫" th="เขาวงกตทิศทาง" onBack={() => setExitOpen(true)} />
      <div className="gwrap">
        <div className="mzWrap">
          <div className="mzStat">
            <div className="hc">
              <span className="lb">ก้าว</span>
              <span>{steps}</span>
            </div>
            <div className="hc sc">
              <span className="lb">คะแนน</span>
              <span>{score}</span>
            </div>
            <div className="hc">
              <span className="lb">ด่าน</span>
              <span>
                {level}/{MAX_LEVEL}
              </span>
            </div>
            <div className="hc">
              <span className="lb">พลาด</span>
              <span>
                {wrong}/{MAX_WRONG}
              </span>
            </div>
          </div>

          <div className="mzCard">
            <div className="cmd zh">{maze.command.hanzi}</div>
            <div className="py2">{maze.command.pinyin}</div>
            <div className="hint2">อ่านคำสั่งแล้วกดปุ่มทิศทางให้ถูก</div>
          </div>

          <div className="mzBoard" style={{ gridTemplateColumns: `repeat(${maze.n}, 1fr)` }}>
            {cells}
          </div>

          <DirectionPad core="走" onPick={handlePress} cellClassName={cellClass} disabled={gameOver} />
        </div>
      </div>

      <div className={`mz-flash${flash ? ` ${flash}` : ""}`} />

      <Sheet open={victoryOpen} title="ถึงธงแล้ว">
        <p>
          ได้โบนัส 300 คะแนน · ผ่านด่าน {level}/{MAX_LEVEL} แล้ว
        </p>
        <Sheet.Actions>
          <Button block onClick={handleNextLevel}>
            ไปด่านถัดไป
          </Button>
        </Sheet.Actions>
      </Sheet>

      <Sheet open={clearedOpen} title={`ผ่านครบ ${MAX_LEVEL} ด่านแล้ว`}>
        <p>
          เดินถึงธงครบทุกด่าน ใช้ไป {steps} ก้าว พลาด {wrong}/{MAX_WRONG} ครั้ง · คะแนนรวม {score}
        </p>
        <Sheet.Actions>
          <Button block onClick={handleRestart}>
            เล่นอีกครั้ง
          </Button>
          <Button block variant="ghost" onClick={() => navigate("/setup")}>
            กลับไปเลือกโหมด
          </Button>
        </Sheet.Actions>
      </Sheet>

      <Sheet open={overOpen} title={`กดผิดครบ ${MAX_WRONG} ครั้ง`}>
        <p>
          ไปได้ถึงด่าน {level}/{MAX_LEVEL} · คะแนนรวม {score}
        </p>
        <Sheet.Actions>
          <Button block onClick={handleRestart}>
            เริ่มใหม่
          </Button>
          <Button block variant="ghost" onClick={() => navigate("/setup")}>
            กลับไปเลือกโหมด
          </Button>
        </Sheet.Actions>
      </Sheet>

      <Sheet open={exitOpen} onClose={() => setExitOpen(false)} title="ออกจากเขาวงกต?">
        <p>คะแนนที่ได้ {score} จะไม่ถูกบันทึก</p>
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
