import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import GamePage from "./GamePage";

globalThis.React = React;

vi.mock("framer-motion", async () => {
  const ReactModule = await import("react");
  const animationProps = new Set(["animate", "exit", "initial", "layout", "transition", "whileHover", "whileTap"]);
  const components = new Map();
  const motion = new Proxy({}, {
    get: (_, tag) => {
      if (!components.has(tag)) {
        components.set(tag, ReactModule.forwardRef(({ children, ...props }, ref) => {
          const domProps = Object.fromEntries(Object.entries(props).filter(([key]) => !animationProps.has(key)));
          return ReactModule.createElement(tag, { ...domProps, ref }, children);
        }));
      }
      return components.get(tag);
    },
  });
  return {
    AnimatePresence: ({ children }) => ReactModule.createElement(ReactModule.Fragment, null, children),
    motion,
    useReducedMotion: () => false,
  };
});

vi.mock("../utils/speech", () => ({
  playCorrectSound: vi.fn(),
  playWrongSound: vi.fn(),
  speakChinese: vi.fn(() => true),
  cancelPendingSound: vi.fn(),
  cancelSpeech: vi.fn(),
}));

const sentenceLevel = {
  id: 30,
  title: "Sentence Test",
  location: "Test Location",
  topic: "Sentence order",
  description: "Build a sentence",
  backgroundTheme: "market",
  questions: [{
    id: "30-1",
    type: "sentenceOrder",
    beforeAnswer: {
      title: "Build the sentence",
      instruction: "Choose the words in order",
      question: "I drink tea",
      options: ["wo", "he", "cha"],
    },
    answer: {
      correctSequence: ["wo", "he", "cha"],
      correctAnswer: ["wo", "he", "cha"],
    },
    afterAnswer: { explanation: "Correct sentence order" },
    hint: "Start with the subject",
  }],
};

const progress = {
  level: 2,
  xp: 120,
  coins: 0,
  totalStars: 0,
  completedLevels: [],
};

describe("GamePage non-choice keyboard integration", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("continues feedback from the real disabled Sentence check control", async () => {
    const onFinish = vi.fn();
    const { container } = render(
      <GamePage
        level={sentenceLevel}
        progress={progress}
        onFinish={onFinish}
        onMap={vi.fn()}
        skipMissionIntro
      />,
    );

    ["wo", "he", "cha"].forEach((word) => {
      fireEvent.click(screen.getByRole("button", { name: word }));
    });

    const checkButton = container.querySelector("button.game-button.primary");
    expect(checkButton).toBeEnabled();
    checkButton.focus();
    fireEvent.click(checkButton);

    expect(checkButton).toBeDisabled();
    expect(checkButton).toHaveFocus();
    expect(screen.getByRole("button", { name: "ไปต่อ" })).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Enter" });

    await waitFor(() => expect(onFinish).toHaveBeenCalledTimes(1));
  });
});
