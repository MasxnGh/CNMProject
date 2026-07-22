import React, { useMemo } from "react";
import ChoiceMission from "./ChoiceMission";

export default function FinalBossMission({ missionView, onSubmit, disabled, feedback, onPlayAudio, bossProgress }) {
  const bossView = useMemo(() => {
    const total = Math.max(1, bossProgress?.totalMissions ?? 5);
    const completed = bossProgress?.currentMission ?? 0;
    const damage = feedback?.correct ? 1 : 0;
    const hp = Math.max(0, Math.round(100 - ((completed + damage) / total) * 100));
    return {
      ...missionView,
      mechanics: { ...(missionView.mechanics ?? {}), bossHp: hp },
    };
  }, [bossProgress, feedback?.correct, missionView]);

  return <ChoiceMission missionView={bossView} onSubmit={onSubmit} disabled={disabled} feedback={feedback} onPlayAudio={onPlayAudio} boss />;
}
