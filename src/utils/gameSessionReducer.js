const freshSession = (levelId, missionCount, phase, heartsEnabled) => ({
  levelId,
  missionCount,
  phase,
  resumePhase: null,
  index: 0,
  hearts: 3,
  heartsEnabled,
  hints: 2,
  hintsUsed: 0,
  hintPenalty: 0,
  correct: 0,
  score: 0,
  showHint: false,
  feedback: null,
  wrongMissionIds: [],
  combo: 0,
});

/* heartsEnabled defaults true so every existing caller (classic, the
   checkpoint/unlock-test) keeps today's "3 wrong ends the run" behavior
   unchanged - only the lantern-district's regular lessons opt out, since
   dujeen-quest-prototype.html's quiz screen has no fail-out at all outside
   the combined skip-ahead test. */
export const createGameSession = (level, { skipIntro = false, heartsEnabled = true } = {}) =>
  freshSession(level.id, level.questions?.length ?? 0, skipIntro ? "playing" : "intro", heartsEnabled);

export const gameSessionReducer = (state, action) => {
  switch (action.type) {
    case "START":
      return state.phase === "intro" ? { ...state, phase: "playing" } : state;

    case "ANSWER": {
      if (state.phase !== "playing") return state;
      const isCorrect = action.isCorrect === true;
      const correct = state.correct + (isCorrect ? 1 : 0);
      const wrongMissionIds = isCorrect || action.missionId == null
        ? state.wrongMissionIds
        : [...state.wrongMissionIds, action.missionId];
      return {
        ...state,
        phase: "feedback",
        hearts: state.heartsEnabled ? Math.max(0, state.hearts - (isCorrect ? 0 : 1)) : state.hearts,
        correct,
        score: Math.max(0, (correct * 20) - state.hintPenalty),
        wrongMissionIds,
        combo: isCorrect ? state.combo + 1 : 0,
        feedback: {
          correct: isCorrect,
          selectedValue: action.candidate,
          correctOption: action.correctOption,
          parts: action.parts ?? [],
          notes: action.notes ?? [],
          text: isCorrect ? "ถูกต้อง! ผ่านภารกิจนี้แล้ว" : "ยังไม่ถูก ดูจุดที่ต้องแก้ด้านล่าง",
        },
      };
    }

    case "CONTINUE":
      if (state.phase !== "feedback") return state;
      if ((state.heartsEnabled && state.hearts <= 0) || state.index >= state.missionCount - 1) {
        return { ...state, phase: "finished", feedback: null };
      }
      return {
        ...state,
        phase: "playing",
        index: state.index + 1,
        showHint: false,
        feedback: null,
      };

    case "USE_HINT": {
      if (state.phase !== "playing" || state.hints <= 0 || state.showHint) return state;
      const hintPenalty = state.hintPenalty + 5;
      return {
        ...state,
        hints: state.hints - 1,
        hintsUsed: state.hintsUsed + 1,
        hintPenalty,
        score: Math.max(0, (state.correct * 20) - hintPenalty),
        showHint: true,
      };
    }

    case "PAUSE":
      if (state.phase !== "playing" && state.phase !== "feedback") return state;
      return { ...state, phase: "paused", resumePhase: state.phase };

    case "RESUME":
      if (state.phase !== "paused") return state;
      return { ...state, phase: state.resumePhase ?? "playing", resumePhase: null };

    case "RESTART": {
      const levelId = action.level?.id ?? state.levelId;
      const missionCount = action.level?.questions?.length ?? state.missionCount;
      const phase = action.showIntro ? "intro" : "playing";
      return freshSession(levelId, missionCount, phase, state.heartsEnabled);
    }

    case "FINISH":
      return state.phase === "finished" ? state : { ...state, phase: "finished", resumePhase: null };

    default:
      return state;
  }
};
