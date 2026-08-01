import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Lightbulb, Map, Pause, Shield, Star, Target, Volume2, VolumeX, X } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { diagnoseMission } from "../utils/diagnoseMission";
import { createGameSession, gameSessionReducer } from "../utils/gameSessionReducer";
import { getMissionView } from "../utils/missionViewModel";
import {
  cancelPendingSound,
  cancelSpeech,
  playCorrectSound,
  playWrongSound,
  speakChinese,
} from "../utils/speech";
import soundManager from "../utils/soundManager";
import ComboBadge from "./ComboBadge";
import MissionIntro from "./MissionIntro";
import MissionVerdict from "./MissionVerdict";
import Modal from "./Modal";
import PauseOverlay from "./PauseOverlay";
import PlayerStatus from "./PlayerStatus";
import ProgressBar from "./ProgressBar";
import QuestionRenderer from "./QuestionRenderer";

const missionNames = {
  multiple: "ตัวเลือกหลายข้อ",
  multipleChoice: "ตัวเลือกหลายข้อ",
  pinyin: "พินอิน",
  pinyinDrag: "ประกอบพินอิน",
  toneChoice: "เลือกวรรณยุกต์",
  hanziTrace: "เขียนฮั่นจื้อ",
  matching: "จับคู่คำศัพท์",
  audio: "ฟังเสียงเลือกคำ",
  audioChoice: "ฟังเสียงเลือกคำ",
  sentenceOrder: "เรียงประโยค",
  "sentence-order": "เรียงประโยค",
  fillBlank: "เติมคำในช่องว่าง",
  "fill-blank": "เติมคำในช่องว่าง",
  culture: "ปริศนาวัฒนธรรม",
  cultureQuiz: "ปริศนาวัฒนธรรม",
  shopping: "เลือกซื้อของ",
  finalBoss: "บอสด่านสุดท้าย",
  imageChoice: "เลือกภาพให้ตรงคำ",
  dialogue: "บทสนทนา",
  translationBlank: "เติมคำแปลให้สมบูรณ์",
  translateSentence: "แปลประโยค",
  pronunciation: "ฝึกออกเสียง",
};

const isEditable = (element) =>
  element?.isContentEditable
  || element?.tagName === "INPUT"
  || element?.tagName === "TEXTAREA"
  || element?.tagName === "SELECT";

const isInteractive = (element) =>
  isEditable(element)
  || element?.tagName === "BUTTON"
  || element?.tagName === "A"
  || element?.getAttribute?.("role") === "button"
  || element?.tabIndex >= 0;

export default function GamePage({
  level,
  progress,
  onFinish,
  onMap,
  soundOn = true,
  reducedMotion = false,
  skipMissionIntro = false,
  isCheckpoint = false,
  variant = "classic",
  heartsEnabled = true,
  onToggleSound = () => {},
  onToggleReducedMotion = () => {},
  onToggleSkipIntro = () => {},
}) {
  const isLantern = variant === "lantern";
  const [state, dispatch] = useReducer(
    gameSessionReducer,
    { level, skipMissionIntro, heartsEnabled },
    ({ level: initialLevel, skipMissionIntro: skipIntro, heartsEnabled: startHeartsEnabled }) =>
      createGameSession(initialLevel, { skipIntro, heartsEnabled: startHeartsEnabled }),
  );
  const [speechMessage, setSpeechMessage] = useState("");
  const [comboFlash, setComboFlash] = useState(0);
  const comboFlashTimeoutRef = useRef(null);
  const sceneRef = useRef(null);
  const backgroundRef = useRef(null);
  const arenaRef = useRef(null);
  const continueRef = useRef(null);
  const focusBeforePauseRef = useRef(null);
  const wasPausedRef = useRef(false);
  const timeoutRef = useRef(null);
  const finishReportedRef = useRef(false);
  const levelIdRef = useRef(level.id);

  const clearPendingTransition = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const cancelSessionAudio = useCallback(() => {
    clearPendingTransition();
    cancelSpeech();
    cancelPendingSound();
  }, [clearPendingTransition]);

  const intro = useMemo(() => ({
    title: level.title,
    location: level.location,
    topic: level.topic,
    description: level.description,
    missionTypes: [...new Set(level.questions.map((mission) => missionNames[mission.type] ?? mission.type))],
  }), [level]);

  const mission = level.questions[state.index];
  const feedbackVisible = state.phase === "feedback" || (state.phase === "paused" && state.resumePhase === "feedback");
  const missionView = mission ? getMissionView(mission, feedbackVisible ? "feedback" : "playing") : null;
  const disabled = state.phase !== "playing";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    sceneRef.current?.focus();
    return cancelSessionAudio;
  }, [cancelSessionAudio]);

  useEffect(() => {
    if (levelIdRef.current === level.id) return;
    cancelSessionAudio();
    levelIdRef.current = level.id;
    finishReportedRef.current = false;
    setSpeechMessage("");
    dispatch({ type: "RESTART", level, showIntro: !skipMissionIntro });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    sceneRef.current?.focus();
  }, [cancelSessionAudio, level, skipMissionIntro]);

  useEffect(() => {
    if (state.phase === "paused") {
      wasPausedRef.current = true;
      return;
    }

    if (wasPausedRef.current) {
      wasPausedRef.current = false;
      const previousFocus = focusBeforePauseRef.current;
      const reusablePreviousFocus = backgroundRef.current?.contains(previousFocus)
        && !previousFocus?.disabled
        ? previousFocus
        : null;
      const restoredFocus = state.phase === "feedback"
        ? continueRef.current
        : reusablePreviousFocus
          ?? arenaRef.current?.querySelector(".answer-button:not(:disabled), button:not(:disabled)")
          ?? arenaRef.current;
      restoredFocus?.focus();
      return;
    }

    if (state.phase === "playing") arenaRef.current?.focus();
  }, [state.index, state.phase]);

  useEffect(() => {
    if (state.phase !== "finished" || state.levelId !== level.id || finishReportedRef.current) return;
    finishReportedRef.current = true;
    onFinish(level, state.correct, {
      hintsUsed: state.hintsUsed,
      score: state.score,
      wrongMissionIds: state.wrongMissionIds,
      attemptedCount: state.index + 1,
    });
  }, [level, onFinish, state.correct, state.hintsUsed, state.index, state.levelId, state.phase, state.score, state.wrongMissionIds]);

  useEffect(() => {
    if (!soundOn) cancelSessionAudio();
  }, [cancelSessionAudio, soundOn]);

  // Flashes a "รัวๆ! xN" badge every 5th consecutive correct answer, clearing
  // itself so the next milestone (or a fresh streak later) can flash again.
  useEffect(() => {
    if (state.combo === 0 || state.combo % 5 !== 0) return undefined;
    setComboFlash(state.combo);
    comboFlashTimeoutRef.current = window.setTimeout(() => setComboFlash(0), 1400);
    return () => window.clearTimeout(comboFlashTimeoutRef.current);
  }, [state.combo]);

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const continueMission = useCallback(() => dispatch({ type: "CONTINUE" }), []);

  const pause = useCallback(() => {
    focusBeforePauseRef.current = document.activeElement;
    cancelSessionAudio();
    dispatch({ type: "PAUSE" });
  }, [cancelSessionAudio]);

  const resume = useCallback(() => dispatch({ type: "RESUME" }), []);

  const restart = useCallback(() => {
    cancelSessionAudio();
    finishReportedRef.current = false;
    setSpeechMessage("");
    dispatch({ type: "RESTART" });
  }, [cancelSessionAudio]);

  const backToMap = useCallback(() => {
    cancelSessionAudio();
    onMap();
  }, [cancelSessionAudio, onMap]);

  const [confirmExitOpen, setConfirmExitOpen] = useState(false);
  const requestExit = useCallback(() => setConfirmExitOpen(true), []);
  const cancelExit = useCallback(() => setConfirmExitOpen(false), []);
  const confirmExit = useCallback(() => {
    setConfirmExitOpen(false);
    backToMap();
  }, [backToMap]);

  const submitCandidate = useCallback((candidate) => {
    if (state.phase !== "playing" || !mission) return;
    const { correct: isCorrect, parts, notes } = diagnoseMission(mission, candidate);
    if (isCorrect && mission.type === "finalBoss") soundManager.play("bossHit");
    else if (isCorrect) playCorrectSound();
    else playWrongSound();
    dispatch({
      type: "ANSWER",
      candidate,
      correctOption: mission.answer.correctSequence ?? mission.answer.correctAnswer,
      isCorrect,
      parts,
      notes,
      missionId: mission.id,
    });
  }, [mission, state.phase]);

  const useHint = useCallback(() => dispatch({ type: "USE_HINT" }), []);

  /* `text` lets a mission speak one of its own words (matching reads each card)
     while everything else keeps falling back to the mission's audioText. */
  const playAudio = useCallback((options = {}) => {
    const { text, ...callbacks } = options;
    const phrase = text ?? mission?.audioText;
    if (state.phase !== "playing" || !phrase) return;
    return speakChinese(phrase, {
      ...callbacks,
      onUnsupported: setSpeechMessage,
    });
  }, [mission, state.phase]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (state.phase === "paused") resume();
        else if (state.phase === "playing" || state.phase === "feedback") pause();
        return;
      }

      const active = document.activeElement;

      if (event.key === "Enter") {
        const disabledMissionControlHasFocus = state.phase === "feedback"
          && active?.disabled === true
          && arenaRef.current?.contains(active);
        if (disabledMissionControlHasFocus) {
          event.preventDefault();
          continueMission();
          return;
        }

        if (isInteractive(active)) return;
        if (state.phase === "intro") start();
        else if (state.phase === "feedback") continueMission();
        else if (state.phase === "playing") arenaRef.current?.querySelector("button.game-button.primary:not(:disabled)")?.click();
        return;
      }

      if (isInteractive(active)) return;

      if (state.phase !== "playing") return;
      if (/^[1-4]$/.test(event.key)) {
        const option = arenaRef.current?.querySelectorAll(".answer-button:not(:disabled)")?.[Number(event.key) - 1];
        if (option) {
          event.preventDefault();
          option.click();
        }
        return;
      }

      if (event.key === " " || event.code === "Space") {
        const audioButton = arenaRef.current?.querySelector(".sound-button:not(:disabled)");
        if (audioButton) {
          event.preventDefault();
          audioButton.click();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [continueMission, pause, resume, start, state.phase]);

  const paused = state.phase === "paused";

  return (
    <motion.section
      ref={sceneRef}
      tabIndex={-1}
      className={`scene dq-scene v2-scene v2-game-scene theme-${level.backgroundTheme}`}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 35 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -35 }}
      transition={{ duration: reducedMotion ? 0 : 0.42, ease: "easeOut" }}
    >
      <div className="v2-starry-field" aria-hidden="true" />
      <div
        ref={backgroundRef}
        className="dq-game-container"
        data-testid="game-background"
        aria-hidden={paused ? "true" : undefined}
        inert={paused ? "" : undefined}
      >
        {isLantern ? (
          <div className="ln-quiz-top">
            <button className="v2-icon-button ln-quiz-close" type="button" onClick={requestExit} disabled={paused} aria-label="ปิด">
              <X size={20} />
            </button>
            <ProgressBar className="ln-quiz-progress" value={state.index} max={level.questions.length} />
            {isCheckpoint ? (
              <div className="ln-quiz-lives" aria-label={`เหลือ ${state.hearts} ชีวิต`}>
                {[0, 1, 2].map((heart) => (
                  <span key={heart} className={`ln-quiz-life-lantern ${heart < state.hearts ? "is-lit" : "is-lost"}`} />
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="v2-game-header">
              <button className="v2-icon-button" type="button" onClick={requestExit} disabled={paused} aria-label="กลับไปที่แผนที่">
                <ArrowLeft size={23} />
              </button>
              <div className="v2-game-title">
                <h1 title={level.title}>{level.title}</h1>
                <p>{level.location} - {level.topic}</p>
              </div>
              <div className="v2-mission-chip"><Shield size={18} /> Lv. {progress.level}</div>
            </div>
            <PlayerStatus progress={progress} compact />
          </>
        )}

        {state.phase === "intro" && !isLantern ? (
          <MissionIntro
            intro={intro}
            skipMissionIntro={skipMissionIntro}
            onSkipMissionIntro={onToggleSkipIntro}
            onStart={start}
          />
        ) : mission ? (
          <div className="v2-game-layout">
            {!isLantern ? (
              <aside className="v2-game-console" aria-label="Mission dashboard">
                <section className="v2-mission-status" role="group" aria-label="Mission status">
                  <div className="v2-heart-row" aria-label={`${state.hearts} hearts remaining`}>
                    {[0, 1, 2].map((heart) => (
                      <span key={heart} className={heart < state.hearts ? "alive" : "lost"}>
                        <Heart size={20} fill="currentColor" aria-hidden="true" />
                      </span>
                    ))}
                  </div>
                  <div className="v2-console-stat v2-mission-counter"><Target size={18} aria-hidden="true" /> ภารกิจ {state.index + 1}/{level.questions.length}</div>
                  <div className="v2-console-stat"><Star size={18} fill="currentColor" aria-hidden="true" /> คะแนน {state.score}</div>
                </section>
                <section className="v2-mission-actions" role="group" aria-label="Mission actions">
                  <button className="v2-button hint" type="button" onClick={useHint} disabled={state.hints <= 0 || state.showHint || disabled}>
                    <Lightbulb size={20} /> คำใบ้ {state.hints}/2
                  </button>
                  <button className="v2-icon-button v2-console-pause" type="button" onClick={pause} disabled={paused || state.phase === "finished"} aria-label="หยุดชั่วคราว">
                    <Pause size={20} />
                  </button>
                  <button className="v2-icon-button v2-console-sound" type="button" onClick={onToggleSound} aria-label={soundOn ? "ปิดเสียง" : "เปิดเสียง"}>
                    {soundOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                </section>
                <button className="v2-button ghost v2-console-map" type="button" onClick={requestExit} disabled={paused}>
                  <Map size={20} /> กลับแผนที่
                </button>
              </aside>
            ) : null}

            <main
              ref={arenaRef}
              tabIndex={-1}
              className={`v2-mission-arena ${mission.type === "finalBoss" ? "boss" : ""} ${state.feedback?.correct ? "is-correct" : state.feedback ? "is-wrong" : ""}`}
            >
              {!isLantern ? (
                <div className={`v2-mission-progress ${isCheckpoint ? "checkpoint" : ""}`}>
                  <div>
                    <span>ภารกิจ {state.index + 1}/{level.questions.length}</span>
                    <strong>{missionNames[mission.type] ?? mission.type}</strong>
                  </div>
                  <ProgressBar value={state.index + 1} max={level.questions.length} />
                </div>
              ) : null}

              <ComboBadge combo={comboFlash} />

              <AnimatePresence mode="wait">
                <motion.div key={mission.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <QuestionRenderer
                    missionView={missionView}
                    onSubmit={submitCandidate}
                    disabled={disabled}
                    feedback={state.feedback}
                    onPlayAudio={playAudio}
                    bossProgress={mission.type === "finalBoss" ? {
                      currentMission: state.index,
                      totalMissions: level.questions.length,
                    } : undefined}
                  />
                </motion.div>
              </AnimatePresence>

              <AnimatePresence>
                {state.showHint ? <div className="v2-hint-panel"><Lightbulb size={20} /> {mission.hint}</div> : null}
                {speechMessage ? <div className="v2-hint-panel warning">{speechMessage}</div> : null}
                {state.feedback ? (
                  <MissionVerdict
                    feedback={state.feedback}
                    explanation={missionView.explanation}
                    onContinue={continueMission}
                    continueRef={continueRef}
                  />
                ) : null}
              </AnimatePresence>
            </main>
          </div>
        ) : null}
      </div>

      {paused ? (
        <PauseOverlay
          soundOn={soundOn}
          reducedMotion={reducedMotion}
          onResume={resume}
          onToggleSound={onToggleSound}
          onToggleReducedMotion={onToggleReducedMotion}
          onRestart={restart}
          onMap={requestExit}
        />
      ) : null}
      <Modal
        open={confirmExitOpen}
        title="ออกจากภารกิจตอนนี้เลยหรือไม่?"
        confirmText="ออกจากภารกิจ"
        cancelText="เล่นต่อ"
        onCancel={cancelExit}
        onConfirm={confirmExit}
      >
        ความคืบหน้าของภารกิจนี้จะไม่ถูกบันทึกจนกว่าจะตอบครบทุกข้อ
      </Modal>
    </motion.section>
  );
}
