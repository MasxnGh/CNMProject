import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import chapters from "../content/chapters.json";
import vocab from "../content/vocab.json";
import { useProgress } from "../lib/progress.js";
import { playWord } from "../lib/audio.js";
import { spendCoins } from "../lib/progressActions.js";
import Lantern from "../components/ui/Lantern.jsx";
import Sheet from "../components/ui/Sheet.jsx";
import Button from "../components/ui/Button.jsx";
import UnlockModal, { PAY_COST } from "../components/game/UnlockModal.jsx";
import "./ChapterPath.css";

const ICONS = { learn: "学", practice: "练", review: "考" };
const UNLOCK_GROUP_SIZE = 3;

export default function ChapterPath() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const [progress, setProgress] = useProgress();
  const [replayLesson, setReplayLesson] = useState(null);
  const [unlockOpen, setUnlockOpen] = useState(false);

  const chapter = chapters.find((c) => c.id === chapterId);

  if (!chapter) {
    return (
      <div className="wrap">
        <div className="emptyState">
          <div className="emptyStateIcon">🏮</div>
          <h1>ไม่พบบทนี้</h1>
          <p>ลิงก์อาจพิมพ์ผิดหรือบทนี้ถูกย้ายไปแล้ว กลับไปเลือกบทใหม่ได้เลย</p>
          <Button variant="primary" onClick={() => navigate("/chapters")}>
            กลับแผนที่การเดินทาง
          </Button>
        </div>
      </div>
    );
  }

  const chapterVocab = vocab.filter((word) => word.chapterId === chapterId);

  let reachedNow = false;
  const lessonStates = chapter.lessons.map((lesson) => {
    if (progress.completedLessons.includes(lesson.id)) return "done";
    if (!reachedNow) {
      reachedNow = true;
      return "now";
    }
    return "lock";
  });
  const doneCount = lessonStates.filter((state) => state === "done").length;
  const lockedLessons = chapter.lessons.filter((_, i) => lessonStates[i] === "lock").slice(0, UNLOCK_GROUP_SIZE);

  const handleTap = (lesson, state) => {
    if (state === "now") {
      navigate(`/lesson/${lesson.id}`);
      return;
    }
    if (state === "done") {
      setReplayLesson(lesson);
      return;
    }
    setUnlockOpen(true);
  };

  const startUnlockTest = () => {
    setUnlockOpen(false);
    navigate(`/unlock/${lockedLessons[0].id}`, {
      state: { chapterId, lessonIds: lockedLessons.map((lesson) => lesson.id) },
    });
  };

  const payForUnlockTest = () => {
    setProgress((current) => spendCoins(current, PAY_COST));
    startUnlockTest();
  };

  return (
    <div className="wrap">
      <div className="top">
        <button type="button" className="back" onClick={() => navigate("/chapters")}>
          ‹
        </button>
        <div style={{ flex: 1 }}>
          <div className="h2">{chapter.titleZh}</div>
          <div className="h1">{chapter.titleTh}</div>
        </div>
        <div className="stat">
          {doneCount}/{chapter.lessons.length}
        </div>
      </div>

      <div className="pathGrid">
        <div className="rope">
          {chapter.lessons.map((lesson, index) => (
            <div key={lesson.id} className={`node ${index % 2 === 0 ? "l" : "r"}`}>
              <Lantern
                state={lessonStates[index]}
                icon={ICONS[lesson.type]}
                label={lesson.title}
                onClick={() => handleTap(lesson, lessonStates[index])}
              />
            </div>
          ))}
        </div>

        <div className="panel" id="pVocab">
          <h5>คำศัพท์ในบทนี้</h5>
          <div className="chips">
            {chapterVocab.map((word) => (
              <button key={word.id} type="button" className="chip" onClick={() => playWord(word.id)}>
                <b>{word.hanzi}</b>
                <i>{word.pinyin}</i>
              </button>
            ))}
          </div>
        </div>

        <div className="panel" id="pStamp">
          <h5>ตราประทับที่สะสมได้</h5>
          <div className="stampRow">
            {chapter.lessons.map((lesson) => {
              const collected = progress.stamps.some((stamp) => stamp.lessonId === lesson.id);
              return (
                <div key={lesson.id} className={["sm", !collected && "off"].filter(Boolean).join(" ")}>
                  {collected ? "过" : "?"}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Sheet
        open={!!replayLesson}
        onClose={() => setReplayLesson(null)}
        title="ด่านนี้ผ่านแล้ว"
        description="เล่นซ้ำได้ แต่จะไม่ได้ตราประทับเพิ่ม"
      >
        <Button variant="primary" onClick={() => navigate(`/lesson/${replayLesson.id}`)}>
          เล่นอีกครั้ง
        </Button>
        <Button variant="ghost" onClick={() => setReplayLesson(null)}>
          ยังไม่พร้อม
        </Button>
      </Sheet>

      <UnlockModal
        open={unlockOpen && lockedLessons.length > 0}
        onClose={() => setUnlockOpen(false)}
        chapterId={chapterId}
        lessons={lockedLessons}
        progress={progress}
        onStart={startUnlockTest}
        onPay={payForUnlockTest}
      />
    </div>
  );
}
