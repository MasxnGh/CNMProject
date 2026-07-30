import { levels } from "../data/levels.js";

const questionById = new Map(levels.flatMap((level) => level.questions).map((question) => [question.id, question]));

/** A pseudo-level built from every question currently recorded in progress.mistakes. */
export const buildMistakesReviewLevel = (progress) => {
  const questions = (progress.mistakes ?? []).map((id) => questionById.get(id)).filter(Boolean);
  if (!questions.length) return null;

  return {
    id: "mistakes-review",
    isMistakesReview: true,
    title: "ฝึกแก้ไขข้อที่เคยตอบผิด",
    location: "ห้องฝึกฝน",
    topic: `ทบทวน ${questions.length} ข้อที่เคยพลาด`,
    description: "ตอบให้ถูกเพื่อเอาข้อนั้นออกจากรายการที่เคยตอบผิด",
    backgroundTheme: "library",
    questions,
    knowledge: [],
    badgeUnlock: [],
  };
};

/** Removes correctly-answered questions from progress.mistakes; a repeated wrong answer just stays in the list. */
export const completeMistakesReview = (progress, level, performance = {}) => {
  const wrongThisRun = new Set(performance.wrongMissionIds ?? []);
  const attemptedCount = Number(performance.attemptedCount ?? level.questions.length);
  const mistakes = new Set(progress.mistakes ?? []);
  level.questions.slice(0, attemptedCount).forEach((question) => {
    if (!wrongThisRun.has(question.id)) mistakes.delete(question.id);
  });
  return { ...progress, mistakes: [...mistakes] };
};
