import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../utils/speech.js", () => ({ speakChinese: vi.fn() }));

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
    const { play } = await import("./audio.js");
    play("v_shui");

    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe("/audio/v_shui.mp3");
    expect(instances[0].playbackRate).toBe(1);
    expect(instances[0].play).toHaveBeenCalledTimes(1);
  });

  it("lowers playbackRate instead of loading a second file when slow is requested", async () => {
    const { play } = await import("./audio.js");
    play("v_shui", { slow: true });

    expect(instances).toHaveLength(1);
    expect(instances[0].src).toBe("/audio/v_shui.mp3");
    expect(instances[0].playbackRate).toBeLessThan(1);
  });

  it("stops the previous clip before starting a new one", async () => {
    const { play } = await import("./audio.js");
    play("v_shui");
    play("v_cha");

    expect(instances[0].pause).toHaveBeenCalledTimes(1);
    expect(instances).toHaveLength(2);
  });

  it("falls back to Web Speech API when playback is rejected", async () => {
    const { speakChinese } = await import("../utils/speech.js");
    class RejectingAudio {
      constructor(src) {
        this.src = src ?? "";
        this.play = vi.fn(() => Promise.reject(new Error("blocked")));
        this.pause = vi.fn();
      }
    }
    vi.stubGlobal("Audio", RejectingAudio);

    const { play } = await import("./audio.js");
    play("v_shui");
    await Promise.resolve();
    await Promise.resolve();

    expect(speakChinese).toHaveBeenCalledWith("水");
  });

  it("does nothing for an unknown id", async () => {
    const { play } = await import("./audio.js");
    play("v_does_not_exist");

    expect(instances).toHaveLength(0);
  });

  it("does not play while muted, and persists the mute flag", async () => {
    const { play, setMuted, isMuted } = await import("./audio.js");
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(window.localStorage.getItem("dujeen-quest-audio-muted")).toBe("1");

    play("v_shui");
    expect(instances).toHaveLength(0);
  });

  it("preloads every entry in a lesson and none from other lessons", async () => {
    const { preloadLesson } = await import("./audio.js");
    preloadLesson("ch1_l1");

    const preloaded = instances.filter((audio) => audio.preload === "auto");
    expect(preloaded.length).toBeGreaterThan(0);
    expect(preloaded.every((audio) => audio.src.startsWith("/audio/"))).toBe(true);
  });
});
