import { useState } from "react";
import { useNavigate } from "react-router-dom";
import chapters from "../content/chapters.json";
import vocab from "../content/vocab.json";
import { defaultProgress, useProgress } from "../lib/progress.js";
import { getForecast, getMemoryStats } from "../lib/srs.js";
import { downloadCopybookPng } from "../lib/copybookExport.js";
import { isMuted, setMuted } from "../lib/audio.js";
import Sheet from "../components/ui/Sheet.jsx";
import Button from "../components/ui/Button.jsx";
import CopybookReplay from "../components/CopybookReplay.jsx";
import "./Profile.css";

const allLessons = chapters.flatMap((chapter) =>
  chapter.lessons.map((lesson) => ({ ...lesson, chapterTitle: chapter.titleTh })),
);

const DAY_LABELS = ["วันนี้", "พรุ่งนี้", "มะรืนนี้"];

function forecastDayLabel(index) {
  return DAY_LABELS[index] || `+${index} วัน`;
}

const WRITE_BADGE_INFO = {
  write_first: { label: "จรดพู่กัน", description: "เขียนตัวอักษรสำเร็จเป็นครั้งแรก" },
  write_steady: { label: "มือนิ่ง", description: "เขียนถูกหมดโดยไม่ผิดเลย 10 ตัวติดกัน" },
  write_noguide: { label: "ไร้เส้นนำทาง", description: "เขียนถูกในโหมดไม่มีเส้นนำทาง 20 ตัว" },
};
const WRITE_BADGE_KINDS = Object.keys(WRITE_BADGE_INFO);

function formatWrittenAt(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
}

export default function Profile() {
  const navigate = useNavigate();
  const [progress, setProgress] = useProgress();
  const [muted, setMutedState] = useState(isMuted());
  const [selectedBadge, setSelectedBadge] = useState(null);
  const [resetStep, setResetStep] = useState(0); // 0 closed, 1 first confirm, 2 second confirm
  const [copybookEntryId, setCopybookEntryId] = useState(null);
  const [replayToken, setReplayToken] = useState(null);

  const knownWordCount = vocab.filter((word) => progress.completedLessons.includes(word.lessonId)).length;
  const bonusBadges = progress.stamps.filter((stamp) => stamp.kind === "unlock");

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setMutedState(next);
  };

  const openLessonBadge = (lesson) => {
    const stamp = progress.stamps.find((s) => s.lessonId === lesson.id);
    setSelectedBadge({ lesson, stamp });
  };

  const openBonusBadge = (badge) => {
    setSelectedBadge({ badge });
  };

  const resetProgress = () => {
    setProgress(defaultProgress());
    setResetStep(0);
  };

  const memoryStats = getMemoryStats(progress);
  const forecast = getForecast(progress, 7);
  const forecastMax = Math.max(1, ...forecast.map((day) => day.count));
  const learningPct = memoryStats.total ? (memoryStats.learning / memoryStats.total) * 100 : 0;
  const familiarPct = memoryStats.total ? (memoryStats.familiar / memoryStats.total) * 100 : 0;
  const masteredPct = memoryStats.total ? (memoryStats.mastered / memoryStats.total) * 100 : 0;

  const copybook = progress.copybook || [];
  const copybookNewestFirst = [...copybook].reverse();
  const selectedCopybookEntry = copybook.find((entry) => entry.id === copybookEntryId) || null;

  const openWriteBadge = (kind) => {
    const stamp = progress.stamps.find((s) => s.kind === kind);
    setSelectedBadge({ writeBadge: kind, stamp });
  };

  const openCopybookEntry = (entry) => {
    setCopybookEntryId(entry.id);
    setReplayToken(null);
  };

  return (
    <div className="wrap">
      <div className="top">
        <div style={{ flex: 1 }}>
          <div className="h2">โปรไฟล์นักผจญภัย</div>
          <div className="h1">ฉัน</div>
        </div>
      </div>

      <div className="statRow">
        <div className="statCell">
          <b>{knownWordCount}</b>
          <span>คำที่รู้</span>
        </div>
        <div className="statCell">
          <b>{progress.streak.count}</b>
          <span>วันต่อเนื่อง</span>
        </div>
        <div className="statCell">
          <b>{progress.coins}</b>
          <span>เหรียญ</span>
        </div>
      </div>

      <div className="panel">
        <h5>ตราประทับที่สะสมได้</h5>
        <div className="stampRow badgeGrid">
          {allLessons.map((lesson) => {
            const collected = progress.stamps.some((stamp) => stamp.lessonId === lesson.id);
            return (
              <button
                key={lesson.id}
                type="button"
                className={["sm", !collected && "off"].filter(Boolean).join(" ")}
                onClick={() => openLessonBadge(lesson)}
              >
                {collected ? "过" : "?"}
              </button>
            );
          })}
          {bonusBadges.map((badge) => (
            <button key={badge.id} type="button" className="sm bonus" onClick={() => openBonusBadge(badge)}>
              过
            </button>
          ))}
          {WRITE_BADGE_KINDS.map((kind) => {
            const collected = progress.stamps.some((stamp) => stamp.kind === kind);
            return (
              <button
                key={kind}
                type="button"
                className={["sm", !collected && "off"].filter(Boolean).join(" ")}
                onClick={() => openWriteBadge(kind)}
              >
                {collected ? "过" : "?"}
              </button>
            );
          })}
        </div>
      </div>

      <div className="panel">
        <h5>สมุดคัดอักษร</h5>
        {copybook.length === 0 ? (
          <p className="memoryEmpty">ยังไม่มีตัวอักษรที่เขียนสำเร็จ ลองไปฝึกเขียนดูได้เลย</p>
        ) : (
          <>
            <div className="stampRow copybookGrid">
              {copybookNewestFirst.map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  className="sm copybook"
                  onClick={() => openCopybookEntry(entry)}
                >
                  {entry.hanzi}
                </button>
              ))}
            </div>
            <Button variant="ghost" onClick={() => downloadCopybookPng(copybook)}>
              📥 ดาวน์โหลดสมุดเป็น PNG
            </Button>
          </>
        )}
      </div>

      <div className="panel">
        <h5>ความจำคำศัพท์</h5>
        {memoryStats.total === 0 ? (
          <p className="memoryEmpty">ยังไม่มีคำที่เริ่มทวนตอนนี้ เล่นด่านต่อไปเพื่อสะสมคำศัพท์</p>
        ) : (
          <>
            <div className="memoryBar">
              <i className="learning" style={{ width: `${learningPct}%` }} />
              <i className="familiar" style={{ width: `${familiarPct}%` }} />
              <i className="mastered" style={{ width: `${masteredPct}%` }} />
            </div>
            <div className="memoryLegend">
              <div className="memoryLegendItem">
                <i className="learning" />
                <span>เพิ่งเรียน</span>
                <b>{memoryStats.learning}</b>
              </div>
              <div className="memoryLegendItem">
                <i className="familiar" />
                <span>เริ่มจำได้</span>
                <b>{memoryStats.familiar}</b>
              </div>
              <div className="memoryLegendItem">
                <i className="mastered" />
                <span>จำแม่นแล้ว</span>
                <b>{memoryStats.mastered}</b>
              </div>
            </div>
          </>
        )}

        <h5 className="forecastLabel">คำที่จะถึงกำหนดทวน 7 วันข้างหน้า</h5>
        <div className="forecastRow">
          {forecast.map((day, index) => (
            <div key={day.date} className="forecastCol">
              <div className="forecastBarTrack">
                <div
                  className={["forecastBarFill", day.count > 0 && "hasDue"].filter(Boolean).join(" ")}
                  style={{ height: `${(day.count / forecastMax) * 100}%` }}
                />
              </div>
              <b>{day.count}</b>
              <span>{forecastDayLabel(index)}</span>
            </div>
          ))}
        </div>
        {memoryStats.total > 0 && (
          <Button variant="ghost" onClick={() => navigate("/review")}>
            ไปทวนคำ
          </Button>
        )}
      </div>

      <div className="panel settingsPanel">
        <h5>ตั้งค่า</h5>
        <Button variant="ghost" onClick={toggleMute}>
          {muted ? "🔇 เปิดเสียง" : "🔊 ปิดเสียง"}
        </Button>
        <Button variant="ghost" onClick={() => setResetStep(1)}>
          ล้างความคืบหน้าทั้งหมด
        </Button>
      </div>

      <Sheet
        open={!!selectedBadge}
        onClose={() => setSelectedBadge(null)}
        title={
          selectedBadge?.badge
            ? "ตราพิเศษ: จุดโคมสามดวง"
            : selectedBadge?.writeBadge
              ? WRITE_BADGE_INFO[selectedBadge.writeBadge].label
              : selectedBadge?.lesson?.title
        }
        description={
          selectedBadge?.badge
            ? `ได้รับเมื่อ ${selectedBadge.badge.earnedAt}`
            : selectedBadge?.writeBadge
              ? selectedBadge.stamp
                ? `${WRITE_BADGE_INFO[selectedBadge.writeBadge].description} — ได้รับเมื่อ ${selectedBadge.stamp.earnedAt}`
                : WRITE_BADGE_INFO[selectedBadge.writeBadge].description
              : selectedBadge?.stamp
                ? `ได้จากด่าน "${selectedBadge.lesson.title}" (${selectedBadge.lesson.chapterTitle}) เมื่อ ${selectedBadge.stamp.earnedAt}`
                : "ยังไม่ได้รับตรานี้"
        }
      >
        <Button variant="primary" onClick={() => setSelectedBadge(null)}>
          ปิด
        </Button>
      </Sheet>

      <Sheet
        open={!!selectedCopybookEntry}
        onClose={() => setCopybookEntryId(null)}
        title={selectedCopybookEntry?.hanzi}
        description={selectedCopybookEntry ? `เขียนเมื่อ ${formatWrittenAt(selectedCopybookEntry.writtenAt)}` : ""}
      >
        {selectedCopybookEntry && (
          <>
            <CopybookReplay entry={selectedCopybookEntry} playToken={replayToken} />
            <Button variant="ghost" onClick={() => setReplayToken((t) => (t || 0) + 1)}>
              ▶️ เล่นซ้ำการลากเส้น
            </Button>
          </>
        )}
        <Button variant="primary" onClick={() => setCopybookEntryId(null)}>
          ปิด
        </Button>
      </Sheet>

      <Sheet
        open={resetStep === 1}
        onClose={() => setResetStep(0)}
        title="ล้างความคืบหน้าทั้งหมด?"
        description="ทุกด่านที่ผ่าน ตราประทับ เหรียญ และวันต่อเนื่องจะหายไปทั้งหมด"
      >
        <Button variant="primary" onClick={() => setResetStep(2)}>
          ล้างข้อมูล
        </Button>
        <Button variant="ghost" onClick={() => setResetStep(0)}>
          ยกเลิก
        </Button>
      </Sheet>

      <Sheet
        open={resetStep === 2}
        onClose={() => setResetStep(0)}
        title="ยืนยันอีกครั้ง"
        description="การล้างข้อมูลนี้ย้อนกลับไม่ได้ แน่ใจจริงๆ ใช่ไหม"
      >
        <Button variant="primary" onClick={resetProgress}>
          ใช่ ล้างข้อมูลทั้งหมด
        </Button>
        <Button variant="ghost" onClick={() => setResetStep(0)}>
          ยกเลิก
        </Button>
      </Sheet>
    </div>
  );
}
