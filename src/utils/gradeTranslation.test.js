import { describe, expect, it } from "vitest";
import { isAcceptableTranslation } from "./gradeTranslation.js";

describe("isAcceptableTranslation", () => {
  it("accepts an exact match", () => {
    expect(isAcceptableTranslation("我爱妈妈。", "我爱妈妈。")).toBe(true);
  });

  it("ignores punctuation and whitespace differences", () => {
    expect(isAcceptableTranslation("我 爱 妈妈", "我爱妈妈。")).toBe(true);
    expect(isAcceptableTranslation("我爱妈妈", "我爱妈妈。")).toBe(true);
  });

  it("rejects a wrong sentence", () => {
    expect(isAcceptableTranslation("我爱爸爸。", "我爱妈妈。")).toBe(false);
  });

  it("rejects empty or whitespace-only input", () => {
    expect(isAcceptableTranslation("", "我爱妈妈。")).toBe(false);
    expect(isAcceptableTranslation("   ", "我爱妈妈。")).toBe(false);
  });

  it("accepts any listed alternate phrasing", () => {
    expect(isAcceptableTranslation("我很爱妈妈。", "我爱妈妈。", ["我很爱妈妈。"])).toBe(true);
  });
});
