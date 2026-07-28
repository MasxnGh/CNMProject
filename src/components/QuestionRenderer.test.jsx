import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMissionView } from "../utils/missionViewModel";
import QuestionRenderer from "./QuestionRenderer";

let canvasContext;

beforeEach(() => {
  canvasContext = {
    beginPath: vi.fn(),
    clearRect: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    scale: vi.fn(),
    stroke: vi.fn(),
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(canvasContext);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const makeMission = ({ id, type, beforeAnswer, answer, afterAnswer, audioText, mechanics }) => ({
  id: id ?? `test-${type}`,
  type,
  beforeAnswer: {
    title: "ภารกิจทดสอบ",
    instruction: "เลือกคำตอบ",
    ...beforeAnswer,
  },
  answer,
  afterAnswer: {
    chineseText: "เฉลยจีน",
    pinyin: "reveal-only-pinyin",
    thaiMeaning: "คำแปลหลังตอบ",
    explanation: "คำอธิบายหลังตอบ",
    ...afterAnswer,
  },
  hint: "คำใบ้ปลอดภัย",
  audioText,
  mechanics,
});

const renderMission = (mission, { phase = "playing", feedback = null, disabled = false } = {}) => {
  const onSubmit = vi.fn();
  const onPlayAudio = vi.fn();
  const result = render(
    <QuestionRenderer
      missionView={getMissionView(mission, phase)}
      onSubmit={onSubmit}
      disabled={disabled}
      feedback={feedback}
      onPlayAudio={onPlayAudio}
    />,
  );

  return { ...result, onSubmit, onPlayAudio };
};

const expectSerializedDomNotToContain = (container, ...sentinels) => {
  sentinels.forEach((sentinel) => expect(container.innerHTML).not.toContain(sentinel));
};

const makeHanziMission = (id, character, minStrokePoints = 3) => makeMission({
  id,
  type: "hanziTrace",
  beforeAnswer: {
    question: `เขียน ${character}`,
    chineseText: character,
    thaiMeaning: "ตัวอักษรทดสอบ",
    characterToTrace: character,
  },
  answer: { correctAnswer: character, answerSentinel: `answer-only-${id}` },
  afterAnswer: { chineseText: character, pinyin: `reveal-${id}` },
  mechanics: { minStrokePoints },
});

describe("QuestionRenderer safe mission boundary", () => {
  it("keeps the tone reveal hidden while playing and shows it from the feedback view", () => {
    const mission = makeMission({
      type: "toneChoice",
      beforeAnswer: { chineseText: "马", thaiMeaning: "ม้า", options: ["mā", "má", "mǎ", "mà"] },
      answer: { correctAnswer: "mǎ", finalPinyin: "answer-only-tone-pinyin" },
      afterAnswer: {
        chineseText: "马",
        pinyin: "mǎ (เสียงที่ 3)",
        thaiMeaning: "ม้า",
        explanation: "เสียงที่สามลดแล้วสูงขึ้น",
      },
      audioText: "马",
    });
    const feedback = { selectedValue: "má", correctOption: "mǎ", correct: false };
    const { container, rerender } = renderMission(mission);

    expect(screen.queryByText("mǎ (เสียงที่ 3)")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("answer-only-tone-pinyin");
    expectSerializedDomNotToContain(container, "answer-only-tone-pinyin", "mǎ (เสียงที่ 3)", "เสียงที่สามลดแล้วสูงขึ้น");

    rerender(
      <QuestionRenderer
        missionView={getMissionView(mission, "feedback")}
        onSubmit={vi.fn()}
        disabled
        feedback={feedback}
        onPlayAudio={vi.fn()}
      />,
    );

    expect(screen.getByText("mǎ (เสียงที่ 3)")).toBeInTheDocument();
    expect(screen.getByText("เสียงที่สามลดแล้วสูงขึ้น")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "mǎ" })).toHaveClass("correct");
    expect(screen.getByRole("button", { name: "má" })).toHaveClass("wrong");
    expect(container).not.toHaveTextContent("answer-only-tone-pinyin");
    expectSerializedDomNotToContain(container, "answer-only-tone-pinyin");
  });

  it("emits a selected choice candidate without a correctness boolean", () => {
    const mission = makeMission({
      type: "toneChoice",
      beforeAnswer: { chineseText: "马", options: ["mā", "má", "mǎ", "mà"] },
      answer: { correctAnswer: "mǎ" },
    });
    const { onSubmit } = renderMission(mission);

    fireEvent.click(screen.getByRole("button", { name: "má" }));
    expect(onSubmit).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith("má");
  });

  it("keeps full pinyin out of a fill mission and emits the chosen word", () => {
    const mission = makeMission({
      type: "fillBlank",
      beforeAnswer: {
        question: "我____中国菜。",
        chineseText: "我____中国菜。",
        thaiMeaning: "ฉันชอบอาหารจีน",
        options: ["喜欢", "是", "去", "叫"],
      },
      answer: { correctAnswer: "喜欢", finalPinyin: "Wǒ xǐhuān Zhōngguó cài." },
      afterAnswer: { pinyin: "Wǒ xǐhuān Zhōngguó cài." },
    });
    const { container, onSubmit } = renderMission(mission);

    expect(container).not.toHaveTextContent("Wǒ xǐhuān Zhōngguó cài.");
    expectSerializedDomNotToContain(container, "Wǒ xǐhuān Zhōngguó cài.");
    fireEvent.click(screen.getByRole("button", { name: "喜欢" }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));
    expect(onSubmit).toHaveBeenCalledWith("喜欢");
  });

  it("keeps audio transcript data out of the DOM and delegates playback to the parent", () => {
    const mission = makeMission({
      type: "audioChoice",
      beforeAnswer: { options: ["你好", "再见"] },
      answer: {
        correctAnswer: "你好",
        transcript: "answer-only-audio-transcript",
        target: "answer-only-audio-target",
      },
      afterAnswer: {
        chineseText: "你好",
        pinyin: "Nǐ hǎo!",
        thaiMeaning: "สวัสดี",
        explanation: "คำทักทายพื้นฐาน",
      },
      audioText: "parent-only-audio-transcript",
    });
    const { container, onPlayAudio, onSubmit } = renderMission(mission);

    expect(container).not.toHaveTextContent("answer-only-audio-transcript");
    expect(container).not.toHaveTextContent("answer-only-audio-target");
    expect(container).not.toHaveTextContent("parent-only-audio-transcript");
    expect(container).not.toHaveTextContent("Nǐ hǎo!");
    expect(container).not.toHaveTextContent("สวัสดี");
    expectSerializedDomNotToContain(
      container,
      "answer-only-audio-transcript",
      "answer-only-audio-target",
      "parent-only-audio-transcript",
      "Nǐ hǎo!",
      "สวัสดี",
    );

    fireEvent.click(screen.getByRole("button", { name: "ฟังเสียงภาษาจีน" }));
    fireEvent.click(screen.getByRole("button", { name: "你好" }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));

    expect(onPlayAudio).toHaveBeenCalledWith(expect.objectContaining({
      onStart: expect.any(Function),
      onEnd: expect.any(Function),
      onError: expect.any(Function),
    }));
    expect(onSubmit).toHaveBeenCalledWith("你好");
  });

  it("keeps the complete sentence hidden while playing and emits the ordered word array", () => {
    const mission = makeMission({
      type: "sentenceOrder",
      beforeAnswer: {
        question: "เรียงประโยคว่าฉันรักคุณ",
        thaiMeaning: "ฉันรักคุณ",
        options: ["你", "爱", "我"],
      },
      answer: { correctSequence: ["我", "爱", "你"], correctAnswer: ["我", "爱", "你"] },
      afterAnswer: { chineseText: "我爱你。", pinyin: "Wǒ ài nǐ." },
      audioText: "我爱你。",
    });
    const { container, onSubmit } = renderMission(mission);

    expect(container).not.toHaveTextContent("我爱你。");
    expectSerializedDomNotToContain(container, "我爱你。", "Wǒ ài nǐ.");
    fireEvent.click(screen.getByRole("button", { name: "我" }));
    fireEvent.click(screen.getByRole("button", { name: "爱" }));
    fireEvent.click(screen.getByRole("button", { name: "你" }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจ" }));

    expect(onSubmit).toHaveBeenCalledWith(["我", "爱", "你"]);
  });

  it("keeps final pinyin hidden while playing, emits the dropped option, and reveals only after feedback", () => {
    const mission = makeMission({
      type: "pinyinDrag",
      beforeAnswer: {
        chineseText: "猫",
        thaiMeaning: "แมว",
        pinyinPattern: "m _ o",
        options: ["a", "e", "i", "u"],
      },
      answer: { correctAnswer: "a", finalPinyin: "answer-only-final-pinyin" },
      afterAnswer: {
        chineseText: "猫",
        pinyin: "māo (เฉลยหลังตอบ)",
        thaiMeaning: "แมว",
        explanation: "m + ao รวมเป็น māo",
      },
    });
    const feedback = { selectedValue: "a", correctOption: "a", correct: true };
    const { container, onSubmit, rerender } = renderMission(mission);

    expect(container).not.toHaveTextContent("answer-only-final-pinyin");
    expect(container).not.toHaveTextContent("māo (เฉลยหลังตอบ)");
    expectSerializedDomNotToContain(container, "answer-only-final-pinyin", "māo (เฉลยหลังตอบ)", "m + ao รวมเป็น māo");

    const dropZone = screen.getByRole("button", { name: "_" });
    fireEvent.click(screen.getByRole("button", { name: "a" }));
    fireEvent.click(dropZone);
    expect(onSubmit).toHaveBeenCalledWith("a");

    rerender(
      <QuestionRenderer
        missionView={getMissionView(mission, "feedback")}
        onSubmit={vi.fn()}
        disabled
        feedback={feedback}
        onPlayAudio={vi.fn()}
      />,
    );

    expect(screen.getByText("māo (เฉลยหลังตอบ)")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("answer-only-final-pinyin");
    expectSerializedDomNotToContain(container, "answer-only-final-pinyin");
  });

  it("emits a complete matching candidate without checking pair correctness", () => {
    const mission = makeMission({
      type: "matching",
      beforeAnswer: {
        leftCards: ["猫", "狗"],
        rightCards: ["แมว", "หมา"],
      },
      answer: { correctAnswer: { 猫: "แมว", 狗: "หมา" } },
    });
    const { onSubmit } = renderMission(mission);

    fireEvent.click(screen.getByRole("button", { name: /^猫/ }));
    fireEvent.click(screen.getByRole("button", { name: "แมว" }));
    fireEvent.click(screen.getByRole("button", { name: /^狗/ }));
    fireEvent.click(screen.getByRole("button", { name: "หมา" }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));

    expect(onSubmit).toHaveBeenCalledWith({ 猫: "แมว", 狗: "หมา" });
  });

  it("emits selected shopping item ids as the candidate", () => {
    const mission = makeMission({
      type: "shopping",
      beforeAnswer: {
        question: "เลือกผลไม้",
        targetList: ["苹果"],
        items: [
          { id: "苹果", emoji: "apple" },
          { id: "茶", emoji: "tea" },
        ],
      },
      answer: { correctAnswer: ["苹果"] },
    });
    const { onSubmit } = renderMission(mission);

    fireEvent.click(screen.getByRole("button", { name: /苹果/ }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจรายการ" }));

    expect(onSubmit).toHaveBeenCalledWith(["苹果"]);
  });

  it("emits a typed Hanzi measurement without the target character or answer", () => {
    const mission = makeHanziMission("hanzi-candidate", "人");
    const { container, onSubmit } = renderMission(mission);
    const canvas = container.querySelector("canvas");

    fireEvent.pointerDown(canvas, { clientX: 1, clientY: 1, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 2, clientY: 2, pointerId: 1 });
    fireEvent.pointerMove(canvas, { clientX: 3, clientY: 3, pointerId: 1 });
    fireEvent.pointerUp(canvas, { pointerId: 1 });
    fireEvent.click(screen.getByRole("button", { name: "ตรวจ" }));

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      type: "hanziTrace",
      strokeCount: 1,
      pointCount: 1,
      boundsCoverage: expect.any(Number),
      quadrantCoverage: expect.any(Number),
      passed: false,
      attempted: true,
    }));
    expect(JSON.stringify(onSubmit.mock.calls)).not.toContain("人");
    expect(JSON.stringify(onSubmit.mock.calls)).not.toContain("answer-only-hanzi-candidate");
  });

  it("resets Pinyin selection when the mission id changes", () => {
    const first = makeMission({
      id: "pinyin-first",
      type: "pinyinDrag",
      beforeAnswer: { chineseText: "猫", pinyinPattern: "m _ o", options: ["a", "e"] },
      answer: { correctAnswer: "a" },
    });
    const second = makeMission({
      id: "pinyin-second",
      type: "pinyinDrag",
      beforeAnswer: { chineseText: "狗", pinyinPattern: "g _ u", options: ["o", "a"] },
      answer: { correctAnswer: "o" },
    });
    const { container, rerender } = renderMission(first);

    fireEvent.click(screen.getByRole("button", { name: "a" }));
    expect(container.querySelector(".drop-zone")).toHaveTextContent("a");

    rerender(
      <QuestionRenderer
        missionView={getMissionView(second, "playing")}
        onSubmit={vi.fn()}
        disabled={false}
        feedback={null}
        onPlayAudio={vi.fn()}
      />,
    );

    expect(container.querySelector(".drop-zone")).toHaveTextContent("_");
    expect(container.querySelector(".drop-zone")).not.toHaveClass("selected");
  });

  it("resets Hanzi strokes and canvas when the mission id changes", () => {
    const first = makeHanziMission("hanzi-first", "人", 3);
    const second = makeHanziMission("hanzi-second", "木", 5);
    const { container, rerender } = renderMission(first);
    const firstCanvas = container.querySelector("canvas");

    fireEvent.pointerDown(firstCanvas, { clientX: 1, clientY: 1, pointerId: 1 });
    fireEvent.pointerMove(firstCanvas, { clientX: 2, clientY: 2, pointerId: 1 });
    fireEvent.pointerUp(firstCanvas, { pointerId: 1 });
    expect(screen.getByText("1 เส้น, 2/3 จุด")).toBeInTheDocument();

    rerender(
      <QuestionRenderer
        missionView={getMissionView(second, "playing")}
        onSubmit={vi.fn()}
        disabled={false}
        feedback={null}
        onPlayAudio={vi.fn()}
      />,
    );

    expect(container.querySelector("canvas")).not.toBe(firstCanvas);
    expect(screen.getByText("0 เส้น, 0/5 จุด")).toBeInTheDocument();
  });

  it("shuffles tone, audio and pinyin options so the authored order is not the played order", () => {
    // Reverses the authored order: shuffleOptions sorts ascending on the drawn key.
    vi.spyOn(Math, "random").mockImplementation((() => {
      let next = 1;
      return () => {
        next -= 0.1;
        return next;
      };
    })());

    const renderedOrder = (mission, selector) => {
      const { container, unmount } = renderMission(mission);
      const order = [...container.querySelectorAll(selector)].map((node) => node.textContent);
      unmount();
      return order;
    };

    expect(renderedOrder(makeMission({
      type: "toneChoice",
      beforeAnswer: { chineseText: "马", options: ["mā", "má", "mǎ", "mà"] },
      answer: { correctAnswer: "mǎ" },
    }), ".answer-button span:first-child")).toEqual(["mà", "mǎ", "má", "mā"]);

    expect(renderedOrder(makeMission({
      type: "audioChoice",
      beforeAnswer: { options: ["米饭", "水", "茶", "面条"] },
      answer: { correctAnswer: "米饭" },
    }), ".answer-button")).toEqual(["面条", "茶", "水", "米饭"]);

    expect(renderedOrder(makeMission({
      type: "pinyinDrag",
      beforeAnswer: { chineseText: "猫", pinyinPattern: "m _ o", options: ["a", "e", "i", "u"] },
      answer: { correctAnswer: "a" },
    }), ".vowel-chip")).toEqual(["u", "i", "e", "a"]);
  });

  it("reads a picked Chinese answer aloud but stays silent on pinyin and Thai", () => {
    const chinese = makeMission({
      type: "fillBlank",
      beforeAnswer: { chineseText: "我____。", options: ["喜欢", "去"] },
      answer: { correctAnswer: "喜欢" },
    });
    const { onPlayAudio, unmount } = renderMission(chinese);
    fireEvent.click(screen.getByRole("button", { name: "喜欢" }));
    expect(onPlayAudio).toHaveBeenCalledWith({ text: "喜欢" });
    unmount();

    // tone options are bare pinyin - speaking the word would give the tone away
    const tone = makeMission({
      type: "toneChoice",
      beforeAnswer: { chineseText: "老", options: ["lāo", "lǎo"] },
      answer: { correctAnswer: "lǎo" },
    });
    const toneRender = renderMission(tone);
    fireEvent.click(screen.getByRole("button", { name: "lǎo" }));
    expect(toneRender.onPlayAudio).not.toHaveBeenCalled();
    toneRender.unmount();

    // a Thai gloss has nothing to read in Chinese
    const culture = makeMission({
      type: "cultureQuiz",
      beforeAnswer: { chineseText: "红包", options: ["อั่งเปา", "โคมไฟ"] },
      answer: { correctAnswer: "อั่งเปา" },
    });
    const cultureRender = renderMission(culture);
    fireEvent.click(screen.getByRole("button", { name: "อั่งเปา" }));
    expect(cultureRender.onPlayAudio).not.toHaveBeenCalled();
  });

  it("shows the mission instruction so the expected answer format stays explicit", () => {
    const toneMission = makeMission({
      type: "toneChoice",
      beforeAnswer: {
        instruction: "ดูตัวอักษรจีนและความหมาย แล้วเลือกพินอินที่มีเสียงวรรณยุกต์ถูกต้อง",
        question: "老 อ่านว่าอะไร",
        chineseText: "老",
        thaiMeaning: "แก่ / อาวุโส",
        options: ["lāo", "láo", "lǎo", "lào"],
      },
      answer: { correctAnswer: "lǎo" },
    });
    const { unmount } = renderMission(toneMission);

    expect(screen.getByText("ดูตัวอักษรจีนและความหมาย แล้วเลือกพินอินที่มีเสียงวรรณยุกต์ถูกต้อง")).toBeInTheDocument();
    expect(screen.getByText("老 อ่านว่าอะไร")).toBeInTheDocument();
    unmount();

    renderMission(makeMission({
      type: "cultureQuiz",
      beforeAnswer: {
        instruction: "ไขปริศนาวัฒนธรรมจีนจากคำใบ้และสถานการณ์",
        question: "เทศกาลตรุษจีน ภาษาจีนเรียกว่าอะไร",
        chineseText: "ตรุษจีน",
        options: ["春节", "中秋节"],
      },
      answer: { correctAnswer: "春节" },
    }));

    expect(screen.getByText("เทศกาลตรุษจีน ภาษาจีนเรียกว่าอะไร")).toBeInTheDocument();
    expect(screen.getByText("ไขปริศนาวัฒนธรรมจีนจากคำใบ้และสถานการณ์")).toBeInTheDocument();
  });

  it("picks a picture by its meaning and never shows the Chinese on the cards", () => {
    const mission = makeMission({
      type: "imageChoice",
      beforeAnswer: {
        chineseText: "饺子",
        promptPinyin: "jiǎozi",
        options: ["เกี๊ยว", "ชา"],
        items: [{ emoji: "🥟", label: "เกี๊ยว" }, { emoji: "🍵", label: "ชา" }],
      },
      answer: { correctAnswer: "เกี๊ยว" },
      audioText: "饺子",
    });
    const { container, onSubmit } = renderMission(mission);

    // the cards carry meaning and a picture, never the characters
    const cards = [...container.querySelectorAll(".image-card")];
    expect(cards).toHaveLength(2);
    cards.forEach((card) => expect(card.textContent).not.toContain("饺子"));
    expect(screen.getByText("jiǎozi")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /เกี๊ยว/ }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));
    expect(onSubmit).toHaveBeenCalledWith("เกี๊ยว");
  });

  it("frames a dialogue reply in the player's own bubble", () => {
    const mission = makeMission({
      type: "dialogue",
      beforeAnswer: {
        speakerLine: "你好！",
        speakerPinyin: "Nǐ hǎo!",
        speakerThai: "สวัสดี",
        question: "ตอบกลับอย่างไร",
        options: ["你叫什么名字？", "再见！"],
      },
      answer: { correctAnswer: "你叫什么名字？" },
      audioText: "你好",
    });
    const { container, onSubmit } = renderMission(mission);

    // the reply bubble is empty until a line is chosen
    expect(container.querySelector(".dialogue-bubble.reply")).not.toHaveClass("filled");
    fireEvent.click(screen.getByRole("button", { name: "你叫什么名字？" }));
    expect(container.querySelector(".dialogue-bubble.reply")).toHaveClass("filled");

    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));
    expect(onSubmit).toHaveBeenCalledWith("你叫什么名字？");
  });

  it("withholds the translation on a listen-first sentence", () => {
    const mission = makeMission({
      type: "sentenceOrder",
      beforeAnswer: {
        listenFirst: true,
        question: "ฟังเสียงแล้วเรียงประโยคที่ได้ยิน",
        options: ["我", "喝", "茶"],
      },
      answer: { correctSequence: ["我", "喝", "茶"], correctAnswer: ["我", "喝", "茶"] },
      afterAnswer: { thaiMeaning: "ฉันดื่มชา" },
      audioText: "我喝茶。",
    });
    const { container, onPlayAudio } = renderMission(mission);

    expect(container).not.toHaveTextContent("ฉันดื่มชา");
    expect(screen.getByText("คุณได้ยินว่าอะไร?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ฟังเสียงประโยค" }));
    expect(onPlayAudio).toHaveBeenCalled();
  });

  it("does not emit candidates or audio events while disabled", () => {
    const mission = makeMission({
      type: "toneChoice",
      beforeAnswer: { chineseText: "马", options: ["mā", "mǎ"] },
      answer: { correctAnswer: "mǎ" },
      audioText: "马",
    });
    const { onPlayAudio, onSubmit } = renderMission(mission, { disabled: true });
    const option = screen.getByRole("button", { name: "mā" });
    const audio = screen.getByRole("button", { name: "ฟังเสียงภาษาจีน" });

    expect(option).toBeDisabled();
    expect(audio).toBeDisabled();
    fireEvent.click(option);
    fireEvent.click(audio);

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onPlayAudio).not.toHaveBeenCalled();
  });
});
