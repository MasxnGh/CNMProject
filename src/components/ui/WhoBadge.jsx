import { useGame } from "../../state/GameContext.jsx";
import { AVA } from "../../lib/art.js";
import "./WhoBadge.css";

export default function WhoBadge() {
  const { player } = useGame();
  return (
    <div className="who">
      <span className="who-av" dangerouslySetInnerHTML={{ __html: AVA[player.avatar] || AVA.fox }} />
      {player.name || "ผู้เล่น"}
    </div>
  );
}
