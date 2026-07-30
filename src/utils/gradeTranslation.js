/**
 * Lenient text comparison for the "translate the whole sentence, or type it"
 * mission. Chip-arrange mode is graded exactly (array order matters, see
 * evaluateMission's sentenceOrder/translateSentence branch); this is only
 * for the free-text keyboard mode, where punctuation and whitespace
 * differences shouldn't fail an otherwise-correct sentence.
 */
const normalize = (text) =>
  String(text ?? "")
    .replace(/[。！？，、\s]/g, "")
    .trim();

export const isAcceptableTranslation = (candidate, correctText, acceptedAnswers = []) => {
  const normalizedCandidate = normalize(candidate);
  if (!normalizedCandidate) return false;
  const accepted = [correctText, ...acceptedAnswers].map(normalize);
  return accepted.includes(normalizedCandidate);
};
