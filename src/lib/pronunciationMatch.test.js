import { describe, expect, it } from "vitest";
import { findMissingChars } from "./pronunciationMatch.js";

describe("lib/pronunciationMatch", () => {
  it("returns nothing when every target character was heard", () => {
    expect(findMissingChars("你好", "你好")).toEqual([]);
  });

  it("returns the characters that were not heard", () => {
    expect(findMissingChars("我是学生", "我是")).toEqual(["学", "生"]);
  });

  it("returns all target characters when nothing was recognized", () => {
    expect(findMissingChars("你好", "")).toEqual(["你", "好"]);
  });

  it("ignores non-hanzi characters like punctuation", () => {
    expect(findMissingChars("你好！", "你好")).toEqual([]);
  });
});
