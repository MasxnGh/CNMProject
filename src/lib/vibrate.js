const reduceMotion = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Fires a haptic pulse on supported devices; silently does nothing otherwise. */
export function vibrate(pattern) {
  if (typeof navigator === "undefined" || !navigator.vibrate) return;
  if (reduceMotion()) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // best-effort only
  }
}
