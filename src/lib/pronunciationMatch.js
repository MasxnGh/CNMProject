/**
 * dujeen-quest-gameplay-prompts.md Prompt D's "close" tier needs to show
 * *which* characters didn't match, not just an aggregate score.
 * utils/pronunciation.js's scorePronunciationOverlap already does this exact
 * character-removal matching internally but only returns the number - kept
 * as a small separate helper here (same technique, not touching that file,
 * which is shared with the old engine's PronunciationMission).
 */
const hasHanzi = (value) => typeof value === "string" && /\p{Script=Han}/u.test(value);
const hanziChars = (value) => (typeof value === "string" ? [...value].filter(hasHanzi) : []);

export const findMissingChars = (target, recognized) => {
  const targetChars = hanziChars(target);
  const remaining = hanziChars(recognized);
  return targetChars.filter((char) => {
    const index = remaining.indexOf(char);
    if (index < 0) return true;
    remaining.splice(index, 1);
    return false;
  });
};
