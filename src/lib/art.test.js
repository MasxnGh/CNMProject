import { describe, it, expect } from "vitest";
import { isEmojiArt, VOCAB_ICON_KEYS } from "./art.js";
import { pinyinSlug } from "./audioKey.js";
import VOCAB from "../content/vocab.json";

describe("isEmojiArt", () => {
  it("treats plain lowercase asset keys as not-emoji", () => {
    for (const key of VOCAB_ICON_KEYS) {
      expect(isEmojiArt(key), `"${key}" should be an asset key, not emoji`).toBe(false);
    }
  });

  it("treats emoji glyphs used in vocab.json as emoji", () => {
    const emojiValues = VOCAB.map((w) => w.art).filter((a) => a && !/^[a-z][a-z0-9]*$/i.test(a));
    expect(emojiValues.length).toBeGreaterThan(0);
    for (const e of emojiValues) {
      expect(isEmojiArt(e), `"${e}" should be detected as emoji`).toBe(true);
    }
  });

  it("returns false for empty/falsy input", () => {
    expect(isEmojiArt("")).toBe(false);
    expect(isEmojiArt(undefined)).toBe(false);
  });
});

describe("vocab.json emoji art values", () => {
  it("never reuses an existing SVG/photo asset key as an emoji value", () => {
    const assetKeys = new Set(VOCAB_ICON_KEYS);
    for (const w of VOCAB) {
      if (w.art && isEmojiArt(w.art)) {
        expect(assetKeys.has(w.art), `emoji "${w.art}" on "${w.hanzi}" collides with an asset key`).toBe(false);
      }
    }
  });
});

describe("vocab.json — no borrowed pictures", () => {
  it("never lets two different words share one art value (photo, SVG, or emoji)", () => {
    const owners = new Map();
    for (const w of VOCAB) {
      if (!w.art) continue;
      const prior = owners.get(w.art);
      expect(prior, `"${w.hanzi}" and "${prior}" both use art "${w.art}"`).toBeUndefined();
      owners.set(w.art, w.hanzi);
    }
  });
});

describe("vocab.json — no unanswerable duplicate glosses", () => {
  it("never gives two words in the same category the identical Thai gloss", () => {
    const byThaiCat = new Map();
    for (const w of VOCAB) {
      const key = `${w.cat}|${w.thai}`;
      const bucket = byThaiCat.get(key) || [];
      bucket.push(w.hanzi);
      byThaiCat.set(key, bucket);
    }
    for (const [key, list] of byThaiCat) {
      expect(list.length, `"${key}" is shared by ${list.join(", ")}`).toBe(1);
    }
  });
});

describe("pinyinSlug", () => {
  it("strips tone marks and spaces into a filename-safe slug", () => {
    expect(pinyinSlug("sān diǎn bàn")).toBe("san_dian_ban");
    expect(pinyinSlug("jiǔ diǎn yí kè")).toBe("jiu_dian_yi_ke");
  });
});
