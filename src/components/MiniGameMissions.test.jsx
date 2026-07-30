import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AudioChoiceMission from "./AudioChoiceMission";
import MatchingMission, { shuffleWithSeed } from "./MatchingMission";
import PinyinDragMission from "./PinyinDragMission";
import SentenceOrderMission from "./SentenceOrderMission";
import ShoppingMission from "./ShoppingMission";
import ToneChoiceMission from "./ToneChoiceMission";
import TranslateSentenceMission from "./TranslateSentenceMission";
import TranslationBlankMission from "./TranslationBlankMission";
import { levels } from "../data/levels";
import { orderRightAvoidingAlignedPairs } from "./MatchingMission";

afterEach(cleanup);

describe("PinyinDragMission", () => {
  const missionView = {
    id: "pinyin-1",
    chineseText: "猫",
    thaiMeaning: "แมว",
    pinyinPattern: "m _ o",
    options: ["a", "e", "i", "u"],
  };

  it("supports tap option then tap drop zone", () => {
    const onSubmit = vi.fn();
    render(<PinyinDragMission missionView={missionView} onSubmit={onSubmit} disabled={false} feedback={null} />);

    fireEvent.click(screen.getByRole("button", { name: "a" }));
    fireEvent.click(screen.getByRole("button", { name: "a", description: /ช่องวางคำตอบ/ }));

    expect(onSubmit).toHaveBeenCalledWith("a");
  });

  it("supports pointer-compatible drag and drop", () => {
    const onSubmit = vi.fn();
    const transfer = {
      value: "",
      setData: vi.fn((_, value) => { transfer.value = value; }),
      getData: vi.fn(() => transfer.value),
    };
    render(<PinyinDragMission missionView={missionView} onSubmit={onSubmit} disabled={false} feedback={null} />);

    fireEvent.dragStart(screen.getByRole("button", { name: "e" }), { dataTransfer: transfer });
    fireEvent.drop(screen.getByRole("button", { name: "_", description: /ช่องวางคำตอบ/ }), { dataTransfer: transfer });

    expect(onSubmit).toHaveBeenCalledWith("e");
  });

  it("clears the attempted composition after wrong feedback", () => {
    const props = { missionView, onSubmit: vi.fn(), disabled: false };
    const { rerender } = render(<PinyinDragMission {...props} feedback={null} />);
    fireEvent.click(screen.getByRole("button", { name: "a" }));
    fireEvent.click(screen.getByRole("button", { name: "a", description: /ช่องวางคำตอบ/ }));

    rerender(<PinyinDragMission {...props} feedback={{ correct: false, selectedValue: "a" }} />);

    expect(screen.getByRole("button", { name: "_", description: /ช่องวางคำตอบ/ })).toHaveClass("wrong");
  });
});

describe("MatchingMission", () => {
  it("shuffles each side deterministically from mission and retry seeds", () => {
    const cards = ["one", "two", "three", "four", "five", "six"];

    expect(shuffleWithSeed(cards, "mission-1:0:left")).toEqual(shuffleWithSeed(cards, "mission-1:0:left"));
    expect(shuffleWithSeed(cards, "mission-1:0:left")).not.toEqual(shuffleWithSeed(cards, "mission-1:0:right"));
    expect(shuffleWithSeed(cards, "mission-1:0:left")).not.toEqual(shuffleWithSeed(cards, "mission-1:1:left"));
  });

  it("renders independent shuffled columns, connector lines on every viewport, and a mobile matched tray", () => {
    const missionView = {
      id: "matching-1",
      retrySeed: 2,
      leftCards: ["猫", "狗", "茶"],
      rightCards: ["แมว", "หมา", "ชา"],
    };
    const { container } = render(<MatchingMission missionView={missionView} onSubmit={vi.fn()} disabled={false} feedback={null} />);
    const columns = container.querySelectorAll(".match-column");

    expect([...columns[0].querySelectorAll(".match-item")].map((button) => button.textContent)).toEqual(
      shuffleWithSeed(missionView.leftCards, "matching-1:2:left").map((left) => `${left}รอจับคู่`),
    );
    expect([...columns[1].querySelectorAll("button")].map((button) => button.textContent)).toEqual(
      orderRightAvoidingAlignedPairs(
        shuffleWithSeed(missionView.leftCards, "matching-1:2:left"),
        missionView.leftCards,
        missionView.rightCards,
        "matching-1:2:right",
      ),
    );
    expect(container.querySelector(".match-lines")).not.toHaveClass("hidden");
    expect(screen.getByLabelText("คู่ที่จับแล้ว")).toHaveClass("md:hidden");
  });

  it("reads a Chinese word aloud automatically when it is picked, instead of a separate speaker button", () => {
    const onPlayAudio = vi.fn();
    const missionView = {
      id: "matching-audio",
      leftCards: ["猫", "狗", "茶"],
      rightCards: ["แมว", "หมา", "ชา"],
    };
    render(<MatchingMission missionView={missionView} onSubmit={vi.fn()} disabled={false} feedback={null} onPlayAudio={onPlayAudio} />);

    expect(screen.queryByRole("button", { name: /ฟังเสียงคำว่า/ })).not.toBeInTheDocument();

    missionView.leftCards.forEach((word) => {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${word}`) }));
      expect(onPlayAudio).toHaveBeenCalledWith({ text: word });
    });
    expect(onPlayAudio).toHaveBeenCalledTimes(3);
  });

  it("undoes only the most recent pair and can clear the board", () => {
    const missionView = {
      id: "matching-controls",
      leftCards: ["猫", "狗"],
      rightCards: ["แมว", "หมา"],
    };
    const { container } = render(<MatchingMission missionView={missionView} onSubmit={vi.fn()} disabled={false} feedback={null} />);
    const pairCount = () => container.querySelectorAll(".match-pair-number").length;
    const undo = screen.getByRole("button", { name: /ย้อนกลับ/ });
    const clear = screen.getByRole("button", { name: /ล้าง/ });

    expect(undo).toBeDisabled();
    expect(clear).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /^猫/ }));
    fireEvent.click(screen.getByRole("button", { name: "แมว" }));
    fireEvent.click(screen.getByRole("button", { name: /^狗/ }));
    fireEvent.click(screen.getByRole("button", { name: "หมา" }));
    expect(pairCount()).toBe(4);

    // only the second pairing goes
    fireEvent.click(undo);
    expect(pairCount()).toBe(2);
    expect(screen.getByRole("button", { name: /^猫/ })).toHaveClass("matched");

    fireEvent.click(clear);
    expect(pairCount()).toBe(0);
    expect(screen.getByRole("button", { name: /ย้อนกลับ/ })).toBeDisabled();
  });

  it("lets a committed pair be taken back from either side", () => {
    const missionView = {
      id: "matching-undo",
      leftCards: ["猫", "狗"],
      rightCards: ["แมว", "หมา"],
    };
    const onSubmit = vi.fn();
    const { container } = render(<MatchingMission missionView={missionView} onSubmit={onSubmit} disabled={false} feedback={null} />);
    const pairCount = () => container.querySelectorAll(".match-pair-number").length;

    // commit a pair, then take it back from the Chinese side
    fireEvent.click(screen.getByRole("button", { name: /^猫/ }));
    fireEvent.click(screen.getByRole("button", { name: "แมว" }));
    expect(pairCount()).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: /^猫/ }));
    expect(pairCount()).toBe(0);

    // commit again, then take it back from the Thai side
    fireEvent.click(screen.getByRole("button", { name: /^猫/ }));
    fireEvent.click(screen.getByRole("button", { name: "แมว" }));
    expect(pairCount()).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "แมว" }));
    expect(pairCount()).toBe(0);

    // and the released answer is free to use for a different word
    fireEvent.click(screen.getByRole("button", { name: /^狗/ }));
    fireEvent.click(screen.getByRole("button", { name: "แมว" }));
    fireEvent.click(screen.getByRole("button", { name: /^猫/ }));
    fireEvent.click(screen.getByRole("button", { name: "หมา" }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));
    expect(onSubmit).toHaveBeenCalledWith({ 狗: "แมว", 猫: "หมา" });
  });

  it("deselects an armed Chinese card when it is tapped again", () => {
    const missionView = { id: "matching-arm", leftCards: ["猫"], rightCards: ["แมว"] };
    const { container } = render(<MatchingMission missionView={missionView} onSubmit={vi.fn()} disabled={false} feedback={null} />);
    const left = screen.getByRole("button", { name: /^猫/ });

    fireEvent.click(left);
    expect(container.querySelector(".match-item")).toHaveClass("active");
    fireEvent.click(left);
    expect(container.querySelector(".match-item")).not.toHaveClass("active");
    // with nothing armed the answer column stays inert
    expect(screen.getByRole("button", { name: "แมว" })).toBeDisabled();
  });

  it("numbers each matched pair on both sides so the connection stays readable on phones", () => {
    const missionView = {
      id: "matching-pairs",
      leftCards: ["猫", "狗"],
      rightCards: ["แมว", "หมา"],
    };
    const { container } = render(<MatchingMission missionView={missionView} onSubmit={vi.fn()} disabled={false} feedback={null} />);

    fireEvent.click(screen.getByRole("button", { name: /^猫/ }));
    fireEvent.click(screen.getByRole("button", { name: "แมว" }));

    const badges = [...container.querySelectorAll(".match-pair-number")].map((node) => node.textContent);
    expect(badges).toEqual(["1", "1"]);
  });

  it("never places a correct pair on the same row for real matching missions", () => {
    levels
      .flatMap((level) => level.questions)
      .filter((mission) => mission.type === "matching")
      .forEach((mission) => {
        const leftCards = mission.beforeAnswer.leftCards;
        const rightCards = mission.beforeAnswer.rightCards;
        const leftOptions = shuffleWithSeed(leftCards, `${mission.id}:0:left`);
        const rightOptions = orderRightAvoidingAlignedPairs(leftOptions, leftCards, rightCards, `${mission.id}:0:right`);
        const rightByLeft = new Map(leftCards.map((left, index) => [left, rightCards[index]]));

        expect(rightOptions.every((right, index) => rightByLeft.get(leftOptions[index]) !== right)).toBe(true);
      });
  });
});

describe("ToneChoiceMission", () => {
  it("gives every tone option an accessible contour without marking correctness", () => {
    render(<ToneChoiceMission missionView={{
      id: "tone-1",
      title: "เลือกเสียงวรรณยุกต์",
      chineseText: "马",
      options: ["mā", "má", "mǎ", "mà"],
    }} onSubmit={vi.fn()} disabled={false} feedback={null} />);

    [1, 2, 3, 4].forEach((tone) => {
      expect(screen.getByRole("img", { name: `เส้นระดับเสียงวรรณยุกต์ ${tone}` })).toBeInTheDocument();
    });
    expect(document.querySelector(".correct, .wrong")).not.toBeInTheDocument();
  });
});

describe("AudioChoiceMission", () => {
  it("uses the parent playback lifecycle for speaking state and cleanup", () => {
    let lifecycle;
    const cleanupPlayback = vi.fn();
    const onPlayAudio = vi.fn((callbacks) => {
      lifecycle = callbacks;
      callbacks.onStart();
      return cleanupPlayback;
    });
    const { unmount } = render(<AudioChoiceMission missionView={{
      id: "audio-1",
      title: "ฟังเสียง",
      options: ["你好", "再见"],
      hasAudio: true,
    }} onSubmit={vi.fn()} onPlayAudio={onPlayAudio} disabled={false} feedback={null} />);

    const audioButton = screen.getByRole("button", { name: "ฟังเสียงภาษาจีน" });
    fireEvent.click(audioButton);
    expect(audioButton).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("status")).toHaveTextContent("กำลังเล่นเสียง");

    act(() => lifecycle.onEnd());
    expect(audioButton).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(audioButton);
    unmount();
    expect(cleanupPlayback).toHaveBeenCalledTimes(2);
  });

  it("cancels browser speech when the mission unmounts without parent cleanup", () => {
    const cancel = vi.fn();
    const previousSpeechSynthesis = window.speechSynthesis;
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: { speaking: true, cancel },
    });
    const { unmount } = render(<AudioChoiceMission missionView={{
      id: "audio-cleanup",
      title: "ฟังเสียง",
      options: ["你好", "再见"],
      hasAudio: true,
    }} onSubmit={vi.fn()} onPlayAudio={vi.fn()} disabled={false} feedback={null} />);

    fireEvent.click(screen.getByRole("button", { name: "ฟังเสียงภาษาจีน" }));
    unmount();

    expect(cancel).toHaveBeenCalledTimes(1);
    Object.defineProperty(window, "speechSynthesis", {
      configurable: true,
      value: previousSpeechSynthesis,
    });
  });
});

describe("SentenceOrderMission", () => {
  it("keeps safe Thai context visible and supports Undo, Clear, and Check", () => {
    const onSubmit = vi.fn();
    render(<SentenceOrderMission missionView={{
      id: "sentence-1",
      title: "เรียงประโยค",
      thaiMeaning: "ฉันชอบชา",
      options: ["我", "喜欢", "茶"],
    }} onSubmit={onSubmit} disabled={false} feedback={null} />);

    expect(screen.getByText("ฉันชอบชา")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "我" }));
    fireEvent.click(screen.getByRole("button", { name: "喜欢" }));
    fireEvent.click(screen.getByRole("button", { name: "ย้อนกลับ" }));
    fireEvent.click(screen.getByRole("button", { name: "喜欢" }));
    fireEvent.click(screen.getByRole("button", { name: "茶" }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจ" }));
    expect(onSubmit).toHaveBeenCalledWith(["我", "喜欢", "茶"]);

    fireEvent.click(screen.getByRole("button", { name: "ล้าง" }));
    expect(screen.getByText("แตะคำด้านล่างเพื่อเรียงประโยค")).toBeInTheDocument();
  });

  it("reads a word aloud on pick and removes just the tapped word from the placed sequence", () => {
    const onPlayAudio = vi.fn();
    render(<SentenceOrderMission missionView={{
      id: "sentence-2",
      title: "เรียงประโยค",
      thaiMeaning: "ฉันชอบชา",
      options: ["我", "喜欢", "茶"],
    }} onSubmit={vi.fn()} onPlayAudio={onPlayAudio} disabled={false} feedback={null} />);

    fireEvent.click(screen.getByRole("button", { name: "我" }));
    fireEvent.click(screen.getByRole("button", { name: "喜欢" }));
    fireEvent.click(screen.getByRole("button", { name: "茶" }));
    expect(onPlayAudio).toHaveBeenCalledWith({ text: "我" });
    expect(onPlayAudio).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole("button", { name: "เอา 喜欢 ออกจากช่องที่ 2" }));
    expect(screen.getByRole("button", { name: "喜欢" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "ตรวจ" }));
  });

  it("offers a slower playback speed alongside the normal one when listening first", () => {
    const onPlayAudio = vi.fn();
    render(<SentenceOrderMission missionView={{
      id: "sentence-3",
      title: "เรียงประโยค",
      listenFirst: true,
      hasAudio: true,
      options: ["我", "喝", "茶"],
    }} onSubmit={vi.fn()} onPlayAudio={onPlayAudio} disabled={false} feedback={null} />);

    fireEvent.click(screen.getByRole("button", { name: "ฟังเสียงประโยค" }));
    expect(onPlayAudio).toHaveBeenCalledWith();

    fireEvent.click(screen.getByRole("button", { name: "ฟังเสียงประโยคช้าๆ" }));
    expect(onPlayAudio).toHaveBeenCalledWith({ slow: true });
  });
});

describe("ShoppingMission", () => {
  it("shows a live basket count while emitting only selected item ids", () => {
    const onSubmit = vi.fn();
    const { container } = render(<ShoppingMission missionView={{
      id: "shopping-1",
      question: "เลือกของตามรายการ",
      items: [{ id: "苹果", label: "píngguǒ", emoji: "apple" }, { id: "茶", label: "chá", emoji: "tea" }],
    }} onSubmit={onSubmit} disabled={false} feedback={null} />);

    const basket = screen.getByRole("status", { name: "จำนวนสินค้าในตะกร้า" });
    expect(basket).toHaveTextContent("0");
    fireEvent.click(screen.getByRole("button", { name: /píngguǒ/ }));
    expect(basket).toHaveTextContent("1");
    expect(container).not.toHaveTextContent("apple =");
    fireEvent.click(screen.getByRole("button", { name: "ตรวจรายการ" }));
    expect(onSubmit).toHaveBeenCalledWith(["苹果"]);
  });

  it("shows the pinyin reading on each item card instead of the Chinese answer text", () => {
    const { container } = render(<ShoppingMission missionView={{
      id: "shopping-2",
      question: "เลือก 水 และ 茶 ให้แพนด้าเตรียมเสบียง",
      items: [{ id: "水", label: "shuǐ", emoji: "💧" }, { id: "茶", label: "chá", emoji: "🍵" }],
    }} onSubmit={vi.fn()} disabled={false} feedback={null} />);

    expect(screen.getByText("shuǐ")).toBeInTheDocument();
    expect(screen.getByText("chá")).toBeInTheDocument();
    expect(container.querySelector(".shop-item")).not.toHaveTextContent("水");
  });
});

describe("TranslationBlankMission", () => {
  const missionView = {
    id: "blank-1",
    title: "เติมคำแปลให้สมบูรณ์",
    fixedLang: "zh",
    fixedText: "我喜欢中国菜。",
    blankTemplate: "ฉันชอบ___",
    options: ["อาหารจีน", "น้ำ", "ชา"],
  };

  it("shows the fixed sentence whole and fills the blank from a picked chip", () => {
    const onSubmit = vi.fn();
    render(<TranslationBlankMission missionView={missionView} onSubmit={onSubmit} disabled={false} feedback={null} />);

    expect(screen.getByText("我喜欢中国菜。")).toBeInTheDocument();
    expect(screen.getByText("___")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "น้ำ" }));
    expect(screen.getByText("น้ำ", { selector: ".translation-blank-slot" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));
    expect(onSubmit).toHaveBeenCalledWith("น้ำ");
  });

  it("disables the check button until a chip is picked", () => {
    render(<TranslationBlankMission missionView={missionView} onSubmit={vi.fn()} disabled={false} feedback={null} />);
    expect(screen.getByRole("button", { name: "ตรวจคำตอบ" })).toBeDisabled();
  });
});

describe("TranslateSentenceMission", () => {
  const missionView = {
    id: "translate-1",
    title: "แปลประโยค",
    thaiMeaning: "ฉันรักแม่",
    options: ["我", "爱", "妈妈"],
  };

  it("submits the arranged chip order in chip mode", () => {
    const onSubmit = vi.fn();
    render(<TranslateSentenceMission missionView={missionView} onSubmit={onSubmit} disabled={false} feedback={null} />);

    fireEvent.click(screen.getByRole("button", { name: "我" }));
    fireEvent.click(screen.getByRole("button", { name: "爱" }));
    fireEvent.click(screen.getByRole("button", { name: "妈妈" }));
    fireEvent.click(screen.getByRole("button", { name: "ตรวจ" }));
    expect(onSubmit).toHaveBeenCalledWith(["我", "爱", "妈妈"]);
  });

  it("submits typed text once switched to keyboard mode", () => {
    const onSubmit = vi.fn();
    render(<TranslateSentenceMission missionView={missionView} onSubmit={onSubmit} disabled={false} feedback={null} />);

    fireEvent.click(screen.getByRole("button", { name: "พิมพ์คำตอบ" }));
    fireEvent.change(screen.getByLabelText("พิมพ์คำแปลภาษาจีน"), { target: { value: "我爱妈妈。" } });
    fireEvent.click(screen.getByRole("button", { name: "ตรวจ" }));
    expect(onSubmit).toHaveBeenCalledWith("我爱妈妈。");
  });
});
