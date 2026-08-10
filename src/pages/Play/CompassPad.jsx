import { useState } from "react";
import DirectionPad from "../../components/ui/DirectionPad.jsx";

const sameVec = (a, b) => a.dx === b[0] && a.dy === b[1];

export default function CompassPad({ vector, locked, onResolve }) {
  const [chosen, setChosen] = useState(null);

  function handlePick(d, el) {
    if (locked || chosen) return;
    setChosen(d);
    onResolve(sameVec(d, vector), el.getBoundingClientRect());
  }

  function cellClass(d) {
    if (!chosen) return "";
    if (sameVec(d, vector)) return "good";
    if (d.dx === chosen.dx && d.dy === chosen.dy) return "bad";
    return "";
  }

  return <DirectionPad onPick={handlePick} cellClassName={cellClass} disabled={locked || !!chosen} />;
}
