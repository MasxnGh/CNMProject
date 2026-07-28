import React from "react";
import AudioChoiceMission from "./AudioChoiceMission";
import ChoiceMission from "./ChoiceMission";
import CultureQuizMission from "./CultureQuizMission";
import DialogueMission from "./DialogueMission";
import FillBlankMission from "./FillBlankMission";
import FinalBossMission from "./FinalBossMission";
import HanziTraceMission from "./HanziTraceMission";
import ImageChoiceMission from "./ImageChoiceMission";
import MatchingMission from "./MatchingMission";
import PinyinDragMission from "./PinyinDragMission";
import SentenceOrderMission from "./SentenceOrderMission";
import ShoppingMission from "./ShoppingMission";
import ToneChoiceMission from "./ToneChoiceMission";

function MissionReveal({ missionView, feedback }) {
  if (!feedback || !missionView.explanation) return null;

  return (
    <section className="mission-prompt" aria-label="เฉลยภารกิจ">
      <div className="min-w-0">
        <span className="mission-label">เฉลยภารกิจ</span>
        <strong>{missionView.chineseText}</strong>
        <small>{missionView.pinyin}</small>
        <small>{missionView.thaiMeaning ?? missionView.translation}</small>
        <p>{missionView.explanation}</p>
      </div>
    </section>
  );
}

export default function QuestionRenderer({ missionView, onSubmit, disabled, feedback, onPlayAudio, bossProgress }) {
  const props = { missionView, onSubmit, disabled, feedback, onPlayAudio, bossProgress };
  let missionContent;

  switch (missionView.type) {
    case "pinyinDrag":
      missionContent = <PinyinDragMission {...props} />;
      break;
    case "toneChoice":
      missionContent = <ToneChoiceMission {...props} />;
      break;
    case "hanziTrace":
      missionContent = <HanziTraceMission {...props} />;
      break;
    case "matching":
      missionContent = <MatchingMission {...props} />;
      break;
    case "audioChoice":
      missionContent = <AudioChoiceMission {...props} />;
      break;
    case "sentenceOrder":
      missionContent = <SentenceOrderMission {...props} />;
      break;
    case "fillBlank":
      missionContent = <FillBlankMission {...props} />;
      break;
    case "cultureQuiz":
      missionContent = <CultureQuizMission {...props} />;
      break;
    case "imageChoice":
      missionContent = <ImageChoiceMission {...props} />;
      break;
    case "dialogue":
      missionContent = <DialogueMission {...props} />;
      break;
    case "shopping":
      missionContent = <ShoppingMission {...props} />;
      break;
    case "finalBoss":
      missionContent = <FinalBossMission {...props} />;
      break;
    case "multiple":
    case "multipleChoice":
    case "pinyin":
    case "audio":
    case "culture":
    case "fill-blank":
      missionContent = <ChoiceMission {...props} audioOnly={missionView.type === "audio"} />;
      break;
    case "sentence-order":
      missionContent = <SentenceOrderMission {...props} />;
      break;
    default:
      missionContent = <ChoiceMission {...props} />;
  }

  return (
    <>
      {React.cloneElement(missionContent, { key: missionView.id })}
      <MissionReveal missionView={missionView} feedback={feedback} />
    </>
  );
}
