import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button.jsx";
import Kite from "../../components/ui/Kite.jsx";
import { useGame } from "../../state/GameContext.jsx";
import { AVA, AVATAR_KEYS } from "../../lib/art.js";
import "./Name.css";

export default function Name() {
  const navigate = useNavigate();
  const { setPlayer } = useGame();
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("fox");

  function goNext() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setPlayer(trimmed, avatar);
    navigate("/setup");
  }

  return (
    <div className="gwrap">
      <div className="nameW">
        <div>
          <Kite c1="#6FA294" c2="#3F6D62" className="nameKite" />
          <div className="kk2">ก่อนเริ่ม</div>
          <h2 className="screenTitle">คุณชื่ออะไร</h2>
          <p className="screenSub">ชื่อนี้จะปรากฏบนกระดานคะแนน</p>

          <div className="nin">
            <input
              maxLength={14}
              placeholder="ใส่ชื่อผู้เล่น"
              autoComplete="off"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) goNext();
              }}
            />
          </div>

          <div className="avp">
            {AVATAR_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className={k === avatar ? "on" : ""}
                onClick={() => setAvatar(k)}
                dangerouslySetInnerHTML={{ __html: AVA[k] }}
              />
            ))}
          </div>

          <Button disabled={!name.trim()} onClick={goNext}>
            ไปต่อ
          </Button>
        </div>
      </div>
    </div>
  );
}
