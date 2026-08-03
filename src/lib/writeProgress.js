const COPYBOOK_LIMIT = 60;
const PERFECT_STREAK_BADGE = 10;
const NO_GUIDE_BADGE = 20;

function todayLocalTimestamp() {
  return new Date().toISOString();
}

function awardStamp(stamps, kind) {
  if (stamps.some((stamp) => stamp.kind === kind)) return stamps;
  return [...stamps, { id: `${kind}_${Date.now()}`, kind, earnedAt: todayLocalTimestamp() }];
}

// Feeds one write_character completion (from a lesson, a review session, or
// the free-write page) into the write-specific counters, badge stamps, and
// copybook - separate from srs.js because none of this affects spaced
// repetition scheduling at all.
//
// `guided` - was the tracing outline visible (always true outside free-write
// mode, since only that page's toggle can turn it off).
// `entryId`/`hanzi` - identify what was written, for the copybook entry.
export function recordWriteCompletion(
  progress,
  { correct, guided, usedHint, totalMistakes, entryId, hanzi, drawnPaths, canvasSize },
) {
  if (!correct) {
    return { ...progress, writeStats: { ...progress.writeStats, perfectStreak: 0 } };
  }

  const prevStats = progress.writeStats;
  const writeStats = {
    totalCompletions: prevStats.totalCompletions + 1,
    perfectStreak: totalMistakes === 0 ? prevStats.perfectStreak + 1 : 0,
    noGuideCompletions: guided ? prevStats.noGuideCompletions : prevStats.noGuideCompletions + 1,
  };

  let stamps = progress.stamps;
  if (writeStats.totalCompletions === 1) stamps = awardStamp(stamps, "write_first");
  if (writeStats.perfectStreak === PERFECT_STREAK_BADGE) stamps = awardStamp(stamps, "write_steady");
  if (writeStats.noGuideCompletions === NO_GUIDE_BADGE) stamps = awardStamp(stamps, "write_noguide");

  let copybook = progress.copybook;
  if (!usedHint) {
    const entry = {
      id: `cb_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      vocabId: entryId,
      hanzi,
      writtenAt: todayLocalTimestamp(),
      guided,
      size: canvasSize,
      strokePaths: drawnPaths,
    };
    copybook = [...copybook, entry].slice(-COPYBOOK_LIMIT);
  }

  return { ...progress, writeStats, stamps, copybook };
}
