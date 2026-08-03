// Pure classification for a finished write_character attempt - kept separate
// from WriteCharacter.jsx so it's testable without a real HanziWriter/DOM.
export function classifyWriteResult({ gaveUp, usedHint, totalMistakes, hardMistakeThreshold = 5 }) {
  if (gaveUp) return "again";
  if (usedHint || totalMistakes > hardMistakeThreshold) return "hard";
  return "good";
}
