import React from "react";
import ChoiceMission from "./ChoiceMission";

export default function CultureQuizMission({ missionView, onSubmit, disabled, feedback, onPlayAudio }) {
  return <ChoiceMission missionView={missionView} onSubmit={onSubmit} disabled={disabled} feedback={feedback} onPlayAudio={onPlayAudio} />;
}
