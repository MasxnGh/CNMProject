import { describe, expect, it } from "vitest";
import { diagnoseMission } from "./diagnoseMission";

const mission = (type, answer, mechanics) => ({ id: "t", type, answer, mechanics });

describe("diagnoseMission", () => {
  it("names the wrong slot and its expected word for sentence order", () => {
    const target = mission("sentenceOrder", { correctSequence: ["我", "是", "学生"] });
    const result = diagnoseMission(target, ["我", "学生", "是"]);

    expect(result.correct).toBe(false);
    expect(result.parts.map((part) => part.status)).toEqual(["correct", "wrong", "wrong"]);
    expect(result.notes).toEqual([
      "ช่องที่ 2 วาง 学生 แต่ต้องเป็น 是",
      "ช่องที่ 3 วาง 是 แต่ต้องเป็น 学生",
    ]);
  });

  it("reports no corrections when the sentence is right", () => {
    const target = mission("sentenceOrder", { correctSequence: ["我", "是"] });
    const result = diagnoseMission(target, ["我", "是"]);

    expect(result.correct).toBe(true);
    expect(result.notes).toEqual([]);
    expect(result.parts.every((part) => part.status === "correct")).toBe(true);
  });

  it("names each mismatched pair for matching missions", () => {
    const target = mission("matching", { correctAnswer: { 水: "น้ำ", 茶: "ชา" } });
    const result = diagnoseMission(target, { 水: "ชา", 茶: "น้ำ" });

    expect(result.correct).toBe(false);
    expect(result.notes).toEqual([
      "水 จับคู่กับ ชา แต่ต้องเป็น น้ำ",
      "茶 จับคู่กับ น้ำ แต่ต้องเป็น ชา",
    ]);
  });

  it("separates extra picks from missing ones in shopping missions", () => {
    const target = mission("shopping", { correctAnswer: ["水", "茶"] });
    const result = diagnoseMission(target, ["水", "饺子"]);

    expect(result.correct).toBe(false);
    expect(result.parts).toEqual(expect.arrayContaining([
      expect.objectContaining({ key: "水", status: "correct" }),
      expect.objectContaining({ key: "饺子", status: "extra" }),
      expect.objectContaining({ key: "茶", status: "missing" }),
    ]));
    expect(result.notes).toEqual(["饺子 ไม่ได้อยู่ในรายการ", "ยังขาด 茶"]);
  });

  it("contrasts the chosen reading with the correct one for tone missions", () => {
    const target = mission("toneChoice", { correctAnswer: "lǎo" });

    expect(diagnoseMission(target, "láo").notes).toEqual(["เลือก láo แต่คำนี้อ่านว่า lǎo"]);
  });

  it("names the dropped piece for pinyin drag missions", () => {
    const target = mission("pinyinDrag", { correctAnswer: "ü" });

    expect(diagnoseMission(target, "u").notes).toEqual(["วาง u ในช่องว่าง แต่ต้องเป็น ü"]);
  });

  it("explains which tracing threshold was missed", () => {
    const target = mission(
      "hanziTrace",
      { correctAnswer: "中" },
      { mode: "challenge", minStrokePoints: 30 },
    );
    const result = diagnoseMission(target, {
      type: "hanziTrace",
      attempted: true,
      passed: false,
      strokeCount: 1,
      pointCount: 4,
      boundsCoverage: 0.6,
      quadrantCoverage: 0.9,
    });

    expect(result.correct).toBe(false);
    expect(result.notes).toEqual(["เส้นที่เขียนยังสั้นไป ลากให้เต็มตัวอักษรมากขึ้น"]);
  });

  it("keeps agreement with evaluateMission on the pass/fail verdict", () => {
    const target = mission("multipleChoice", { correctAnswer: "A" });

    expect(diagnoseMission(target, "A").correct).toBe(true);
    expect(diagnoseMission(target, "B").correct).toBe(false);
    expect(diagnoseMission(target, "B").notes).toEqual(["ตอบ B แต่คำตอบที่ถูกคือ A"]);
  });
});
