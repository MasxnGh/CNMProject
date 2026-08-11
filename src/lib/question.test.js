import { describe, it, expect } from "vitest";
import { generateQuestion, KINDS, IMAGE_SIDE, RISE_MULTIPLIER } from "./question.js";
import VOCAB from "../content/vocab.json";
import CATEGORIES from "../content/categories.json";
import CONFIG from "../content/config.json";

const vocabByHanzi = new Map(VOCAB.map((w) => [w.hanzi, w]));

function hanziShownIn(q) {
  const out = [];
  if (q.word) out.push(q.word.hanzi);
  if (q.options) out.push(...q.options.map((o) => o.hanzi));
  if (q.matchWords) out.push(...q.matchWords.map((w) => w.hanzi));
  if (q.sequence) out.push(...q.sequence.items.map((it) => it.hanzi));
  return out;
}

describe("generateQuestion — category containment (16 categories × 25 questions)", () => {
  for (const cat of CATEGORIES) {
    it(`never shows a word outside "${cat.id}"`, () => {
      const mastery = {};
      for (let i = 0; i < 25; i++) {
        const q = generateQuestion({
          vocab: VOCAB,
          catIds: [cat.id],
          optionCount: 4,
          mastery,
          sequences: CONFIG.sequences,
          clocks: CONFIG.clocks,
        });

        for (const hz of hanziShownIn(q)) {
          const vocabWord = vocabByHanzi.get(hz);
          // clock phrases (e.g. 三点半) aren't vocab entries at all — nothing to check there
          if (!vocabWord) continue;
          expect(vocabWord.cat, `"${hz}" (kind "${q.kind}") leaked outside category "${cat.id}"`).toBe(cat.id);
        }
      }
    });
  }
});

describe("iron rules 1 + 3 — image placement, never an empty picture (60 mixed questions)", () => {
  it("never shows an image on both sides, and any word illustrated on screen actually has art", () => {
    const mastery = {};
    for (let i = 0; i < 60; i++) {
      const cat = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
      const optionCount = Math.random() < 0.5 ? 3 : 4;
      const q = generateQuestion({
        vocab: VOCAB,
        catIds: [cat.id],
        optionCount,
        mastery,
        sequences: CONFIG.sequences,
        clocks: CONFIG.clocks,
      });

      if (KINDS.includes(q.kind)) {
        expect(["q", "a", ""]).toContain(q.imageSide);
        if (q.imageSide === "q") {
          expect(q.word.art, `question-side image for "${q.word.hanzi}" is empty`).toBeTruthy();
        }
        if (q.imageSide === "a") {
          for (const opt of q.options) {
            expect(opt.art, `answer-side image for "${opt.hanzi}" is empty`).toBeTruthy();
          }
        }
      }

      if (q.kind === "match") {
        for (const w of q.matchWords) {
          expect(w.art, `match cell for "${w.hanzi}" has no art`).toBeTruthy();
        }
      }
    }
  });
});

describe("iron rule 4 — no two words in play share an art key (across all 16 categories × 40 questions)", () => {
  it("every illustrated word in an image-bearing or match question has a distinct art key", () => {
    const mastery = {};
    for (const cat of CATEGORIES) {
      for (let i = 0; i < 40; i++) {
        const optionCount = Math.random() < 0.5 ? 3 : 4;
        const q = generateQuestion({
          vocab: VOCAB,
          catIds: [cat.id],
          optionCount,
          mastery,
          sequences: CONFIG.sequences,
          clocks: CONFIG.clocks,
        });

        let wordsInPlay = [];
        if (q.kind === "match") {
          wordsInPlay = q.matchWords;
        } else if (KINDS.includes(q.kind) && IMAGE_SIDE[q.kind] !== "") {
          // q.options already includes q.word (see generateCoreQuestion) — don't double it
          wordsInPlay = q.options;
        }

        const seenArt = new Map();
        for (const w of wordsInPlay) {
          if (!w.art) continue;
          const prior = seenArt.get(w.art);
          expect(prior, `"${w.hanzi}" and "${prior}" share art key "${w.art}" in one ${q.kind} question`).toBeUndefined();
          seenArt.set(w.art, w.hanzi);
        }
      }
    }
  });
});

describe("Thai-only prompt kinds are gone", () => {
  it("KINDS no longer contains img2th or th2img — every core kind keeps hanzi on screen", () => {
    expect(KINDS).toEqual(["zh2th", "th2zh", "img2zh", "zh2img"]);
    expect(KINDS).not.toContain("img2th");
    expect(KINDS).not.toContain("th2img");
    expect(IMAGE_SIDE.img2th).toBeUndefined();
    expect(IMAGE_SIDE.th2img).toBeUndefined();
  });

  it("match's rise-time multiplier was lowered to 1.8", () => {
    expect(RISE_MULTIPLIER.match).toBe(1.8);
  });
});

describe("blind modifier never produces a kind outside the known set (40 categories × mixed art)", () => {
  it("restricts its own 6-core-kind pool to img2zh/zh2th/th2zh (special kinds are gated separately)", () => {
    const mastery = {};
    for (const cat of CATEGORIES) {
      for (let i = 0; i < 10; i++) {
        const q = generateQuestion({
          vocab: VOCAB,
          catIds: [cat.id],
          optionCount: 4,
          mastery,
          sequences: CONFIG.sequences,
          clocks: CONFIG.clocks,
          mods: ["blind"],
        });
        if (!KINDS.includes(q.kind)) continue; // compass/clock/order/match aren't gated by "blind"
        expect(["img2zh", "zh2th", "th2zh"]).toContain(q.kind);
        // blind's whole point is no hanzi hint before answering — img2zh's
        // prompt must stay image-only, never leak the word's own hanzi
        if (q.kind === "img2zh") {
          expect(q.imageSide).toBe("q");
        }
      }
    }
  });
});
