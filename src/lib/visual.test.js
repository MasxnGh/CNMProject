import { describe, expect, it } from "vitest";
import { resolveVisual } from "./visual.js";

describe("lib/visual", () => {
  it("prefers an image when the entry has one", () => {
    const entry = { hanzi: "水", visual: { type: "image", value: "/img/water.png" } };
    expect(resolveVisual(entry)).toEqual({ kind: "image", value: "/img/water.png" });
  });

  it("falls back to emoji when there is no image", () => {
    const entry = { hanzi: "水", visual: { type: "emoji", value: "💧" } };
    expect(resolveVisual(entry)).toEqual({ kind: "emoji", value: "💧" });
  });

  it("falls back to the hanzi itself when neither image nor emoji is set", () => {
    const entry = { hanzi: "水", visual: { type: null, value: null } };
    expect(resolveVisual(entry)).toEqual({ kind: "hanzi", value: "水" });
  });

  it("falls back to the hanzi when visual is missing entirely", () => {
    expect(resolveVisual({ hanzi: "水" })).toEqual({ kind: "hanzi", value: "水" });
  });

  it("ignores a declared type with an empty value", () => {
    const entry = { hanzi: "水", visual: { type: "image", value: "" } };
    expect(resolveVisual(entry)).toEqual({ kind: "hanzi", value: "水" });
  });
});
