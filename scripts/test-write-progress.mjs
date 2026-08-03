/**
 * Sanity check for src/lib/writeProgress.js - the copybook/badge bookkeeping
 * fed by write_character completions. Run via `node scripts/test-write-progress.mjs`.
 */
import { recordWriteCompletion } from "../src/lib/writeProgress.js";

let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`PASS: ${msg}`);
  } else {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  }
}

function freshProgress() {
  return {
    stamps: [],
    copybook: [],
    writeStats: { totalCompletions: 0, perfectStreak: 0, noGuideCompletions: 0 },
  };
}

function complete(progress, overrides = {}) {
  return recordWriteCompletion(progress, {
    correct: true,
    guided: true,
    usedHint: false,
    totalMistakes: 0,
    entryId: "v_ni",
    hanzi: "你",
    drawnPaths: ["M0 0 L10 10"],
    canvasSize: 280,
    ...overrides,
  });
}

// --- give up: only resets the perfect streak, nothing else ----------------
let p = freshProgress();
p = complete(p);
p = complete(p);
const beforeGiveUp = p.writeStats.totalCompletions;
p = recordWriteCompletion(p, { correct: false, guided: true, usedHint: false, totalMistakes: 0 });
assert(p.writeStats.perfectStreak === 0, "giving up resets the perfect streak");
assert(p.writeStats.totalCompletions === beforeGiveUp, "giving up does not increment totalCompletions");
assert(p.copybook.length === 2, "giving up does not add a copybook entry");

// --- first successful write awards "write_first" once ---------------------
p = freshProgress();
p = complete(p);
assert(p.stamps.some((s) => s.kind === "write_first"), "first successful write awards write_first");
const firstStampCount = p.stamps.filter((s) => s.kind === "write_first").length;
p = complete(p);
assert(
  p.stamps.filter((s) => s.kind === "write_first").length === firstStampCount,
  "write_first is only ever awarded once",
);

// --- perfect streak badge at exactly 10 in a row, broken by any mistake ---
p = freshProgress();
for (let i = 0; i < 9; i += 1) p = complete(p, { totalMistakes: 0 });
assert(!p.stamps.some((s) => s.kind === "write_steady"), "write_steady not awarded before 10 in a row");
p = complete(p, { totalMistakes: 0 });
assert(p.stamps.some((s) => s.kind === "write_steady"), "write_steady awarded at exactly 10 in a row");

p = freshProgress();
for (let i = 0; i < 5; i += 1) p = complete(p, { totalMistakes: 0 });
p = complete(p, { totalMistakes: 2 }); // breaks the streak
for (let i = 0; i < 9; i += 1) p = complete(p, { totalMistakes: 0 });
assert(!p.stamps.some((s) => s.kind === "write_steady"), "a single mistake resets the streak count toward the badge");

// --- no-guide badge at exactly 20 successful no-guide completions ----------
p = freshProgress();
for (let i = 0; i < 19; i += 1) p = complete(p, { guided: false });
assert(!p.stamps.some((s) => s.kind === "write_noguide"), "write_noguide not awarded before 20");
p = complete(p, { guided: false });
assert(p.stamps.some((s) => s.kind === "write_noguide"), "write_noguide awarded at exactly 20 no-guide completions");

p = freshProgress();
for (let i = 0; i < 20; i += 1) p = complete(p, { guided: true });
assert(!p.stamps.some((s) => s.kind === "write_noguide"), "guided completions never count toward write_noguide");

// --- copybook: skips hint-assisted completions, caps at 60 ----------------
p = freshProgress();
p = complete(p, { usedHint: true });
assert(p.copybook.length === 0, "a hint-assisted completion is not saved to the copybook");

p = freshProgress();
for (let i = 0; i < 65; i += 1) p = complete(p, { entryId: `v_${i}` });
assert(p.copybook.length === 60, "copybook is capped at 60 entries");
assert(p.copybook[0].vocabId === "v_5", "copybook drops the oldest entries first (keeps the most recent 60)");
assert(p.copybook[59].vocabId === "v_64", "copybook keeps the most recent entry");

console.log(failed === 0 ? "\nwriteProgress.js: all checks passed" : `\n${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
