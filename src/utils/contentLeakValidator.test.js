import { describe, expect, test } from "vitest";
import { validateLevels, validateMission } from "./contentLeakValidator.js";

const afterAnswer = {
  explanation: "Review the answer after submitting.",
  pinyin: "miao",
  translation: "cat",
};

const nestedMission = (overrides = {}) => ({
  id: "1-1",
  levelId: 1,
  type: "multipleChoice",
  title: "Choose the answer",
  beforeAnswer: {
    prompt: "Select the best option.",
  },
  options: ["cat", "dog"],
  correctAnswer: "cat",
  afterAnswer,
  ...overrides,
});

const nestedOnlyMission = (overrides = {}) => {
  const {
    beforeAnswer: beforeAnswerOverrides = {},
    answer: answerOverrides = {},
    ...missionOverrides
  } = overrides;

  return {
    id: "1-1",
    levelId: 1,
    type: "multipleChoice",
    beforeAnswer: {
      prompt: "Select the best option.",
      options: ["cat", "dog"],
      ...beforeAnswerOverrides,
    },
    answer: {
      correctAnswer: "cat",
      ...answerOverrides,
    },
    afterAnswer,
    ...missionOverrides,
  };
};

const flatMission = (overrides = {}) => ({
  id: "1-1",
  type: "multipleChoice",
  title: "Choose the answer",
  question: "Select the best option.",
  options: ["cat", "dog"],
  correctAnswer: "cat",
  pinyin: "miao",
  thaiMeaning: "cat",
  explanation: "Review the answer after submitting.",
  ...overrides,
});

const errorCodes = (mission) => validateMission(mission).errors.map((error) => error.code);

describe("content leak validator", () => {
  describe("nested-only mutation coverage", () => {
    test("flags a nested-only pinyin final exposed in prompt content", () => {
      const mission = nestedOnlyMission({
        type: "pinyinDrag",
        beforeAnswer: { title: "Drag the final an into place", options: ["an", "ang"] },
        answer: { correctAnswer: "an" },
      });

      expect(errorCodes(mission)).toContain("PINYIN_FINAL_VISIBLE");
    });

    test("flags nested-only tone pinyin exposed outside selectable options", () => {
      const mission = nestedOnlyMission({
        type: "toneChoice",
        beforeAnswer: { chineseText: "老", pinyin: "lǎo", options: ["lāo", "láo", "lǎo", "lào"] },
        answer: { correctAnswer: "lǎo" },
      });

      expect(errorCodes(mission)).toContain("TONE_ANSWER_PINYIN_VISIBLE");
    });

    test("flags a nested-only audio transcript while allowing the answer as an option", () => {
      const mission = nestedOnlyMission({
        type: "audioChoice",
        beforeAnswer: { transcript: "猫", options: ["猫", "狗"] },
        answer: { correctAnswer: "猫" },
      });

      expect(errorCodes(mission)).toContain("AUDIO_TRANSCRIPT_VISIBLE");
    });

    test("flags a nested-only completed sentence sequence", () => {
      const mission = nestedOnlyMission({
        type: "sentenceOrder",
        beforeAnswer: { chineseText: "你好！", options: ["好", "你"] },
        answer: { correctSequence: ["你", "好"], correctAnswer: ["你", "好"] },
      });

      expect(errorCodes(mission)).toContain("SENTENCE_SEQUENCE_VISIBLE");
    });

    test("flags nested-only fill answer and pinyin leaks outside options", () => {
      const mission = nestedOnlyMission({
        type: "fillBlank",
        beforeAnswer: { prompt: "选择 猫", pinyin: "māo", options: ["猫", "狗"] },
        answer: { correctAnswer: "猫" },
      });

      expect(errorCodes(mission)).toEqual(
        expect.arrayContaining(["FILL_BLANK_ANSWER_VISIBLE", "FILL_BLANK_PINYIN_VISIBLE"]),
      );
    });

    test("flags a nested-only matching card and equality hint", () => {
      const mission = nestedOnlyMission({
        type: "matching",
        beforeAnswer: { cards: [{ chinese: "猫", thai: "แมว" }] },
        answer: {
          pairs: [{ left: "猫", right: "แมว" }],
          correctAnswer: { 猫: "แมว" },
        },
        hint: "猫 = แมว",
      });

      expect(errorCodes(mission)).toEqual(
        expect.arrayContaining(["MATCHING_PAIR_VISIBLE", "DIRECT_HINT_ANSWER"]),
      );
    });

    test("flags a nested-only shopping direct-answer hint", () => {
      const mission = nestedOnlyMission({
        type: "shopping",
        beforeAnswer: { items: [{ id: "苹果", emoji: "apple" }], hint: "คำตอบคือ 苹果" },
        answer: { correctAnswer: ["苹果"] },
      });

      expect(errorCodes(mission)).toContain("DIRECT_HINT_ANSWER");
    });

    test("validates nested-only options and scalar answer membership", () => {
      const mission = nestedOnlyMission({
        beforeAnswer: { options: ["cat", "cat", "dog"] },
        answer: { correctAnswer: "bird" },
      });

      expect(errorCodes(mission)).toEqual(
        expect.arrayContaining(["DUPLICATE_OPTIONS", "CORRECT_ANSWER_NOT_IN_OPTIONS"]),
      );
    });

    test("prefers nested answer data over conflicting legacy answer fields", () => {
      const mission = nestedOnlyMission({
        type: "toneChoice",
        beforeAnswer: { pinyin: "lǎo", options: ["lāo", "láo", "lǎo", "lào"] },
        answer: { correctAnswer: "lǎo" },
        correctAnswer: "legacy-safe-value",
      });

      expect(errorCodes(mission)).toContain("TONE_ANSWER_PINYIN_VISIBLE");
    });

    test("does not treat selectable nested options as prompt leaks", () => {
      const fixtures = [
        {
          code: "PINYIN_FINAL_VISIBLE",
          mission: nestedOnlyMission({
            type: "pinyinDrag",
            beforeAnswer: { pinyinPattern: "m _ o", options: ["a", "e", "i", "u"] },
            answer: { correctAnswer: "a", finalPinyin: "māo" },
          }),
        },
        {
          code: "TONE_ANSWER_PINYIN_VISIBLE",
          mission: nestedOnlyMission({
            type: "toneChoice",
            beforeAnswer: { chineseText: "老", options: ["lāo", "láo", "lǎo", "lào"] },
            answer: { correctAnswer: "lǎo" },
          }),
        },
        {
          code: "AUDIO_TRANSCRIPT_VISIBLE",
          mission: nestedOnlyMission({
            type: "audioChoice",
            beforeAnswer: { instruction: "Listen and choose", options: ["猫", "狗"] },
            answer: { correctAnswer: "猫" },
          }),
        },
        {
          code: "FILL_BLANK_ANSWER_VISIBLE",
          mission: nestedOnlyMission({
            type: "fillBlank",
            beforeAnswer: { chineseText: "___", options: ["猫", "狗"] },
            answer: { correctAnswer: "猫" },
          }),
        },
      ];

      fixtures.forEach(({ mission, code }) => {
        expect(errorCodes(mission)).not.toContain(code);
      });
    });
  });

  test("flags a pinyin final exposed in a pinyin-drag title", () => {
    const mission = nestedMission({
      type: "pinyinDrag",
      title: "Drag the final an into place",
      correctAnswer: "an",
      options: ["an", "ang"],
    });

    expect(errorCodes(mission)).toContain("PINYIN_FINAL_VISIBLE");
  });

  test("does not treat a one-letter answer as a generic substring leak", () => {
    const mission = nestedMission({
      type: "pinyinDrag",
      title: "Choose a pinyin final",
      correctAnswer: "a",
      options: ["a", "o"],
    });

    expect(errorCodes(mission)).not.toContain("PINYIN_FINAL_VISIBLE");
  });

  test("flags a nested pinyin-drag hint that names the one-letter final", () => {
    const mission = nestedMission({
      type: "pinyinDrag",
      beforeAnswer: { hint: "Place the final a in the blank." },
      correctAnswer: "a",
      options: ["a", "o"],
    });

    expect(errorCodes(mission)).toContain("PINYIN_FINAL_VISIBLE");
  });

  test("flags a flat pinyin-drag hint that names the one-letter final", () => {
    const mission = flatMission({
      type: "pinyinDrag",
      hint: "\u0e04\u0e33\u0e27\u0e48\u0e32 \u732b \u0e21\u0e35\u0e40\u0e2a\u0e35\u0e22\u0e07\u0e01\u0e25\u0e32\u0e07\u0e40\u0e1b\u0e47\u0e19 a",
      correctAnswer: "a",
      options: ["a", "o"],
    });

    expect(errorCodes(mission)).toContain("PINYIN_FINAL_VISIBLE");
  });

  test("flags full answer pinyin exposed before a tone choice", () => {
    const mission = nestedMission({
      type: "toneChoice",
      beforeAnswer: { prompt: "Which tone is ma?", pinyin: "ma3" },
      correctAnswer: "ma3",
      options: ["ma1", "ma2", "ma3", "ma4"],
    });

    expect(errorCodes(mission)).toContain("TONE_ANSWER_PINYIN_VISIBLE");
  });

  test("flags an audio transcript exposed before an audio choice", () => {
    const mission = nestedMission({
      type: "audioChoice",
      beforeAnswer: { transcript: "mao" },
      correctAnswer: "mao",
      options: ["mao", "gou"],
    });

    expect(errorCodes(mission)).toContain("AUDIO_TRANSCRIPT_VISIBLE");
  });

  test("flags a one-character Chinese target in a nested audio transcript", () => {
    const mission = nestedMission({
      type: "audioChoice",
      beforeAnswer: { transcript: "\u732b" },
      correctAnswer: "\u732b",
      options: ["\u732b", "\u72d7"],
    });

    expect(errorCodes(mission)).toContain("AUDIO_TRANSCRIPT_VISIBLE");
  });

  test("flags a one-character Chinese target in an explicit flat audio transcript", () => {
    const mission = flatMission({
      type: "audioChoice",
      transcript: "\u732b",
      correctAnswer: "\u732b",
      options: ["\u732b", "\u72d7"],
    });

    expect(errorCodes(mission)).toContain("AUDIO_TRANSCRIPT_VISIBLE");
  });

  test("flags a completed sequence exposed before sentence ordering", () => {
    const mission = nestedMission({
      type: "sentenceOrder",
      beforeAnswer: { prompt: "I love you" },
      correctAnswer: ["I", "love", "you"],
      correctSequence: ["I", "love", "you"],
      options: ["I", "love", "you"],
    });

    expect(errorCodes(mission)).toContain("SENTENCE_SEQUENCE_VISIBLE");
  });

  test("flags a contiguous Chinese sentence with terminal punctuation in nested data", () => {
    const mission = nestedMission({
      type: "sentenceOrder",
      beforeAnswer: { prompt: "\u4f60\u597d\uff01" },
      correctAnswer: ["\u4f60", "\u597d"],
      correctSequence: ["\u4f60", "\u597d"],
      options: ["\u4f60", "\u597d"],
    });

    expect(errorCodes(mission)).toContain("SENTENCE_SEQUENCE_VISIBLE");
  });

  test("flags a contiguous Chinese sentence with terminal punctuation in flat data", () => {
    const mission = flatMission({
      type: "sentenceOrder",
      chineseText: "\u4f60\u597d\uff01",
      correctAnswer: ["\u4f60", "\u597d"],
      correctSequence: ["\u4f60", "\u597d"],
      options: ["\u4f60", "\u597d"],
    });

    expect(errorCodes(mission)).toContain("SENTENCE_SEQUENCE_VISIBLE");
  });

  test("flags a fill-blank answer and pinyin exposed before submission", () => {
    const mission = nestedMission({
      type: "fillBlank",
      beforeAnswer: { prompt: "The answer is mao", pinyin: "mao" },
      correctAnswer: "mao",
      options: ["mao", "gou"],
    });

    expect(errorCodes(mission)).toEqual(
      expect.arrayContaining(["FILL_BLANK_ANSWER_VISIBLE", "FILL_BLANK_PINYIN_VISIBLE"]),
    );
  });

  test("flags a one-character Chinese answer in a nested fill blank", () => {
    const mission = nestedMission({
      type: "fillBlank",
      beforeAnswer: { prompt: "\u9009\u62e9 \u732b", pinyin: "mao" },
      correctAnswer: "\u732b",
      options: ["\u732b", "\u72d7"],
    });

    expect(errorCodes(mission)).toContain("FILL_BLANK_ANSWER_VISIBLE");
  });

  test("flags a one-character Chinese answer in a flat fill blank", () => {
    const mission = flatMission({
      type: "fillBlank",
      question: "\u9009\u62e9 \u732b",
      chineseText: "___",
      correctAnswer: "\u732b",
      options: ["\u732b", "\u72d7"],
    });

    expect(errorCodes(mission)).toContain("FILL_BLANK_ANSWER_VISIBLE");
  });

  test("flags a matching card that exposes Chinese and Thai together", () => {
    const mission = nestedMission({
      type: "matching",
      beforeAnswer: { cards: [{ chinese: "mao", thai: "cat" }] },
      pairs: [{ left: "mao", right: "cat" }],
      correctAnswer: { mao: "cat" },
      options: ["cat", "dog"],
    });

    expect(errorCodes(mission)).toContain("MATCHING_PAIR_VISIBLE");
  });

  test("flags direct answer hints and equality hints", () => {
    const answerHint = nestedMission({ hint: "\u0e04\u0e33\u0e15\u0e2d\u0e1a\u0e04\u0e37\u0e2d cat" });
    const equalityHint = nestedMission({
      type: "matching",
      hint: "mao = cat",
      pairs: [{ left: "mao", right: "cat" }],
      correctAnswer: { mao: "cat" },
    });

    expect(errorCodes(answerHint)).toContain("DIRECT_HINT_ANSWER");
    expect(errorCodes(equalityHint)).toContain("DIRECT_HINT_ANSWER");
  });

  test("flags duplicate options", () => {
    const mission = nestedMission({ options: ["cat", "cat", "dog"] });

    expect(errorCodes(mission)).toContain("DUPLICATE_OPTIONS");
  });

  test("flags a scalar correct answer missing from options", () => {
    const mission = nestedMission({ correctAnswer: "bird", options: ["cat", "dog"] });

    expect(errorCodes(mission)).toContain("CORRECT_ANSWER_NOT_IN_OPTIONS");
  });

  test("reports each missing after-answer field with a clear code", () => {
    const mission = nestedMission({ afterAnswer: {} });

    expect(errorCodes(mission)).toEqual(
      expect.arrayContaining([
        "AFTER_ANSWER_EXPLANATION_MISSING",
        "AFTER_ANSWER_PINYIN_MISSING",
        "AFTER_ANSWER_TRANSLATION_MISSING",
      ]),
    );
  });

  test("accepts flat legacy missions and reports their leaks without crashing", () => {
    const levels = [
      {
        id: 9,
        questions: [
          {
            id: "9-1",
            type: "pinyinDrag",
            title: "Drag the final an into place",
            correctAnswer: "an",
            options: ["an", "ang"],
            pinyin: "m-an",
            thaiMeaning: "cat",
            explanation: "The final is an.",
          },
        ],
      },
    ];

    expect(() => validateLevels(levels)).not.toThrow();
    const result = validateLevels(levels);
    expect(result).toMatchObject({ total: 1, errors: expect.any(Number) });
    expect(result.errors).toBeGreaterThan(0);
    expect(result.missions[0]).toMatchObject({ missionId: "9-1", levelId: 9 });
  });
});
