import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("lib/sfx", () => {
  let created;
  let frequencies;

  beforeEach(() => {
    created = [];
    frequencies = [];
    class MockOscillator {
      constructor() {
        this.frequency = { setValueAtTime: (value) => frequencies.push(value) };
        this.connect = vi.fn();
        this.start = vi.fn();
        this.stop = vi.fn();
      }
    }
    class MockGain {
      constructor() {
        this.gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
        this.connect = vi.fn();
      }
    }
    class MockAudioContext {
      constructor() {
        this.currentTime = 0;
        this.state = "running";
        created.push(this);
      }
      createOscillator() {
        return new MockOscillator();
      }
      createGain() {
        return new MockGain();
      }
    }
    vi.stubGlobal("AudioContext", MockAudioContext);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("plays every one of the 7 named sounds without throwing", async () => {
    vi.doMock("./audio.js", () => ({ isMuted: () => false }));
    const { playSfxByName } = await import("./sfx.js");

    for (const name of ["tap", "correct", "wrong", "stamp", "unlock", "coin", "combo"]) {
      expect(() => playSfxByName(name)).not.toThrow();
    }
    expect(created).toHaveLength(1);
  });

  it("climbs pitch with a higher combo count", async () => {
    vi.doMock("./audio.js", () => ({ isMuted: () => false }));
    const { playSfxByName } = await import("./sfx.js");

    playSfxByName("combo", 1);
    const lowComboFreq = frequencies[0];
    frequencies.length = 0;
    playSfxByName("combo", 15);
    const highComboFreq = frequencies[0];

    expect(highComboFreq).toBeGreaterThan(lowComboFreq);
  });

  it("does nothing while muted", async () => {
    vi.doMock("./audio.js", () => ({ isMuted: () => true }));
    const { playSfxByName } = await import("./sfx.js");
    playSfxByName("tap");

    expect(created).toHaveLength(0);
  });

  it("ignores an unknown sound name", async () => {
    vi.doMock("./audio.js", () => ({ isMuted: () => false }));
    const { playSfxByName } = await import("./sfx.js");

    expect(() => playSfxByName("not-a-real-sound")).not.toThrow();
  });
});
