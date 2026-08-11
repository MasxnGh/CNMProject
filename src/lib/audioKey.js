/**
 * Shared between the audio-generation script (Node) and the in-app player
 * (browser) so both compute the exact same filename from a pinyin string —
 * neither side has to hardcode or duplicate a lookup table.
 */
export function pinyinSlug(pinyin) {
  return pinyin
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z\s]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

export function vocabAudioSrc(vocabId) {
  return `/audio/${vocabId}.mp3`;
}

export function clockAudioSrc(clock) {
  return `/audio/clock_${pinyinSlug(clock.pinyin)}.mp3`;
}
