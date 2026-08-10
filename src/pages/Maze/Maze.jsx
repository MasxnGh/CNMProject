import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import GameNav from "../../components/ui/GameNav.jsx";
import DirectionPad from "../../components/ui/DirectionPad.jsx";
import Sheet from "../../components/ui/Sheet.jsx";
import Button from "../../components/ui/Button.jsx";
import Toast from "../../components/ui/Toast.jsx";
import { useBurst } from "../../state/BurstContext.jsx";
import { vibrate } from "../../lib/vibrate.js";
import CONFIG from "../../content/config.json";
import "./Maze.css";

const gridSize = (level) => 4 + Math.min(2, Math.floor(level / 2));

function buildWalls(n) {
  const walls = new Set();
  const count = Math.floor(n * n * 0.16);
  while (walls.size < count) {
    const r = Math.floor(Math.random() * n);
    const c = Math.floor(Math.random() * n);
    if ((r === 0 && c === 0) || (r === n - 1 && c === n - 1)) continue;
    walls.add(`${r},${c}`);
  }
  return walls;
}

/** Always prefer a command that's actually walkable from here; a true dead end falls back to any command. */
function pickCommand(pos, walls, n) {
  const walkable = CONFIG.mazeCommands.filter((cmd) => {
    const r = pos[0] + cmd.dy;
    const c = pos[1] + cmd.dx;
    return r >= 0 && r < n && c >= 0 && c < n && !walls.has(`${r},${c}`);
  });
  const pool = walkable.length ? walkable : CONFIG.mazeCommands;
  return pool[Math.floor(Math.random() * pool.length)];
}

function initMaze(level) {
  const n = gridSize(level);
  const walls = buildWalls(n);
  const pos = [0, 0];
  return { n, walls, pos, command: pickCommand(pos, walls, n) };
}

export default function Maze() {
  const navigate = useNavigate();
  const { triggerBurst } = useBurst();

  const [level, setLevel] = useState(1);
  const [maze, setMaze] = useState(() => initMaze(1));
  const [score, setScore] = useState(0);
  const [steps, setSteps] = useState(0);
  const [busy, setBusy] = useState(false);
  const [wrongDir, setWrongDir] = useState(null);
  const [flash, setFlash] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [victoryOpen, setVictoryOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  const wrongTimerRef = useRef(null);
  const flashTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const stepTimerRef = useRef(null);

  useEffect(() => {
    setWrongDir(null);
  }, [maze.command]);

  useEffect(
    () => () => {
      clearTimeout(wrongTimerRef.current);
      clearTimeout(flashTimerRef.current);
      clearTimeout(toastTimerRef.current);
      clearTimeout(stepTimerRef.current);
    },
    [],
  );

  function flashFor(kind) {
    setFlash(kind);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(null), 420);
  }

  function showToast(msg) {
    setToastMsg(msg);
    clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 1500);
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
      return;
    }

    const nr = maze.pos[0] + want.dy;
    const nc = maze.pos[1] + want.dx;
    const blocked = nr < 0 || nr >= maze.n || nc < 0 || nc >= maze.n || maze.walls.has(`${nr},${nc}`);

    if (blocked) {
      showToast("ทางนั้นตัน ลองคำสั่งถัดไป");
      setBusy(true);
      stepTimerRef.current = setTimeout(() => {
        setMaze((m) => ({ ...m, command: pickCommand(m.pos, m.walls, m.n) }));
        setBusy(false);
      }, 500);
      return;
    }

    const rect = el.getBoundingClientRect();
    setSteps((s) => s + 1);
    setScore((s) => s + 60);
    flashFor("ok");
    vibrate(24);
    triggerBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, ["#6FA294", "#C08A2E"], 14);

    const isGoal = nr === maze.n - 1 && nc === maze.n - 1;
    setMaze((m) => ({ ...m, pos: [nr, nc] }));
    setBusy(true);

    if (isGoal) {
      setScore((s) => s + 300);
      stepTimerRef.current = setTimeout(() => setVictoryOpen(true), 600);
    } else {
      stepTimerRef.current = setTimeout(() => {
        setMaze((m) => ({ ...m, command: pickCommand(m.pos, m.walls, m.n) }));
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
              <span>{level}</span>
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

          <DirectionPad core="走" onPick={handlePress} cellClassName={cellClass} />
        </div>
      </div>

      <div className={`mz-flash${flash ? ` ${flash}` : ""}`} />
      <Toast open={!!toastMsg} message={toastMsg} tone="error" />

      <Sheet open={victoryOpen} title="ถึงธงแล้ว">
        <p>ได้โบนัส 300 คะแนน ไปด่านถัดไปกันต่อ</p>
        <Sheet.Actions>
          <Button block onClick={handleNextLevel}>
            ไปด่านถัดไป
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
