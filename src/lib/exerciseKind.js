// Two families of exercise: "select-then-check" (pick an answer, press a
// check button, see feedback) and "self-reporting" (the exercise component
// itself decides correct/quality once the player finishes and calls
// onResult directly - there's nothing to "check", so no check button).
export const SELF_REPORTING = ["write_character", "speak_aloud"];

export function isSelfReporting(type) {
  return SELF_REPORTING.includes(type);
}
