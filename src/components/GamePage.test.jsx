import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cancelPendingSound, cancelSpeech, speakChinese } from "../utils/speech";
import GamePage from "./GamePage";

let latestRendererProps;
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

vi.mock("./QuestionRenderer", async () => {
  const ReactModule = await import("react");
  return {
    default: (props) => {
      latestRendererProps = props;
      return ReactModule.createElement(
        "div",
        { "data-testid": "renderer", "data-view": JSON.stringify(props.missionView) },
        ReactModule.createElement("button", {
          className: "answer-button",
          disabled: props.disabled,
          onClick: () => props.onSubmit?.("correct-candidate"),
        }, "Correct candidate"),
        ReactModule.createElement("button", {
          className: "answer-button",
          disabled: props.disabled,
          onClick: () => props.onSubmit?.("wrong-candidate"),
        }, "Wrong candidate"),
        ReactModule.createElement("button", {
          className: "sound-button",
          disabled: props.disabled,
          onClick: () => props.onPlayAudio?.(),
        }, "Play audio"),
      );
    },
  };
});

const level = {
  id: 4,
  title: "Test Level",
  location: "Test Location",
  topic: "Test Topic",
  description: "Safe level summary",
  backgroundTheme: "market",
  questions: [{
    id: "4-1",
    type: "multipleChoice",
    beforeAnswer: {
      title: "Choice mission",
      instruction: "Choose one",
      question: "LEAKED PROMPT SAMPLE",
      options: ["correct-candidate", "wrong-candidate"],
    },
    answer: { correctAnswer: "correct-candidate", secret: "ANSWER_SECRET" },
    afterAnswer: {
      chineseText: "Reveal text",
      pinyin: "reveal pinyin",
      thaiMeaning: "reveal translation",
      explanation: "Reveal explanation",
    },
    hint: "Safe hint",
    audioText: "parent-only transcript",
  }],
};

const progress = {
  level: 2,
  xp: 120,
  coins: 0,
  totalStars: 0,
  completedLevels: [],
};

const renderGame = (overrides = {}) => {
  const props = {
    level,
    progress,
    onFinish: vi.fn(),
    onMap: vi.fn(),
    soundOn: true,
    reducedMotion: false,
    skipMissionIntro: false,
    onToggleSound: vi.fn(),
    onToggleReducedMotion: vi.fn(),
    onToggleSkipIntro: vi.fn(),
    ...overrides,
  };
  return {
    ...render(
      <>
        <button type="button">Global control</button>
        <GamePage {...props} />
      </>,
    ),
    props,
  };
};

describe("GamePage safe session integration", () => {
  beforeEach(() => {
    latestRendererProps = undefined;
    vi.clearAllMocks();
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("shows a metadata-only mission intro, scrolls to top, and restores focus", () => {
    const { container } = renderGame();

    expect(screen.getByRole("heading", { name: "Test Level" })).toBeInTheDocument();
    expect(screen.getByText("Safe level summary")).toBeInTheDocument();
    expect(screen.getByText("ตัวเลือกหลายข้อ")).toBeInTheDocument();
    expect(container).not.toHaveTextContent("LEAKED PROMPT SAMPLE");
    expect(container).not.toHaveTextContent("ANSWER_SECRET");
    expect(screen.queryByTestId("renderer")).not.toBeInTheDocument();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(container.querySelector("section")).toHaveFocus();
  });

  it("passes only missionView, evaluates in the parent, locks feedback, and finishes explicitly", async () => {
    const { props } = renderGame();
    fireEvent.click(screen.getByRole("button", { name: "เริ่มเล่นเลย" }));

    const serializedView = screen.getByTestId("renderer").getAttribute("data-view");
    expect(serializedView).toContain("LEAKED PROMPT SAMPLE");
    expect(serializedView).not.toContain("ANSWER_SECRET");
    expect(serializedView).not.toContain("correctAnswer");
    expect(latestRendererProps).not.toHaveProperty("mission");

    fireEvent.click(screen.getByRole("button", { name: "Correct candidate" }));

    expect(latestRendererProps.disabled).toBe(true);
    expect(latestRendererProps.feedback).toEqual(expect.objectContaining({
      correct: true,
      selectedValue: "correct-candidate",
      correctOption: "correct-candidate",
    }));
    fireEvent.click(screen.getByRole("button", { name: "Correct candidate" }));
    expect(screen.getByText("คะแนน 20")).toBeInTheDocument();
    expect(props.onFinish).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "ไปต่อ" }));
    await waitFor(() => expect(props.onFinish).toHaveBeenCalledWith(level, 1, {
      hintsUsed: 0,
      score: 20,
      wrongMissionIds: [],
      attemptedCount: 1,
    }));
  });

  it("uses Escape for pause/resume and exposes persisted pause settings", () => {
    const { props } = renderGame();
    fireEvent.click(screen.getByRole("button", { name: "เริ่มเล่นเลย" }));

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("dialog", { name: "หยุดเกมชั่วคราว" })).toBeInTheDocument();
    expect(latestRendererProps.disabled).toBe(true);
    expect(screen.getByTestId("game-background")).toHaveAttribute("inert");

    const resumeButton = screen.getByRole("button", { name: "เล่นต่อ" });
    const pauseMapButton = screen.getByRole("button", { name: "กลับแผนที่" });
    expect(resumeButton).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
    expect(pauseMapButton).toHaveFocus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(resumeButton).toHaveFocus();

    screen.getByRole("button", { name: "Global control" }).focus();
    fireEvent.keyDown(document, { key: "Tab" });
    expect(resumeButton).toHaveFocus();

    fireEvent.click(screen.getByRole("button", { name: "ปิดเสียง" }));
    fireEvent.click(screen.getByRole("button", { name: "เปิดลดการเคลื่อนไหว" }));
    expect(props.onToggleSound).toHaveBeenCalledTimes(1);
    expect(props.onToggleReducedMotion).toHaveBeenCalledTimes(1);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "หยุดเกมชั่วคราว" })).not.toBeInTheDocument();
    expect(latestRendererProps.disabled).toBe(false);
  });

  it("groups mission status controls for compact assistive-technology navigation", () => {
    renderGame({ skipMissionIntro: true });

    expect(screen.getByRole("group", { name: "Mission status" })).toHaveTextContent("คะแนน 0");
    expect(screen.getByRole("group", { name: "Mission actions" })).toHaveTextContent("คำใบ้ 2/2");
    expect(screen.getByRole("button", { name: "ปิดเสียง" })).toBeInTheDocument();
  });

  it("supports numeric shortcuts against the real answer-button shape", () => {
    const { props } = renderGame({ skipMissionIntro: true });

    fireEvent.keyDown(window, { key: " " });
    expect(speakChinese).toHaveBeenCalledWith("parent-only transcript", expect.objectContaining({
      onUnsupported: expect.any(Function),
    }));

    fireEvent.keyDown(window, { key: "1" });
    expect(latestRendererProps.feedback.correct).toBe(true);
    expect(props.onFinish).not.toHaveBeenCalled();
  });

  it("continues feedback with Enter while focus remains on the disabled submitted answer", async () => {
    vi.useFakeTimers();
    const { props } = renderGame({ skipMissionIntro: true });

    const submittedAnswer = screen.getByRole("button", { name: "Correct candidate" });
    submittedAnswer.focus();
    fireEvent.click(submittedAnswer);
    expect(submittedAnswer).toBeDisabled();
    expect(submittedAnswer).toHaveFocus();
    fireEvent.keyDown(window, { key: "Enter" });
    await vi.runAllTimersAsync();
    expect(props.onFinish).toHaveBeenCalledTimes(1);
  });

  it("does not hijack feedback Enter from an enabled unrelated interactive control", () => {
    const { props } = renderGame({ skipMissionIntro: true });
    fireEvent.click(screen.getByRole("button", { name: "Correct candidate" }));
    const globalControl = screen.getByRole("button", { name: "Global control" });
    globalControl.focus();

    fireEvent.keyDown(window, { key: "Enter" });

    expect(latestRendererProps.feedback.correct).toBe(true);
    expect(props.onFinish).not.toHaveBeenCalled();
  });

  it("cancels speech and delayed sounds across session interruption boundaries", () => {
    const { props, rerender, unmount } = renderGame({ skipMissionIntro: true });

    fireEvent.keyDown(window, { key: "Escape" });
    expect(cancelSpeech).toHaveBeenCalledTimes(1);
    expect(cancelPendingSound).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "เริ่มด่านใหม่" }));
    expect(cancelSpeech).toHaveBeenCalledTimes(2);
    expect(cancelPendingSound).toHaveBeenCalledTimes(2);

    rerender(
      <>
        <button type="button">Global control</button>
        <GamePage {...props} soundOn={false} />
      </>,
    );
    expect(cancelSpeech).toHaveBeenCalledTimes(3);
    expect(cancelPendingSound).toHaveBeenCalledTimes(3);

    fireEvent.click(screen.getByRole("button", { name: "กลับแผนที่" }));
    fireEvent.click(screen.getByRole("button", { name: "ออกจากภารกิจ" }));
    expect(cancelSpeech).toHaveBeenCalledTimes(4);
    expect(cancelPendingSound).toHaveBeenCalledTimes(4);
    expect(props.onMap).toHaveBeenCalledTimes(1);

    unmount();
    expect(cancelSpeech).toHaveBeenCalledTimes(5);
    expect(cancelPendingSound).toHaveBeenCalledTimes(5);
  });

  it("restores Continue focus after resuming feedback", () => {
    renderGame({ skipMissionIntro: true });
    const submittedAnswer = screen.getByRole("button", { name: "Correct candidate" });
    submittedAnswer.focus();
    fireEvent.click(submittedAnswer);

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.getByRole("button", { name: "ไปต่อ" })).toHaveFocus();
  });

  it("does not report a finished old session against a newly rerendered level", async () => {
    const { props, rerender } = renderGame({ skipMissionIntro: true });
    fireEvent.click(screen.getByRole("button", { name: "Correct candidate" }));
    fireEvent.click(screen.getByRole("button", { name: "ไปต่อ" }));
    await waitFor(() => expect(props.onFinish).toHaveBeenCalledTimes(1));

    const nextLevel = {
      ...level,
      id: 5,
      title: "Next Level",
      questions: level.questions.map((mission) => ({ ...mission, id: "5-1", levelId: 5 })),
    };
    rerender(
      <>
        <button type="button">Global control</button>
        <GamePage {...props} level={nextLevel} />
      </>,
    );

    await waitFor(() => expect(screen.getByRole("heading", { name: "Next Level" })).toBeInTheDocument());
    expect(props.onFinish).toHaveBeenCalledTimes(1);
    expect(props.onFinish).not.toHaveBeenCalledWith(nextLevel, expect.anything(), expect.anything());
  });

  it("restarts without a stale scheduled advancement", () => {
    vi.useFakeTimers();
    const { props } = renderGame({ skipMissionIntro: true });

    fireEvent.keyDown(window, { key: "1" });

    fireEvent.keyDown(window, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "เริ่มด่านใหม่" }));
    expect(latestRendererProps.feedback).toBeNull();
    expect(latestRendererProps.disabled).toBe(false);

    vi.runAllTimers();
    expect(props.onFinish).not.toHaveBeenCalled();

  });

  it("cleans pending transitions before map navigation", () => {
    vi.useFakeTimers();
    const { props } = renderGame({ skipMissionIntro: true });

    fireEvent.click(screen.getByRole("button", { name: "Correct candidate" }));
    fireEvent.click(screen.getByRole("button", { name: "กลับแผนที่" }));
    fireEvent.click(screen.getByRole("button", { name: "ออกจากภารกิจ" }));
    vi.runAllTimers();

    expect(props.onMap).toHaveBeenCalledTimes(1);
    expect(props.onFinish).not.toHaveBeenCalled();
  });
});
