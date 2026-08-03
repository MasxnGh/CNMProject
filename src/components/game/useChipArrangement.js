import { useMemo, useState } from "react";

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Drives a tray-of-chips -> row-of-slots arrangement. `slotCount` chips must
 * be placed to complete it; `chipIds` (correct + decoys) start shuffled in
 * the tray. Chips that return to the tray reappear at their original
 * shuffled position rather than jumping to the end.
 */
export function useChipArrangement(correctIds, decoyIds, slotCount) {
  const dedupeKey = `${correctIds.join(",")}|${(decoyIds || []).join(",")}`;
  const chipIds = useMemo(
    () => shuffle([...correctIds, ...(decoyIds || [])]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dedupeKey],
  );

  const [slots, setSlots] = useState(() => Array(slotCount).fill(null));

  const placedSet = new Set(slots.filter(Boolean));
  const tray = chipIds.filter((id) => !placedSet.has(id));
  const nextSlotIndex = slots.findIndex((s) => s === null);
  const isComplete = nextSlotIndex === -1;

  const placeChip = (chipId) => {
    if (nextSlotIndex === -1 || placedSet.has(chipId)) return;
    setSlots((prev) => {
      const idx = prev.findIndex((s) => s === null);
      if (idx === -1) return prev;
      const next = [...prev];
      next[idx] = chipId;
      return next;
    });
  };

  const returnChip = (slotIndex) => {
    setSlots((prev) => {
      if (!prev[slotIndex]) return prev;
      const next = [...prev];
      next[slotIndex] = null;
      return next;
    });
  };

  const removeLast = () => {
    setSlots((prev) => {
      for (let i = prev.length - 1; i >= 0; i -= 1) {
        if (prev[i]) {
          const next = [...prev];
          next[i] = null;
          return next;
        }
      }
      return prev;
    });
  };

  return { chipIds, slots, tray, nextSlotIndex, isComplete, placeChip, returnChip, removeLast };
}
