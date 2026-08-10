import WhoBadge from "./WhoBadge.jsx";
import "./GameNav.css";

/** Sticky top bar shared by every in-game screen: back, hanzi title, who-am-I, optional right slot. */
export default function GameNav({ zh, th, onBack, right }) {
  return (
    <nav className="gbar">
      <button type="button" className="ico" onClick={onBack}>
        ‹
      </button>
      <div className="tt">
        <div className="tz">{zh}</div>
        <div className="tn">{th}</div>
      </div>
      <WhoBadge />
      {right}
    </nav>
  );
}
