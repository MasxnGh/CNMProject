export function hapticCorrect() {
  if (navigator.vibrate) navigator.vibrate(30);
}

export function hapticWrong() {
  if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
}
