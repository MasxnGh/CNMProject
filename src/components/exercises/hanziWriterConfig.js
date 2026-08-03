import { loadCharData } from "./hanziData.js";

export function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function prefersReducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Shared HanziWriter constructor options - colors/sizes stay consistent
// between graded write_character exercises and the free-write practice page.
// `guided` toggles the faint background outline (the "tracing guide").
export function buildWriterOptions({ size, guided = true, onLoadCharDataError } = {}) {
  return {
    width: size,
    height: size,
    padding: 12,
    showCharacter: false,
    showOutline: guided,
    strokeColor: cssVar("--paper"),
    outlineColor: "rgba(124, 136, 174, 0.18)",
    drawingColor: cssVar("--lantern"),
    highlightColor: cssVar("--jade"),
    drawingWidth: 12,
    strokeWidth: 8,
    outlineWidth: 2,
    charDataLoader: (char) => loadCharData(char),
    onLoadCharDataError,
  };
}
