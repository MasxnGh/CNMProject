import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cancelPendingSound,
  cancelSpeech,
  playCorrectSound,
  setAudioEnabled,
  speakChinese,
} from "./speech";

describe("speech cancellation", () => {
  let oscillator;
  let speechSynthesis;

  beforeEach(() => {
    vi.useFakeTimers();
    oscillator = {
      connect: vi.fn(),
      frequency: { value: 0 },
      start: vi.fn(),
      stop: vi.fn(),
      type: "sine",
    };
    const gain = {
      connect: vi.fn(),
      gain: { value: 0, exponentialRampToValueAtTime: vi.fn() },
    };
    window.AudioContext = vi.fn(function MockAudioContext() {
      return {
        createGain: vi.fn(() => gain),
        createOscillator: vi.fn(() => oscillator),
        currentTime: 0,
        destination: {},
      };
    });
    speechSynthesis = { cancel: vi.fn(), speak: vi.fn() };
    Object.defineProperty(window, "speechSynthesis", { configurable: true, value: speechSynthesis });
    vi.stubGlobal("SpeechSynthesisUtterance", class SpeechSynthesisUtterance {});
    setAudioEnabled(true);
  });

  afterEach(() => {
    cancelPendingSound();
    setAudioEnabled(true);
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete window.AudioContext;
    delete window.speechSynthesis;
  });

  it("cancels active speech synthesis", () => {
    expect(speakChinese("hello")).toBe(true);
    speechSynthesis.cancel.mockClear();

    cancelSpeech();

    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });

  it("exposes a real start/end lifecycle even while speech is still pending", () => {
    let utterance;
    speechSynthesis.speak.mockImplementation((nextUtterance) => {
      utterance = nextUtterance;
    });
    const onStart = vi.fn();
    const onEnd = vi.fn();

    const cleanup = speakChinese("你好", { onStart, onEnd });

    expect(typeof cleanup).toBe("function");
    expect(onStart).toHaveBeenCalledTimes(1);
    utterance.onstart?.();
    expect(onStart).toHaveBeenCalledTimes(1);

    utterance.onend?.();
    expect(onEnd).toHaveBeenCalledTimes(1);
    cleanup();
    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
  });

  it("clears the delayed success tone before it can play", () => {
    playCorrectSound();
    expect(oscillator.start).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(1);

    cancelPendingSound();
    vi.runAllTimers();

    expect(vi.getTimerCount()).toBe(0);
    expect(oscillator.start).toHaveBeenCalledTimes(1);
  });

  it("cancels speech and delayed tones when audio is disabled", () => {
    playCorrectSound();
    speakChinese("hello");
    speechSynthesis.cancel.mockClear();

    setAudioEnabled(false);
    vi.runAllTimers();

    expect(speechSynthesis.cancel).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(oscillator.start).toHaveBeenCalledTimes(1);
  });
});
