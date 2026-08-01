import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/speech.js", () => ({ speakChinese: vi.fn() }));
vi.mock("./sfx.js", () => ({ playSfxByName: vi.fn() }));

describe("lib/audio", () => {
  let instances;

  beforeEach(async () => {
    vi.resetModules();
    instances = [];
    class MockAudio {
      constructor(src) {
        this.src = src ?? "";
        this.playbackRate = 1;
        this.currentTime = 0;
        this.play = vi.fn(() => Promise.resolve());
        this.pause = vi.fn();
        instances.push(this);
      }
    }
    vi.stubGlobal("Audio", MockAudio);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("plays the vocab entry's mp3 at normal speed by default", async () => {
    const { playWord } = await import("./audio.js");
    playWord("v_shui");

    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe("/audio/v_shui.mp3");
    expect(instances[0].playbackRate).toBe(1);
    expect(instances[0].play).toHaveBeenCalledTimes(1);
  });

  it("lowers playbackRate instead of loading a second file when slow is requested", async () => {
    const { playWord } = await import("./audio.js");
    playWord("v_shui", { slow: true });

    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe("/audio/v_shui.mp3");
    expect(instances[0].playbackRate).toBeLessThan(1);
  });

  it("stops the previous clip before starting a new one", async () => {
    const { playWord } = await import("./audio.js");
    playWord("v_shui");
    playWord("v_cha");

    expect(instances[0].pause).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(2);
  });

  it("plays a sentence by id from the separate sentence lookup", async () => {
    const { playSentence } = await import("./audio.js");
    playSentence("s_ni_hao");

    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe("/audio/s_ni_hao.mp3");
  });

  it("falls back to Web Speech API and warns when playback is rejected", async () => {
    const { speakChinese } = await import("../utils/speech.js");
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    class RejectingAudio {
      constructor(src) {
        this.src = src ?? "";
        this.play = vi.fn(() => Promise.reject(new Error("blocked")));
        this.pause = vi.fn();
      }
    }
    vi.stubGlobal("Audio", RejectingAudio);

    const { playWord } = await import("./audio.js");
    playWord("v_shui");
    await Promise.resolve();
    await Promise.resolve();

    expect(speakChinese).toHaveBeenCalledWith("水");
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("warns and does nothing for an unknown id", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { playWord } = await import("./audio.js");
    playWord("v_does_not_exist");

    expect(instances).toHaveLength(0);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("v_does_not_exist"));
    warnSpy.mockRestore();
  });

  it("does not play while muted, and persists the mute flag", async () => {
    const { playWord, setMuted, isMuted } = await import("./audio.js");
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(window.localStorage.getItem("dujeen-quest-audio-muted")).toBe("1");

    playWord("v_shui");
    expect(instances).toHaveLength(0);
  });

  it("preloads every entry in a lesson and none from other lessons", async () => {
    const { preloadLesson } = await import("./audio.js");
    preloadLesson("ch1_l1");

    const preloaded = instances.filter((audio) => audio.preload === "auto");
    expect(preloaded.length).toBeGreaterThan(0);
    expect(preloaded.every((audio) => audio.src.startsWith("/audio/"))).toBe(true);
  });

  it("delegates playSfx to the sfx module by name", async () => {
    const { playSfxByName } = await import("./sfx.js");
    const { playSfx } = await import("./audio.js");
    playSfx("correct");

    expect(playSfxByName).toHaveBeenCalledWith("correct");
  });
});
