import { describe, it, expect } from "vitest";
import { decideAfterQuestion } from "./runFlow.js";

describe("decideAfterQuestion", () => {
  it("risk mode ends at exactly 3 rounds, never more", () => {
    let round = 1;
    let qIn = 0;
    let result;
    let iterations = 0;

    while (iterations < 100) {
      result = decideAfterQuestion({ modeId: "risk", round, qIn, miss: 0 });
      iterations++;
      if (result === "result") break;
      if (result === "modifier") {
        round += 1;
        qIn = 0;
        continue;
      }
      qIn += 1;
    }

    expect(result).toBe("result");
    expect(round).toBe(3);
    expect(round).toBeLessThanOrEqual(3);
  });

  it("never asks for another modifier round once round 3 is reached", () => {
    expect(decideAfterQuestion({ modeId: "risk", round: 3, qIn: 5, miss: 0 })).toBe("result");
  });

  it("hands back the modifier screen after rounds 1 and 2, not before", () => {
    expect(decideAfterQuestion({ modeId: "risk", round: 1, qIn: 4, miss: 0 })).toBe("continue");
    expect(decideAfterQuestion({ modeId: "risk", round: 1, qIn: 5, miss: 0 })).toBe("modifier");
    expect(decideAfterQuestion({ modeId: "risk", round: 2, qIn: 5, miss: 0 })).toBe("modifier");
  });

  it("ends on the 3rd miss for every mode except zen", () => {
    expect(decideAfterQuestion({ modeId: "risk", round: 1, qIn: 2, miss: 3 })).toBe("result");
    expect(decideAfterQuestion({ modeId: "endless", round: 1, qIn: 2, miss: 3 })).toBe("result");
    expect(decideAfterQuestion({ modeId: "zen", round: 1, qIn: 2, miss: 3 })).toBe("continue");
    expect(decideAfterQuestion({ modeId: "zen", round: 1, qIn: 2, miss: 30 })).toBe("continue");
  });
});
