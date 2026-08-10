import { useState } from "react";
import ClockFace from "./ClockFace.jsx";

export default function ClockPad({ clock, options, locked, onResolve }) {
  const [chosenIdx, setChosenIdx] = useState(null);

  function handlePick(i, opt, el) {
    if (locked || chosenIdx !== null) return;
    setChosenIdx(i);
    onResolve(opt.hanzi === clock.hanzi, el.getBoundingClientRect());
  }

  return (
    <div className="clocks">
      {options.map((opt, i) => {
        let cls = "clk";
        if (chosenIdx !== null) {
          if (opt.hanzi === clock.hanzi) cls += " good";
          else if (i === chosenIdx) cls += " bad";
        }
        return (
          <button
            key={i}
            type="button"
            className={cls}
            disabled={locked || chosenIdx !== null}
            onClick={(e) => handlePick(i, opt, e.currentTarget)}
          >
            <ClockFace hour={opt.hour} minute={opt.minute} />
          </button>
        );
      })}
    </div>
  );
}
