import { useMemo, useState } from "react";
import Button from "../../components/ui/Button.jsx";
import { shuffle } from "../../lib/question.js";

export default function OrderPad({ sequence, locked, onResolve }) {
  const shuffled = useMemo(
    () => shuffle(sequence.items.map((item, correctIndex) => ({ item, correctIndex }))),
    [sequence],
  );
  const [placed, setPlaced] = useState(() => sequence.items.map(() => null)); // shuffled-index per slot, or null
  const [checked, setChecked] = useState(false);
  const [results, setResults] = useState(null); // bool per slot, after check

  const allFilled = placed.every((v) => v !== null);

  function placeChip(shuffledIdx) {
    if (locked || checked || placed.includes(shuffledIdx)) return;
    const emptySlot = placed.indexOf(null);
    if (emptySlot < 0) return;
    const next = [...placed];
    next[emptySlot] = shuffledIdx;
    setPlaced(next);
  }

  function removeFromSlot(slotIdx) {
    if (locked || checked || placed[slotIdx] === null) return;
    // drop the chip, then shift everything after it up so no gap opens mid-row
    const next = [...placed];
    next.splice(slotIdx, 1);
    next.push(null);
    setPlaced(next);
  }

  function handleCheck(e) {
    if (!allFilled || checked) return;
    const res = placed.map((shuffledIdx, slotIdx) => shuffled[shuffledIdx].correctIndex === slotIdx);
    setResults(res);
    setChecked(true);
    onResolve(res.every(Boolean), e.currentTarget.getBoundingClientRect());
  }

  return (
    <div className="orderPad">
      <div className="seqSlots">
        {placed.map((shuffledIdx, slotIdx) => {
          let cls = "seqSlot";
          if (shuffledIdx !== null) cls += " f";
          if (results) cls += results[slotIdx] ? " right" : " wrongS";
          return (
            <button key={slotIdx} type="button" className={cls} disabled={checked} onClick={() => removeFromSlot(slotIdx)}>
              {shuffledIdx !== null && (
                <>
                  <span className="sv zh">{shuffled[shuffledIdx].item.hanzi}</span>
                  {!checked && <span className="sx">×</span>}
                </>
              )}
            </button>
          );
        })}
      </div>
      <div className="seqHint">แตะคำเพื่อวางลงช่อง แตะช่องอีกครั้งเพื่อเอาออก</div>
      <div className="seqPool">
        {shuffled.map((s, i) => (
          <button
            key={i}
            type="button"
            className={`seqChip${placed.includes(i) ? " used" : ""}`}
            disabled={checked}
            onClick={() => placeChip(i)}
          >
            <div className="z zh">{s.item.hanzi}</div>
            <div className="t">{s.item.thai}</div>
          </button>
        ))}
      </div>
      <Button block disabled={!allFilled || checked} pulse={allFilled && !checked} onClick={handleCheck}>
        ตรวจคำตอบ
      </Button>
    </div>
  );
}
