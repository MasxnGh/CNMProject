import { isAcceptableTranslation } from "./gradeTranslation.js";

const scalarTypes = new Set([
  "multiple",
  "multipleChoice",
  "pinyin",
  "pinyinDrag",
  "toneChoice",
  "fillBlank",
  "fill-blank",
  "audio",
  "audioChoice",
  "culture",
  "cultureQuiz",
  "imageChoice",
  "dialogue",
  "finalBoss",
  "translationBlank",
]);

const exactArray = (candidate, expected) =>
  Array.isArray(candidate)
  && Array.isArray(expected)
  && candidate.length === expected.length
  && candidate.every((value, index) => Object.is(value, expected[index]));

const unorderedArray = (candidate, expected) => {
  if (!Array.isArray(candidate) || !Array.isArray(expected) || candidate.length !== expected.length) return false;
  const remaining = [...expected];
  return candidate.every((value) => {
    const index = remaining.findIndex((item) => Object.is(item, value));
    if (index < 0) return false;
    remaining.splice(index, 1);
    return true;
  });
};

const completeMapping = (candidate, expected) => {
  if (!candidate || !expected || Array.isArray(candidate) || Array.isArray(expected)) return false;
  if (typeof candidate !== "object" || typeof expected !== "object") return false;
  const expectedKeys = Object.keys(expected);
  const candidateKeys = Object.keys(candidate);
  return candidateKeys.length === expectedKeys.length
    && expectedKeys.every((key) => Object.hasOwn(candidate, key) && Object.is(candidate[key], expected[key]));
};

export const evaluateMission = (mission, candidate) => {
  if (!mission?.type || !mission.answer) return false;

  // Best-effort by design (character-overlap, no phoneme backend): a
  // self-report (browser can't recognize speech) always passes so the mic
  // requirement never blocks a player, and "practice" mode passes on any
  // real attempt - only "challenge" mode holds attempts to the overlap bar.
  if (mission.type === "pronunciation") {
    if (candidate?.type !== "pronunciation" || candidate.attempted !== true) return false;
    if (candidate.selfReported === true) return true;
    if ((mission.mechanics?.mode ?? "practice") === "practice") return true;
    const threshold = Number(mission.mechanics?.minOverlap ?? 0.5);
    return Number.isFinite(candidate.overlapScore) && candidate.overlapScore >= threshold;
  }

  if (mission.type === "hanziTrace") {
    if (candidate?.type !== "hanziTrace" || candidate.attempted !== true) return false;
    const validMetrics = Number.isFinite(candidate.strokeCount)
      && Number.isFinite(candidate.pointCount)
      && Number.isFinite(candidate.boundsCoverage)
      && Number.isFinite(candidate.quadrantCoverage);
    if (!validMetrics || candidate.strokeCount < 1 || candidate.pointCount < 1) return false;

    if ((mission.mechanics?.mode ?? "practice") === "practice") return true;

    const pointThreshold = Number(mission.mechanics?.minStrokePoints ?? 28);
    const boundsThreshold = Number(mission.mechanics?.minBoundsCoverage ?? 0.12);
    const quadrantThreshold = Number(mission.mechanics?.minQuadrantCoverage ?? 0.5);
    return candidate.passed === true
      && candidate.pointCount >= pointThreshold
      && candidate.boundsCoverage >= boundsThreshold
      && candidate.quadrantCoverage >= quadrantThreshold;
  }

  if (mission.type === "sentenceOrder" || mission.type === "sentence-order") {
    return exactArray(candidate, mission.answer.correctSequence ?? mission.answer.correctAnswer);
  }

  // translateSentence accepts either mode the player chose: chips (an
  // ordered array, graded exactly like sentenceOrder) or typed free text
  // (graded leniently - punctuation/whitespace shouldn't fail a correct
  // sentence).
  if (mission.type === "translateSentence") {
    if (typeof candidate === "string") {
      return isAcceptableTranslation(candidate, mission.answer.correctText, mission.answer.acceptedAnswers);
    }
    return exactArray(candidate, mission.answer.correctSequence);
  }

  if (mission.type === "shopping") {
    return unorderedArray(candidate, mission.answer.correctAnswer);
  }

  if (mission.type === "matching") {
    return completeMapping(candidate, mission.answer.correctAnswer);
  }

  if (scalarTypes.has(mission.type)) {
    return Object.is(candidate, mission.answer.correctAnswer);
  }

  return false;
};
