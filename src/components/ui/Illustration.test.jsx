import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import Illustration from "./Illustration.jsx";

afterEach(() => cleanup());

describe("Illustration sizing", () => {
  it("sets the circle's own font-size from the size prop, at every layer's size", () => {
    for (const size of [42, 66, 80, 130]) {
      const { container } = render(<Illustration vocabKey="🚶" category="verb" char="走" size={size} alt="走" />);
      const host = container.querySelector(".illus");
      expect(host.style.fontSize).toBe(`${size}px`);
    }
  });

  it("never falls back to a %-based font-size that would size against the parent instead of the circle", () => {
    const cssPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "Illustration.css");
    const css = readFileSync(cssPath, "utf8");
    expect(css).not.toMatch(/font-size:\s*\d+%/);
  });

  it("shrinks photos below 100% so a square subject's corners stay inside the circular mask", () => {
    const cssPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "Illustration.css");
    const css = readFileSync(cssPath, "utf8");
    const imgRuleMatch = css.match(/\.illus-img\s*\{([^}]*)\}/);
    expect(imgRuleMatch).toBeTruthy();
    const widthMatch = imgRuleMatch[1].match(/width:\s*(\d+)%/);
    expect(widthMatch).toBeTruthy();
    const widthPct = Number(widthMatch[1]);
    // subject fills 80% of its source frame (see scripts/import-photos.mjs FILL);
    // max square inscribed in a circle is 1/sqrt(2) ≈ 70.7% of the circle's diameter
    expect(0.8 * (widthPct / 100)).toBeLessThanOrEqual(1 / Math.SQRT2);
  });
});
