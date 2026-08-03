// speak_aloud needs SpeechRecognition; where it's missing the exercise type
// must disappear from the pool silently (never render a broken mic button).
export function isSpeechRecognitionSupported() {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}
