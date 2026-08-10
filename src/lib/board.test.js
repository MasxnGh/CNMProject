import { describe, it, expect, beforeEach } from "vitest";
import { loadBoard, saveBoard, recordScore, getEntries } from "./board.js";

describe("board persistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("starts at zero — no entries for any category/difficulty on a fresh board", () => {
    const board = loadBoard();
    expect(getEntries(board, "greet", "mid")).toEqual([]);
  });

  it("has data after a run is recorded, and it survives a simulated reload", () => {
    let board = loadBoard();
    board = recordScore(board, "greet", "mid", {
      name: "ทดสอบ",
      avatar: "fox",
      score: 1234,
      mode: "เส้นทางเสี่ยง",
      date: "10 ส.ค.",
    });
    saveBoard(board);

    const reloaded = loadBoard(); // a fresh read, as if the page had just loaded
    const entries = getEntries(reloaded, "greet", "mid");
    expect(entries).toHaveLength(1);
    expect(entries[0].score).toBe(1234);
    expect(entries[0].name).toBe("ทดสอบ");
  });

  it("never crashes on corrupt stored data — starts fresh instead", () => {
    localStorage.setItem("zhiyuan.board.v1", "{ this is not valid json");
    expect(() => loadBoard()).not.toThrow();
    expect(getEntries(loadBoard(), "greet", "mid")).toEqual([]);
  });

  it("keeps at most 20 entries per board, highest score first", () => {
    let board = loadBoard();
    for (let i = 0; i < 25; i++) {
      board = recordScore(board, "num", "easy", { name: "p", avatar: "fox", score: i, mode: "m", date: "d" });
    }
    const entries = getEntries(board, "num", "easy");
    expect(entries).toHaveLength(20);
    expect(entries[0].score).toBe(24);
  });

  it("keeps different category/difficulty boards separate", () => {
    let board = loadBoard();
    board = recordScore(board, "num", "easy", { name: "a", avatar: "fox", score: 10, mode: "m", date: "d" });
    board = recordScore(board, "num", "hard", { name: "b", avatar: "fox", score: 20, mode: "m", date: "d" });
    expect(getEntries(board, "num", "easy")).toHaveLength(1);
    expect(getEntries(board, "num", "hard")).toHaveLength(1);
    expect(getEntries(board, "num", "easy")[0].score).toBe(10);
  });
});
