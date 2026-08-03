/**
 * Sanity check for the write_character good/hard/again classification in
 * src/components/exercises/writeCharacterResult.js.
 * Run via `node scripts/test-write-character-result.mjs`.
 */
import { classifyWriteResult } from "../src/components/exercises/writeCharacterResult.js";

let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`PASS: ${msg}`);
  } else {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  }
}

assert(
  classifyWriteResult({ gaveUp: false, usedHint: false, totalMistakes: 0 }) === "good",
  "clean completion with no mistakes and no hint is good",
);
assert(
  classifyWriteResult({ gaveUp: false, usedHint: false, totalMistakes: 5 }) === "good",
  "exactly 5 mistakes (the threshold) still counts as good",
);
assert(
  classifyWriteResult({ gaveUp: false, usedHint: false, totalMistakes: 6 }) === "hard",
  "more than 5 mistakes is hard",
);
assert(
  classifyWriteResult({ gaveUp: false, usedHint: true, totalMistakes: 0 }) === "hard",
  "watching the demo forces hard even with zero mistakes",
);
assert(
  classifyWriteResult({ gaveUp: true, usedHint: false, totalMistakes: 0 }) === "again",
  "giving up is always again",
);
assert(
  classifyWriteResult({ gaveUp: true, usedHint: true, totalMistakes: 20 }) === "again",
  "giving up overrides hint/mistake state - still again",
);

console.log(failed === 0 ? "\nwriteCharacterResult.js: all checks passed" : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
