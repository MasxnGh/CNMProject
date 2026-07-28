const freshSession = (levelId, missionCount, phase) => ({
  levelId,
  missionCount,
  phase,
  resumePhase: null,
  index: 0,
  hearts: 3,
  hints: 2,
  hintsUsed: 0,
  hintPenalty: 0,
  correct: 0,
  score: 0,
  showHint: false,
  feedback: null,
});

export const createGameSession = (level, { skipIntro = false } = {}) =>
  freshSession(level.id, level.questions?.length ?? 0, skipIntro ? "playing" : "intro");

export const gameSessionReducer = (state, action) => {
  switch (action.type) {
    case "START":
      return state.phase === "intro" ? { ...state, phase: "playing" } : state;

    case "ANSWER": {
      if (state.phase !== "playing") return state;
      const isCorrect = action.isCorrect === true;
      const correct = state.correct + (isCorrect ? 1 : 0);
      return {
        ...state,
        phase: "feedback",
        hearts: Math.max(0, state.hearts - (isCorrect ? 0 : 1)),
        correct,
        score: Math.max(0, (correct * 20) - state.hintPenalty),
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
      if (state.hearts <= 0 || state.index >= state.missionCount - 1) {
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
      return freshSession(levelId, missionCount, phase);
    }

    case "FINISH":
      return state.phase === "finished" ? state : { ...state, phase: "finished", resumePhase: null };

    default:
      return state;
  }
};
