import { describe, expect, it } from "vitest";
import { createGameSession, gameSessionReducer } from "./gameSessionReducer";

const level = {
  id: 7,
  questions: [{ id: "7-1" }, { id: "7-2" }],
};

const reduce = (state, action) => gameSessionReducer(state, action);

describe("gameSessionReducer", () => {
  it("creates an intro session with fresh gameplay counters", () => {
    expect(createGameSession(level)).toEqual(expect.objectContaining({
      levelId: 7,
      missionCount: 2,
      phase: "intro",
      index: 0,
      hearts: 3,
      hints: 2,
      hintsUsed: 0,
      correct: 0,
      score: 0,
      showHint: false,
      feedback: null,
    }));
  });

  it("can skip the intro from persisted settings", () => {
    expect(createGameSession(level, { skipIntro: true }).phase).toBe("playing");
  });

  it("starts, records correct feedback, locks repeat answers, and continues", () => {
    const started = reduce(createGameSession(level), { type: "START" });
    const answered = reduce(started, {
      type: "ANSWER",
      candidate: "tea",
      correctOption: "tea",
      isCorrect: true,
    });

    expect(answered).toEqual(expect.objectContaining({
      phase: "feedback",
      correct: 1,
      hearts: 3,
      score: 20,
      feedback: expect.objectContaining({
        correct: true,
        selectedValue: "tea",
        correctOption: "tea",
      }),
    }));
    expect(reduce(answered, { type: "ANSWER", candidate: "tea", isCorrect: true })).toBe(answered);
    expect(reduce(answered, { type: "CONTINUE" })).toEqual(expect.objectContaining({
      phase: "playing",
      index: 1,
      feedback: null,
      showHint: false,
    }));
  });

  it("removes one heart for a wrong answer without reducing score below zero", () => {
    const started = reduce(createGameSession(level, { skipIntro: true }), { type: "USE_HINT" });
    const answered = reduce(started, {
      type: "ANSWER",
      candidate: "wrong",
      correctOption: "right",
      isCorrect: false,
    });

    expect(answered.hearts).toBe(2);
    expect(answered.correct).toBe(0);
    expect(answered.score).toBe(0);
    expect(answered.feedback.correct).toBe(false);
  });

  it("records the mission id of a wrong answer, and never a correct one", () => {
    const playing = reduce(createGameSession(level, { skipIntro: true }), { type: "START" });
    const wrong = reduce(playing, { type: "ANSWER", candidate: "x", correctOption: "y", isCorrect: false, missionId: "7-1" });
    expect(wrong.wrongMissionIds).toEqual(["7-1"]);

    const afterContinue = reduce(wrong, { type: "CONTINUE" });
    const right = reduce(afterContinue, { type: "ANSWER", candidate: "y", correctOption: "y", isCorrect: true, missionId: "7-2" });
    expect(right.wrongMissionIds).toEqual(["7-1"]);
  });

  it("counts a consecutive-correct combo and resets it on any wrong answer", () => {
    const threeQuestionLevel = { id: 7, questions: [{ id: "7-1" }, { id: "7-2" }, { id: "7-3" }] };
    let state = reduce(createGameSession(threeQuestionLevel, { skipIntro: true }), { type: "START" });
    state = reduce(state, { type: "ANSWER", candidate: "y", correctOption: "y", isCorrect: true });
    expect(state.combo).toBe(1);

    state = reduce(state, { type: "CONTINUE" });
    state = reduce(state, { type: "ANSWER", candidate: "y", correctOption: "y", isCorrect: true });
    expect(state.combo).toBe(2);

    state = reduce(state, { type: "CONTINUE" });
    state = reduce(state, { type: "ANSWER", candidate: "x", correctOption: "y", isCorrect: false });
    expect(state.combo).toBe(0);
  });

  it("charges one hint and ignores repeated hint use on the same mission", () => {
    const session = createGameSession(level, { skipIntro: true });
    const hinted = reduce(session, { type: "USE_HINT" });

    expect(hinted).toEqual(expect.objectContaining({ hints: 1, hintsUsed: 1, score: 0, showHint: true }));
    expect(reduce(hinted, { type: "USE_HINT" })).toBe(hinted);

    const scored = { ...session, correct: 1, score: 20 };
    expect(reduce(scored, { type: "USE_HINT" }).score).toBe(15);
  });

  it("carries a floored hint penalty into later correct-answer points", () => {
    let session = createGameSession(level, { skipIntro: true });

    session = reduce(session, { type: "USE_HINT" });
    expect(session).toEqual(expect.objectContaining({ score: 0, hintPenalty: 5 }));

    session = reduce(session, { type: "ANSWER", candidate: "one", correctOption: "one", isCorrect: true });
    expect(session.score).toBe(15);
    session = reduce(session, { type: "CONTINUE" });

    session = reduce(session, { type: "USE_HINT" });
    expect(session).toEqual(expect.objectContaining({ score: 10, hintPenalty: 10, hintsUsed: 2 }));

    session = reduce(session, { type: "ANSWER", candidate: "two", correctOption: "two", isCorrect: true });
    expect(session.score).toBe(30);
  });

  it("keeps hint debt after a wrong answer until later points are earned", () => {
    let session = createGameSession(level, { skipIntro: true });
    session = reduce(session, { type: "USE_HINT" });
    session = reduce(session, { type: "ANSWER", candidate: "wrong", correctOption: "right", isCorrect: false });
    session = reduce(session, { type: "CONTINUE" });
    session = reduce(session, { type: "ANSWER", candidate: "right", correctOption: "right", isCorrect: true });

    expect(session).toEqual(expect.objectContaining({ correct: 1, hintsUsed: 1, hintPenalty: 5, score: 15 }));
  });

  it("pauses and resumes the prior phase while locking gameplay input", () => {
    const playing = createGameSession(level, { skipIntro: true });
    const paused = reduce(playing, { type: "PAUSE" });

    expect(paused).toEqual(expect.objectContaining({ phase: "paused", resumePhase: "playing" }));
    expect(reduce(paused, { type: "ANSWER", isCorrect: true })).toBe(paused);
    expect(reduce(paused, { type: "USE_HINT" })).toBe(paused);
    expect(reduce(paused, { type: "RESUME" })).toEqual(expect.objectContaining({ phase: "playing", resumePhase: null }));
  });

  it("finishes after feedback on the last mission or when hearts reach zero", () => {
    const lastMission = {
      ...createGameSession(level, { skipIntro: true }),
      index: 1,
      phase: "feedback",
      feedback: { correct: true },
    };
    expect(reduce(lastMission, { type: "CONTINUE" }).phase).toBe("finished");

    const noHearts = { ...lastMission, index: 0, hearts: 0 };
    expect(reduce(noHearts, { type: "CONTINUE" }).phase).toBe("finished");
    expect(reduce(createGameSession(level), { type: "FINISH" }).phase).toBe("finished");
  });

  it("restarts with fresh counters directly in play", () => {
    const dirty = {
      ...createGameSession(level, { skipIntro: true }),
      index: 1,
      hearts: 1,
      hints: 0,
      hintsUsed: 2,
      correct: 1,
      score: 35,
      phase: "paused",
      feedback: { correct: false },
    };

    expect(reduce(dirty, { type: "RESTART" })).toEqual(expect.objectContaining({
      phase: "playing",
      index: 0,
      hearts: 3,
      hints: 2,
      hintsUsed: 0,
      correct: 0,
      score: 0,
      feedback: null,
    }));
  });
});
