const hasHanzi = (value) => typeof value === "string" && /\p{Script=Han}/u.test(value);

const hanziChars = (value) => (typeof value === "string" ? [...value].filter(hasHanzi) : []);

/**
 * Character-overlap scoring, not phoneme-level - there is no speech-scoring
 * backend, so this is a best-effort proxy: how many of the target characters
 * turned up (in any order, repeats counted) in what the browser recognized.
 * Dice coefficient keeps a short mis-hearing of a long phrase from scoring 0.
 */
export const scorePronunciationOverlap = (target, recognized) => {
  const targetChars = hanziChars(target);
  const recognizedChars = hanziChars(recognized);
  if (targetChars.length === 0 || recognizedChars.length === 0) return 0;

  const remaining = [...recognizedChars];
  const matched = targetChars.filter((char) => {
    const index = remaining.indexOf(char);
    if (index < 0) return false;
    remaining.splice(index, 1);
    return true;
  }).length;

  return (2 * matched) / (targetChars.length + recognizedChars.length);
};

const speechRecognitionCtor = () =>
  (typeof window === "undefined" ? undefined : window.SpeechRecognition ?? window.webkitSpeechRecognition);

export const canRecognizeSpeech = () => Boolean(speechRecognitionCtor());

/**
 * Starts listening for a single Mandarin utterance. Returns a stop function;
 * calling it before a result arrives cancels listening without reporting an
 * error. Never throws - unsupported browsers report through `onError` so the
 * mission can fall back to the self-report path instead of getting stuck.
 */
export const listenForChinese = ({ onResult, onError, onEnd } = {}) => {
  const Recognition = speechRecognitionCtor();
  if (!Recognition) {
    onError?.("เบราว์เซอร์นี้ไม่รองรับการฟังเสียงพูด");
    return () => {};
  }

  const recognition = new Recognition();
  recognition.lang = "zh-CN";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  let settled = false;
  recognition.onresult = (event) => {
    settled = true;
    onResult?.(event.results?.[0]?.[0]?.transcript ?? "");
  };
  recognition.onerror = (event) => {
    if (settled) return;
    settled = true;
    onError?.(event?.error ?? "ไม่สามารถฟังเสียงพูดได้");
  };
  recognition.onend = () => onEnd?.();

  try {
    recognition.start();
  } catch {
    settled = true;
    onError?.("ไม่สามารถเริ่มฟังเสียงพูดได้");
  }

  return () => {
    if (settled) return;
    settled = true;
    recognition.stop();
  };
};
