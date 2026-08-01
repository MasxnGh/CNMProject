import { useMemo, useState } from "react";
import { playSfx, playWord } from "../../lib/audio.js";

/**
 * dujeen-quest-gameplay-prompts.md Prompt C - shared placement state behind
 * ChipTray/ChipSlots for all 3 word-order exercise types.
 *
 * poolChips: [{ id, hanzi, pinyin }] - every chip available to place,
 *   already shuffled by the caller (tray order stays fixed regardless of
 *   placement, so a removed chip flies back to the same spot it came from)
 * fixedSlots: optional { [index]: chip } for CompleteTranslation's
 *   already-there words - these slots are never empty and never editable
 */
export default function useChipArrangement(poolChips, slotCount, fixedSlots = {}) {
  const [placement, setPlacement] = useState(() => Array.from({ length: slotCount }, (_, index) => fixedSlots[index] ?? null));

  const placedIds = useMemo(() => new Set(placement.filter(Boolean).map((chip) => chip.id)), [placement]);
  const trayChips = poolChips.filter((chip) => !placedIds.has(chip.id));
  const nextEmptyIndex = placement.findIndex((chip, index) => !chip && !fixedSlots[index]);
  const isFull = nextEmptyIndex === -1;

  const place = (chip) => {
    if (nextEmptyIndex === -1) return;
    setPlacement((current) => {
      const next = [...current];
      next[nextEmptyIndex] = chip;
      return next;
    });
    playWord(chip.id);
    playSfx("tap");
  };

  const remove = (index) => {
    if (fixedSlots[index] || !placement[index]) return;
    setPlacement((current) => {
      const next = [...current];
      next[index] = null;
      return next;
    });
    playSfx("tap");
  };

  const removeLast = () => {
    for (let index = placement.length - 1; index >= 0; index -= 1) {
      if (placement[index] && !fixedSlots[index]) {
        remove(index);
        return;
      }
    }
  };

  return { placement, trayChips, place, remove, removeLast, isFull, nextEmptyIndex };
}
