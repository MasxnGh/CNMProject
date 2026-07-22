import soundManager from "./soundManager";

let audioEnabled = true;

export const cancelSpeech = () => {
  if (typeof window !== "undefined") window.speechSynthesis?.cancel?.();
};

export const cancelPendingSound = () => {
  soundManager.cancelPending();
};

export const setAudioEnabled = (enabled) => {
  audioEnabled = Boolean(enabled);
  soundManager.setEnabled(audioEnabled);
  if (!audioEnabled) {
    cancelSpeech();
    cancelPendingSound();
  }
};

export const getAudioEnabled = () => audioEnabled;

export const canSpeakChinese = () =>
  typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;

export const speakChinese = (text, optionsOrUnsupported) => {
  const options = typeof optionsOrUnsupported === "function"
    ? { onUnsupported: optionsOrUnsupported }
    : (optionsOrUnsupported ?? {});

  if (!audioEnabled) {
    options.onUnsupported?.("ปิดเสียงอยู่");
    return false;
  }

  if (!canSpeakChinese()) {
    options.onUnsupported?.("เบราว์เซอร์นี้ไม่รองรับเสียงอ่าน");
    return false;
  }

  cancelSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "zh-CN";
  utterance.rate = 0.82;
  utterance.pitch = 1;

  let started = false;
  let finished = false;
  const notifyStart = () => {
    if (started || finished) return;
    started = true;
    options.onStart?.();
  };
  const notifyEnd = () => {
    if (finished) return;
    finished = true;
    options.onEnd?.();
  };
  const notifyError = (event) => {
    if (finished) return;
    finished = true;
    options.onError?.(event);
  };

  utterance.onstart = notifyStart;
  utterance.onend = notifyEnd;
  utterance.onerror = notifyError;
  window.speechSynthesis.speak(utterance);

  // Some browsers do not emit `onstart` until after a queued utterance has
  // begun. Notify immediately so the game can lock its audio button while it
  // is pending, then let the native event close the lifecycle.
  notifyStart();

  const hasLifecycle = options.onStart || options.onEnd || options.onError;
  if (!hasLifecycle) return true;

  return () => {
    utterance.onstart = null;
    utterance.onend = null;
    utterance.onerror = null;
    if (finished) return;
    finished = true;
    cancelSpeech();
  };
};

export const playCorrectSound = () => soundManager.play("correct");

export const playWrongSound = () => soundManager.play("wrong");

export const playWinSound = () => soundManager.play("win");
