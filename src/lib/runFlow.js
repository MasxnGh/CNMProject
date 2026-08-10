/**
 * Pure decision for what happens after a question resolves. Kept separate
 * from Play.jsx so "risk mode ends at exactly 3 rounds" is unit-testable
 * without spinning up the whole rise-loop/timer machinery.
 */
export function decideAfterQuestion({ modeId, round, qIn, miss }) {
  if (modeId !== "zen" && miss >= 3) return "result";
  const nextQIn = qIn + 1;
  if (modeId === "risk" && nextQIn >= 6) {
    return round >= 3 ? "result" : "modifier";
  }
  return "continue";
}
