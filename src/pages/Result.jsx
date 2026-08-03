import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import chapters from "../content/chapters.json";
import { useProgress } from "../lib/progress.js";
import { completeLesson, completeUnlockTest, recordUnlockTestUsed } from "../lib/progressActions.js";
import { playCoin, playUnlock } from "../lib/sfx.js";
import Stamp from "../components/ui/Stamp.jsx";
import Lantern from "../components/ui/Lantern.jsx";
import Button from "../components/ui/Button.jsx";
import "./Result.css";

const LESSON_ICONS = { learn: "学", practice: "练", review: "考" };

function chapterForLesson(lessonId) {
  return chapters.find((chapter) => chapter.lessons.some((lesson) => lesson.id === lessonId));
}

function findLesson(lessonId) {
  for (const chapter of chapters) {
    const lesson = chapter.lessons.find((l) => l.id === lessonId);
    if (lesson) return lesson;
  }
  return null;
}

function findLessonTitle(lessonId) {
  return findLesson(lessonId)?.title || "";
}

function formatElapsed(ms) {
  const totalSeconds = Math.round((ms || 0) / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function weakestLesson(wrongByLesson, lessonIds) {
  let weakest = lessonIds[0];
  let max = -1;
  lessonIds.forEach((id) => {
    const count = wrongByLesson[id] || 0;
    if (count > max) {
      max = count;
      weakest = id;
    }
  });
  return { lessonId: weakest, count: Math.max(max, 0) };
}

function useCoinCountUp(coinsGained) {
  const [displayCoins, setDisplayCoins] = useState(0);

  useEffect(() => {
    if (!coinsGained) return undefined;
    const totalTicks = Math.min(coinsGained, 15);
    const perTick = coinsGained / totalTicks;
    let tick = 0;
    const interval = setInterval(() => {
      tick += 1;
      setDisplayCoins(Math.round(perTick * tick));
      playCoin();
      if (tick >= totalTicks) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [coinsGained]);

  return displayCoins;
}

function CascadingLanterns({ lessons }) {
  const [litCount, setLitCount] = useState(0);

  useEffect(() => {
    if (litCount >= lessons.length) return undefined;
    const timer = setTimeout(() => {
      playUnlock();
      setLitCount((c) => c + 1);
    }, 200 * (litCount + 1));
    return () => clearTimeout(timer);
  }, [litCount, lessons.length]);

  return (
    <div className="cascadeRow">
      {lessons.map((lesson, i) => (
        <Lantern
          key={lesson.id}
          state={i < litCount ? "done" : "lock"}
          icon={LESSON_ICONS[lesson.type] || "学"}
          label={lesson.title}
        />
      ))}
    </div>
  );
}

function KeyShatter() {
  return (
    <div className="keyShatter" aria-hidden="true">
      <span className="keyMain">🔑</span>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`keyShard shard${i}`}>
          🔑
        </span>
      ))}
    </div>
  );
}

export default function Result() {
  const { lessonId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [progress, setProgress] = useProgress();
  const state = location.state;

  const [settled, setSettled] = useState(false);
  const [coinsGained, setCoinsGained] = useState(0);
  const [chapterJustCompleted, setChapterJustCompleted] = useState(false);

  useEffect(() => {
    if (!state || settled) return;
    setSettled(true);

    if (state.mode === "lesson") {
      const next = completeLesson(progress, state.lessonId);
      setCoinsGained(next.coins - progress.coins);
      const chapter = chapterForLesson(state.lessonId);
      setChapterJustCompleted(
        !!chapter && next.completedChapters.includes(chapter.id) && !progress.completedChapters.includes(chapter.id),
      );
      setProgress(next);
    } else if (state.mode === "unlock-pass") {
      const withUsed = recordUnlockTestUsed(progress, state.chapterId);
      const next = completeUnlockTest(withUsed, state.chapterId, state.lessonIds);
      setCoinsGained(next.coins - progress.coins);
      setProgress(next);
    } else if (state.mode === "unlock-fail") {
      setProgress(recordUnlockTestUsed(progress, state.chapterId));
    }
    // Runs once on mount only - progress/setProgress intentionally excluded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, settled]);

  const displayCoins = useCoinCountUp(coinsGained);

  if (!state) {
    return (
      <div className="wrap">
        <div className="emptyState">
          <div className="emptyStateIcon">🏮</div>
          <h1>ไม่พบผลลัพธ์ของด่านนี้</h1>
          <p>หน้านี้ใช้ดูผลหลังเล่นจบด่านเท่านั้น กลับไปเลือกด่านแล้วเล่นใหม่ได้เลย</p>
          <Button variant="primary" onClick={() => navigate("/chapters")}>
            กลับแผนที่
          </Button>
        </div>
      </div>
    );
  }

  if (state.mode === "unlock-fail") {
    const chapter = chapters.find((c) => c.id === state.chapterId);
    const { lessonId: weakId, count } = weakestLesson(state.wrongByLesson || {}, state.lessonIds);
    const weakTitle = findLessonTitle(weakId);

    return (
      <div className="wrap">
        <div className="resultHead">
          <h1>ยังไม่ผ่านบททดสอบรวม</h1>
          <p>ไม่เป็นไร ลองทวนจุดที่ยังไม่แม่นแล้วค่อยกลับมาใหม่</p>
        </div>
        <div className="weakBox">
          {count > 0 ? `ด่าน${weakTitle}ยังตอบผิด ${count} ข้อ ลองเล่นด่านนั้นก่อน` : "ลองทวนคำศัพท์ในด่านที่ข้ามอีกครั้ง"}
        </div>
        <div className="resultActions">
          <Button variant="primary" onClick={() => navigate(`/lesson/${weakId}`)}>
            ไปด่านที่อ่อนที่สุด
          </Button>
          <Button variant="ghost" onClick={() => navigate(chapter ? `/chapter/${chapter.id}` : "/chapters")}>
            กลับแผนที่
          </Button>
        </div>
      </div>
    );
  }

  if (state.mode === "unlock-pass") {
    const chapter = chapters.find((c) => c.id === state.chapterId);
    const lessons = state.lessonIds.map((id) => findLesson(id) || { id, title: "" });

    return (
      <div className="wrap">
        <KeyShatter />
        <div className="resultHead">
          <h1>ปลดล็อคสำเร็จ!</h1>
          <p>จุดโคมสามดวงรวดเดียว ข้ามไปต่อได้เลย</p>
        </div>
        <div className="flowRope" aria-hidden="true" />
        <CascadingLanterns lessons={lessons} />
        <div className="badgeCard">
          <div className="seal">过</div>
          <h3>ตราพิเศษ: จุดโคมสามดวง</h3>
        </div>
        {coinsGained > 0 && <div className="coinPop">🪙 +{displayCoins}</div>}
        <div className="resultActions">
          <Button variant="primary" onClick={() => navigate(chapter ? `/chapter/${chapter.id}` : "/chapters")}>
            กลับแผนที่
          </Button>
        </div>
      </div>
    );
  }

  // mode === "lesson"
  const chapter = chapterForLesson(state.lessonId);
  const lessonIndex = chapter ? chapter.lessons.findIndex((l) => l.id === state.lessonId) : -1;
  const nextLesson = chapter && lessonIndex >= 0 ? chapter.lessons[lessonIndex + 1] : null;

  return (
    <div className="wrap">
      <Stamp show={settled} />
      <div className="resultHead">
        <h1>จบด่านแล้ว!</h1>
        {chapter && <p>{chapter.titleTh}</p>}
      </div>

      {coinsGained > 0 && <div className="coinPop">🪙 +{displayCoins}</div>}

      <div className="statRow">
        <div className="statCell">
          <b>
            {state.correctCount}/{state.totalCount}
          </b>
          <span>ตอบถูก</span>
        </div>
        <div className="statCell">
          <b>x{state.maxCombo}</b>
          <span>คอมโบสูงสุด</span>
        </div>
        <div className="statCell">
          <b>{formatElapsed(state.elapsedMs)}</b>
          <span>เวลาที่ใช้</span>
        </div>
      </div>

      {chapterJustCompleted && chapter && (
        <>
          <div className="resultHead">
            <p>จบทั้งบทแล้ว!</p>
          </div>
          <CascadingLanterns lessons={chapter.lessons} />
        </>
      )}

      <div className="resultActions">
        {nextLesson && (
          <Button variant="primary" onClick={() => navigate(`/lesson/${nextLesson.id}`)}>
            เล่นด่านต่อไป
          </Button>
        )}
        <Button variant="ghost" onClick={() => navigate(chapter ? `/chapter/${chapter.id}` : "/chapters")}>
          กลับแผนที่
        </Button>
      </div>
    </div>
  );
}
