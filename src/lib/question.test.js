import { describe, it, expect } from "vitest";
import { generateQuestion, KINDS } from "./question.js";
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
