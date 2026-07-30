import { afterEach, describe, expect, it, vi } from "vitest";
import { canRecognizeSpeech, listenForChinese, scorePronunciationOverlap } from "./pronunciation";

describe("scorePronunciationOverlap", () => {
  it("scores a perfect match as 1", () => {
    expect(scorePronunciationOverlap("你好", "你好")).toBe(1);
  });

  it("scores no overlap as 0", () => {
    expect(scorePronunciationOverlap("你好", "再见")).toBe(0);
  });

  it("gives partial credit for a partially-heard phrase", () => {
    const score = scorePronunciationOverlap("我要去北京", "我要去");
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it("ignores non-hanzi noise (pinyin/latin) in either string", () => {
    expect(scorePronunciationOverlap("你好 (nǐhǎo)", "你好")).toBe(1);
  });

  it("returns 0 when either side has no recognizable hanzi", () => {
    expect(scorePronunciationOverlap("你好", "")).toBe(0);
    expect(scorePronunciationOverlap("你好", "hello")).toBe(0);
    expect(scorePronunciationOverlap("", "你好")).toBe(0);
  });
});

describe("canRecognizeSpeech", () => {
  afterEach(() => {
    delete window.SpeechRecognition;
    delete window.webkitSpeechRecognition;
  });

  it("is false when neither constructor exists", () => {
    expect(canRecognizeSpeech()).toBe(false);
  });

  it("is true when SpeechRecognition exists", () => {
    window.SpeechRecognition = class {};
    expect(canRecognizeSpeech()).toBe(true);
  });

  it("is true when only the webkit-prefixed constructor exists", () => {
    window.webkitSpeechRecognition = class {};
    expect(canRecognizeSpeech()).toBe(true);
  });
});

describe("listenForChinese", () => {
  afterEach(() => {
    delete window.SpeechRecognition;
  });

  it("reports an error immediately when unsupported, without throwing", () => {
    const onError = vi.fn();
    const stop = listenForChinese({ onError });
    expect(onError).toHaveBeenCalledWith(expect.any(String));
    expect(() => stop()).not.toThrow();
  });

  it("starts recognition in Mandarin and forwards the transcript on result", () => {
    const start = vi.fn();
    let instance;
    window.SpeechRecognition = vi.fn(function MockRecognition() {
      instance = this;
      this.start = start;
    });

    const onResult = vi.fn();
    listenForChinese({ onResult });

    expect(instance.lang).toBe("zh-CN");
    expect(start).toHaveBeenCalled();

    instance.onresult({ results: [[{ transcript: "你好" }]] });
    expect(onResult).toHaveBeenCalledWith("你好");
  });

  it("forwards a recognition error", () => {
    let instance;
    window.SpeechRecognition = vi.fn(function MockRecognition() {
      instance = this;
      this.start = vi.fn();
    });

    const onError = vi.fn();
    listenForChinese({ onError });
    instance.onerror({ error: "not-allowed" });

    expect(onError).toHaveBeenCalledWith("not-allowed");
  });

  it("stop() before any result cancels without reporting an error", () => {
    let instance;
    window.SpeechRecognition = vi.fn(function MockRecognition() {
      instance = this;
      this.start = vi.fn();
      this.stop = vi.fn();
    });

    const onError = vi.fn();
    const stop = listenForChinese({ onError });
    stop();

    expect(instance.stop).toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
