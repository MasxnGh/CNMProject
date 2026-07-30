import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import PronunciationMission from "./PronunciationMission";

const missionView = {
  id: "6-4",
  type: "pronunciation",
  chineseText: "好吃",
  promptPinyin: "hǎochī",
  thaiMeaning: "อร่อย",
};

afterEach(() => {
  cleanup();
  delete window.SpeechRecognition;
});

describe("PronunciationMission", () => {
  it("falls back to a self-report submit when the browser has no SpeechRecognition", () => {
    const onSubmit = vi.fn();
    render(<PronunciationMission missionView={missionView} onSubmit={onSubmit} disabled={false} />);

    expect(screen.getByText(/ไม่รองรับการฟังเสียงพูด/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ฉันพูดแล้ว" }));

    expect(onSubmit).toHaveBeenCalledWith({
      type: "pronunciation",
      attempted: true,
      selfReported: true,
      recognized: null,
      overlapScore: null,
    });
  });

  it("listens in Mandarin, scores the transcript against the target, and submits on confirm", () => {
    let instance;
    window.SpeechRecognition = vi.fn(function MockRecognition() {
      instance = this;
      this.start = vi.fn();
    });

    const onSubmit = vi.fn();
    render(<PronunciationMission missionView={missionView} onSubmit={onSubmit} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "กดเพื่อพูด" }));
    expect(instance.lang).toBe("zh-CN");
    expect(instance.start).toHaveBeenCalled();

    act(() => instance.onresult({ results: [[{ transcript: "好吃" }]] }));
    expect(screen.getByText(/ระบบได้ยินว่า/)).toHaveTextContent("好吃");

    fireEvent.click(screen.getByRole("button", { name: "ตรวจคำตอบ" }));
    expect(onSubmit).toHaveBeenCalledWith({
      type: "pronunciation",
      attempted: true,
      selfReported: false,
      recognized: "好吃",
      overlapScore: 1,
    });
  });

  it("offers a self-report escape hatch when recognition errors out (e.g. mic denied)", () => {
    let instance;
    window.SpeechRecognition = vi.fn(function MockRecognition() {
      instance = this;
      this.start = vi.fn();
    });

    const onSubmit = vi.fn();
    render(<PronunciationMission missionView={missionView} onSubmit={onSubmit} disabled={false} />);

    fireEvent.click(screen.getByRole("button", { name: "กดเพื่อพูด" }));
    act(() => instance.onerror({ error: "not-allowed" }));

    expect(screen.getByText("not-allowed")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "ฉันพูดแล้ว" }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ selfReported: true }));
  });

  it("plays the reference audio through onPlayAudio", () => {
    const onPlayAudio = vi.fn();
    render(<PronunciationMission missionView={missionView} onSubmit={vi.fn()} disabled={false} onPlayAudio={onPlayAudio} />);

    fireEvent.click(screen.getByRole("button", { name: "ฟังเสียงต้นฉบับ" }));
    expect(onPlayAudio).toHaveBeenCalled();
  });
});
