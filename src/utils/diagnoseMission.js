import { evaluateMission } from "./evaluateMission";

/**
 * Turns a submitted candidate into a per-part verdict so the game can point at
 * the exact piece that is wrong instead of only saying "not quite".
 *
 * Shape: { correct, parts: [{ key, slot, got, expected, status }], notes: [string] }
 * status: "correct" | "wrong" | "missing" | "extra"
 *
 * `parts` drives the in-place markers on each mission control; `notes` drives
 * the correction scroll shown under the mission.
 */

const asArray = (value) => (Array.isArray(value) ? value : []);

const sentenceParts = (mission, candidate) => {
  const expected = mission.answer.correctSequence ?? mission.answer.correctAnswer;
  const placed = asArray(candidate);
  return asArray(expected).map((word, index) => {
    const got = placed[index];
    return {
      key: `slot-${index}`,
      slot: index,
      got: got ?? null,
      expected: word,
      status: got === word ? "correct" : got === undefined ? "missing" : "wrong",
    };
  });
};

const sentenceNotes = (parts) => parts
  .filter((part) => part.status !== "correct")
  .map((part) => (part.got
    ? `ช่องที่ ${part.slot + 1} วาง ${part.got} แต่ต้องเป็น ${part.expected}`
    : `ช่องที่ ${part.slot + 1} ยังว่าง ต้องเป็น ${part.expected}`));

const matchingParts = (mission, candidate) => {
  const expected = mission.answer.correctAnswer ?? {};
  const submitted = candidate && typeof candidate === "object" && !Array.isArray(candidate) ? candidate : {};
  return Object.entries(expected).map(([left, right]) => {
    const got = submitted[left];
    return {
      key: left,
      got: got ?? null,
      expected: right,
      status: got === right ? "correct" : got === undefined ? "missing" : "wrong",
    };
  });
};

const matchingNotes = (parts) => parts
  .filter((part) => part.status !== "correct")
  .map((part) => (part.got
    ? `${part.key} จับคู่กับ ${part.got} แต่ต้องเป็น ${part.expected}`
    : `${part.key} ยังไม่ได้จับคู่ ต้องเป็น ${part.expected}`));

const shoppingParts = (mission, candidate) => {
  const expected = asArray(mission.answer.correctAnswer);
  const picked = asArray(candidate);
  const missing = expected.filter((item) => !picked.includes(item));
  const extra = picked.filter((item) => !expected.includes(item));
  const chosenCorrectly = picked.filter((item) => expected.includes(item));

  return [
    ...chosenCorrectly.map((item) => ({ key: item, got: item, expected: item, status: "correct" })),
    ...extra.map((item) => ({ key: item, got: item, expected: null, status: "extra" })),
    ...missing.map((item) => ({ key: item, got: null, expected: item, status: "missing" })),
  ];
};

const shoppingNotes = (parts) => [
  ...parts.filter((part) => part.status === "extra").map((part) => `${part.key} ไม่ได้อยู่ในรายการ`),
  ...parts.filter((part) => part.status === "missing").map((part) => `ยังขาด ${part.expected}`),
];

const scalarParts = (mission, candidate) => {
  const expected = mission.answer.correctAnswer;
  return [{
    key: "answer",
    got: candidate ?? null,
    expected,
    status: Object.is(candidate, expected) ? "correct" : "wrong",
  }];
};

const scalarNotes = (parts, mission) => parts
  .filter((part) => part.status !== "correct")
  .map((part) => {
    if (mission.type === "toneChoice") {
      return `เลือก ${part.got} แต่คำนี้อ่านว่า ${part.expected}`;
    }
    if (mission.type === "pinyinDrag") {
      return `วาง ${part.got} ในช่องว่าง แต่ต้องเป็น ${part.expected}`;
    }
    return `ตอบ ${part.got} แต่คำตอบที่ถูกคือ ${part.expected}`;
  });

const traceThresholds = (mission) => ({
  points: Number(mission.mechanics?.minStrokePoints ?? 28),
  bounds: Number(mission.mechanics?.minBoundsCoverage ?? 0.12),
  quadrants: Number(mission.mechanics?.minQuadrantCoverage ?? 0.5),
});

const traceParts = (mission, candidate) => {
  const metrics = candidate && candidate.type === "hanziTrace" ? candidate : {};
  if (metrics.attempted !== true) {
    return [{ key: "attempt", got: null, expected: null, status: "missing" }];
  }

  const limits = traceThresholds(mission);
  const practice = (mission.mechanics?.mode ?? "practice") === "practice";
  if (practice) return [{ key: "attempt", got: metrics.strokeCount ?? 0, expected: null, status: "correct" }];

  return [
    {
      key: "points",
      got: metrics.pointCount ?? 0,
      expected: limits.points,
      status: (metrics.pointCount ?? 0) >= limits.points ? "correct" : "wrong",
    },
    {
      key: "bounds",
      got: metrics.boundsCoverage ?? 0,
      expected: limits.bounds,
      status: (metrics.boundsCoverage ?? 0) >= limits.bounds ? "correct" : "wrong",
    },
    {
      key: "quadrants",
      got: metrics.quadrantCoverage ?? 0,
      expected: limits.quadrants,
      status: (metrics.quadrantCoverage ?? 0) >= limits.quadrants ? "correct" : "wrong",
    },
  ];
};

const traceLabels = {
  points: "เส้นที่เขียนยังสั้นไป ลากให้เต็มตัวอักษรมากขึ้น",
  bounds: "ตัวอักษรเล็กเกินไป เขียนให้เต็มกรอบมากขึ้น",
  quadrants: "ยังเขียนไม่ครบทุกด้านของตัวอักษร",
};

const traceNotes = (parts) => parts
  .filter((part) => part.status !== "correct")
  .map((part) => (part.key === "attempt" ? "ยังไม่ได้เขียนตัวอักษร" : traceLabels[part.key]))
  .filter(Boolean);

const byType = {
  sentenceOrder: { parts: sentenceParts, notes: sentenceNotes },
  "sentence-order": { parts: sentenceParts, notes: sentenceNotes },
  matching: { parts: matchingParts, notes: matchingNotes },
  shopping: { parts: shoppingParts, notes: shoppingNotes },
  hanziTrace: { parts: traceParts, notes: traceNotes },
};

export const diagnoseMission = (mission, candidate) => {
  const correct = evaluateMission(mission, candidate);
  if (!mission?.type || !mission.answer) return { correct, parts: [], notes: [] };

  const handler = byType[mission.type];
  const parts = handler ? handler.parts(mission, candidate) : scalarParts(mission, candidate);
  const notes = correct
    ? []
    : handler
      ? handler.notes(parts, mission)
      : scalarNotes(parts, mission);

  return { correct, parts, notes };
};
