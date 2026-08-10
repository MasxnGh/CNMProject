import ArrowIcon from "./ArrowIcon.jsx";
import "./DirectionPad.css";

const DIRS = [
  { dx: 0, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
];

/**
 * 3×3 grid, 4 arrow buttons around a center core — used by the compass
 * question kind and the maze mode's movement pad. `cellClassName(dir)` lets
 * the caller mark a button good/bad after a pick; `onPick(dir, buttonEl)`
 * fires on tap.
 */
export default function DirectionPad({ core = "?", onPick, cellClassName, disabled }) {
  return (
    <div className="cpad">
      <div className="sp" />
      <button
        type="button"
        className={cellClassName?.(DIRS[0]) || ""}
        disabled={disabled}
        onClick={(e) => onPick(DIRS[0], e.currentTarget)}
      >
        <ArrowIcon dx={DIRS[0].dx} dy={DIRS[0].dy} />
      </button>
      <div className="sp" />

      <button
        type="button"
        className={cellClassName?.(DIRS[1]) || ""}
        disabled={disabled}
        onClick={(e) => onPick(DIRS[1], e.currentTarget)}
      >
        <ArrowIcon dx={DIRS[1].dx} dy={DIRS[1].dy} />
      </button>
      <div className="core">{core}</div>
      <button
        type="button"
        className={cellClassName?.(DIRS[2]) || ""}
        disabled={disabled}
        onClick={(e) => onPick(DIRS[2], e.currentTarget)}
      >
        <ArrowIcon dx={DIRS[2].dx} dy={DIRS[2].dy} />
      </button>

      <div className="sp" />
      <button
        type="button"
        className={cellClassName?.(DIRS[3]) || ""}
        disabled={disabled}
        onClick={(e) => onPick(DIRS[3], e.currentTarget)}
      >
        <ArrowIcon dx={DIRS[3].dx} dy={DIRS[3].dy} />
      </button>
      <div className="sp" />
    </div>
  );
}
