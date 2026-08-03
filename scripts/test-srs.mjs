/**
 * Sanity check for the spaced-repetition algorithm in src/lib/srs.js.
 * Run via `node scripts/test-srs.mjs` (or `npm run test:srs`).
 */
import { review, getDueCards, getDueCount } from "../src/lib/srs.js";

let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log(`PASS: ${msg}`);
  } else {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  }
}

// --- 30 days of correct answers: interval should keep growing -----------
let entry = null;
const intervals = [];
for (let day = 0; day < 30; day += 1) {
  entry = review(entry, "good");
  intervals.push(entry.interval);
}
console.log(`\n30 correct answers, interval per day: ${intervals.join(", ")}`);

let neverShrinks = true;
for (let i = 1; i < intervals.length; i += 1) {
  if (intervals[i] < intervals[i - 1]) neverShrinks = false;
}
assert(neverShrinks, "interval never decreases across 30 correct answers");
assert(intervals[intervals.length - 1] > intervals[0], "interval is much longer at day 30 than day 1");
assert(entry.ease <= 3.0, "ease stays capped at 3.0");
assert(entry.interval <= 180, "interval stays capped at 180 days");

// --- forgetting mid-way: interval resets, ease drops ----------------------
let midway = null;
for (let i = 0; i < 5; i += 1) midway = review(midway, "good");
const easeBeforeLapse = midway.ease;
const intervalBeforeLapse = midway.interval;
const afterLapse = review(midway, "again");

console.log(`\nafter 5 correct answers: interval=${intervalBeforeLapse}, ease=${easeBeforeLapse}`);
console.log(`after forgetting: interval=${afterLapse.interval}, ease=${afterLapse.ease}, lapses=${afterLapse.lapses}`);

assert(intervalBeforeLapse > 0, "sanity: interval had grown before the lapse");
assert(afterLapse.interval === 0, "interval resets to 0 after forgetting");
assert(afterLapse.ease < easeBeforeLapse, "ease drops after forgetting");
assert(afterLapse.reps === 0, "reps resets to 0 after forgetting");
assert(afterLapse.lapses === 1, "lapses increments after forgetting");

// --- hard answers grow slower than good answers ---------------------------
let goodEntry = null;
let hardEntry = null;
for (let i = 0; i < 4; i += 1) {
  goodEntry = review(goodEntry, "good");
  hardEntry = review(hardEntry, "hard");
}
console.log(`\nafter 4 answers: good interval=${goodEntry.interval}, hard interval=${hardEntry.interval}`);
assert(hardEntry.interval < goodEntry.interval, "hard answers grow the interval slower than good answers");
assert(hardEntry.ease < goodEntry.ease, "hard answers end up with lower ease than consistently good answers");

// --- ease floors at 1.3 under repeated lapses ------------------------------
let brittle = null;
for (let i = 0; i < 20; i += 1) brittle = review(brittle, "again");
assert(brittle.ease === 1.3, "ease floors at 1.3 after repeated lapses");

// --- getDueCards / getDueCount ---------------------------------------------
const progress = {
  srs: {
    overdue_high_lapse: { ease: 2.0, interval: 5, due: "2000-01-01", reps: 1, lapses: 3, lastSeen: "2000-01-01" },
    overdue_low_lapse: { ease: 2.5, interval: 5, due: "2000-01-05", reps: 1, lapses: 0, lastSeen: "2000-01-05" },
    not_due_yet: { ease: 2.5, interval: 30, due: "2999-01-01", reps: 3, lapses: 0, lastSeen: "2000-01-01" },
  },
};

const due = getDueCards(progress, 20);
console.log(`\ndue cards: ${due.map((c) => c.id).join(", ")}`);
assert(due.length === 2, "getDueCards only returns cards whose due date has passed");
assert(due[0]?.id === "overdue_high_lapse", "getDueCards ranks higher-lapse cards first");
assert(getDueCount(progress) === 2, "getDueCount matches the number of due cards");

console.log(failed === 0 ? "\nsrs.js: all checks passed" : `\nsrs.js: ${failed} check(s) failed`);
process.exit(failed === 0 ? 0 : 1);
