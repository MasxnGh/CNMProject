export const getMissionView = (mission, phase) => ({
  id: mission.id,
  type: mission.type,
  ...mission.beforeAnswer,
  ...(phase === "feedback" ? mission.afterAnswer : undefined),
  hintAvailable: Boolean(mission.hint),
  hasAudio: Boolean(mission.audioText),
  mechanics: mission.mechanics,
});
