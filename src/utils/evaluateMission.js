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
  "finalBoss",
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
