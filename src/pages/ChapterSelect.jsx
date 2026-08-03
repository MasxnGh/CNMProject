import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import chapters from "../content/chapters.json";
import { useProgress } from "../lib/progress.js";
import { getDueCount, todayISO } from "../lib/srs.js";
import "./ChapterSelect.css";

const BANNER_DISMISS_KEY = "dujeen_review_banner_dismissed_on";
const BANNER_THRESHOLD = 20;

function readDismissedDate() {
  try {
    return localStorage.getItem(BANNER_DISMISS_KEY);
  } catch {
    return null;
  }
}

export default function ChapterSelect() {
  const navigate = useNavigate();
  const [progress] = useProgress();
  const [shakingId, setShakingId] = useState(null);
  const [bannerDismissedOn, setBannerDismissedOn] = useState(readDismissedDate);

  const dueCount = getDueCount(progress);
  const showReviewBanner = dueCount > BANNER_THRESHOLD && bannerDismissedOn !== todayISO();

  const dismissBanner = () => {
    const today = todayISO();
    try {
      localStorage.setItem(BANNER_DISMISS_KEY, today);
    } catch {
      // localStorage unavailable - banner will just show again next visit.
    }
    setBannerDismissedOn(today);
  };

  const handleLockedTap = (chapterId) => {
    setShakingId(chapterId);
    setTimeout(() => setShakingId((current) => (current === chapterId ? null : current)), 400);
  };

  return (
    <div className="wrap">
      {showReviewBanner && (
        <div className="reviewBanner">
          <button type="button" className="reviewBannerTap" onClick={() => navigate("/review")}>
            🎯 มี {dueCount} คำรอทวน แตะเพื่อไปทวน
          </button>
          <button
            type="button"
            className="reviewBannerClose"
            onClick={(event) => {
              event.stopPropagation();
              dismissBanner();
            }}
            aria-label="ปิด"
          >
            ✕
          </button>
        </div>
      )}
      <div className="top">
        <div style={{ flex: 1 }}>
          <div className="h2">แผนที่การเดินทาง</div>
          <div className="h1">เลือกบทเรียน</div>
        </div>
        <div className="stat">
          🏮 <b>{progress.completedChapters.length}</b>
        </div>
        <div className="stat">
          🔥 <b>{progress.streak.count}</b>
        </div>
      </div>

      <div className="chapGrid">
        {chapters.map((chapter, index) => {
          const total = chapter.lessons.length;
          const doneCount = chapter.lessons.filter((lesson) => progress.completedLessons.includes(lesson.id)).length;
          const isDone = total > 0 && doneCount === total;
          const isLocked = index > 0 && !progress.completedChapters.includes(chapters[index - 1].id);

          const className = [
            "card",
            isLocked && "lock",
            isDone && "done",
            shakingId === chapter.id && "shake",
          ]
            .filter(Boolean)
            .join(" ");

          const content = (
            <>
              <div className="num">{isLocked ? "🔒" : index + 1}</div>
              <div className="txt">
                <div className="zh">{chapter.titleZh}</div>
                <div className="th">{chapter.titleTh}</div>
                <div className="bar">
                  <i style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} />
                </div>
                <div className="cnt">
                  {isLocked ? "จบบทก่อนหน้าเพื่อปลดล็อค" : `${doneCount} / ${total} ด่าน`}
                </div>
              </div>
              {isDone && <div className="seal">过</div>}
            </>
          );

          if (isLocked) {
            return (
              <div key={chapter.id} className={className} onClick={() => handleLockedTap(chapter.id)}>
                {content}
              </div>
            );
          }

          return (
            <Link key={chapter.id} to={`/chapter/${chapter.id}`} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
