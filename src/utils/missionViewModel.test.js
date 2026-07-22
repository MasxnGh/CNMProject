import { describe, expect, it } from "vitest";
import { getMissionView } from "./missionViewModel";

const mission = {
  id: "9-1",
  type: "pinyinDrag",
  beforeAnswer: {
    title: "ประกอบเสียง",
    chineseText: "猫",
    pinyinPattern: "m _ o",
    options: ["a", "e", "i", "u"],
  },
  answer: {
    correctAnswer: "a",
    finalPinyin: "answer-only-māo",
  },
  afterAnswer: {
    chineseText: "猫",
    pinyin: "māo",
    thaiMeaning: "แมว",
    explanation: "m + ao รวมเป็น māo",
  },
  hint: "สังเกตเสียงท้าย",
  audioText: "猫",
  mechanics: { dropZoneId: "blank" },
};

describe("getMissionView", () => {
  it("returns only playable mission content and safe capability metadata", () => {
    const view = getMissionView(mission, "playing");
    const serialized = JSON.stringify(view);

    expect(view).toEqual({
      id: "9-1",
      type: "pinyinDrag",
      ...mission.beforeAnswer,
      hintAvailable: true,
      hasAudio: true,
      mechanics: { dropZoneId: "blank" },
    });
    expect(serialized).not.toContain("answer");
    expect(serialized).not.toContain("correctAnswer");
    expect(serialized).not.toContain("finalPinyin");
    expect(serialized).not.toContain("explanation");
    expect(serialized).not.toContain("answer-only-māo");
  });

  it("merges reveal content for feedback without exposing the answer object", () => {
    const view = getMissionView(mission, "feedback");
    const serialized = JSON.stringify(view);

    expect(view).toMatchObject({
      id: "9-1",
      type: "pinyinDrag",
      chineseText: "猫",
      pinyin: "māo",
      thaiMeaning: "แมว",
      explanation: "m + ao รวมเป็น māo",
      hintAvailable: true,
      hasAudio: true,
      mechanics: { dropZoneId: "blank" },
    });
    expect(view).not.toHaveProperty("answer");
    expect(view).not.toHaveProperty("correctAnswer");
    expect(view).not.toHaveProperty("finalPinyin");
    expect(serialized).not.toContain("answer-only-māo");
  });

  it("reports absent optional capabilities without leaking their values", () => {
    const view = getMissionView(
      { ...mission, hint: undefined, audioText: undefined, mechanics: undefined },
      "playing",
    );

    expect(view).toMatchObject({ hintAvailable: false, hasAudio: false });
    expect(view).toHaveProperty("mechanics", undefined);
  });
});
