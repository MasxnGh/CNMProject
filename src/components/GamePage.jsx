import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Heart, Lightbulb, Map, Pause, Shield, Star, Target } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { evaluateMission } from "../utils/evaluateMission";
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
import MissionIntro from "./MissionIntro";
import PandaGuide from "./PandaGuide";
import PauseOverlay from "./PauseOverlay";
import PlayerStatus from "./PlayerStatus";
import ProgressBar from "./ProgressBar";
import QuestionRenderer from "./QuestionRenderer";

const missionNames = {
  multiple: "Multiple choice",
  multipleChoice: "Multiple choice",
  pinyin: "Pinyin",
  pinyinDrag: "Pinyin builder",
  toneChoice: "Tone choice",
  hanziTrace: "Hanzi trace",
  matching: "Matching",
  audio: "Audio choice",
  audioChoice: "Audio choice",
  sentenceOrder: "Sentence order",
  "sentence-order": "Sentence order",
  fillBlank: "Fill in the blank",
  "fill-blank": "Fill in the blank",
  culture: "Culture quiz",
  cultureQuiz: "Culture quiz",
  shopping: "Shopping",
  finalBoss: "Final Boss",
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
  onToggleSound = () => {},
  onToggleReducedMotion = () => {},
  onToggleSkipIntro = () => {},
}) {
  const [state, dispatch] = useReducer(
    gameSessionReducer,
    { level, skipMissionIntro },
    ({ level: initialLevel, skipMissionIntro: skipIntro }) => createGameSession(initialLevel, { skipIntro }),
  );
  const [speechMessage, setSpeechMessage] = useState("");
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
    onFinish(level, state.correct, { hintsUsed: state.hintsUsed, score: state.score });
  }, [level, onFinish, state.correct, state.hintsUsed, state.levelId, state.phase, state.score]);

  useEffect(() => {
    if (!soundOn) cancelSessionAudio();
  }, [cancelSessionAudio, soundOn]);

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

  const submitCandidate = useCallback((candidate) => {
    if (state.phase !== "playing" || !mission) return;
    const isCorrect = evaluateMission(mission, candidate);
    if (isCorrect && mission.type === "finalBoss") soundManager.play("bossHit");
    else if (isCorrect) playCorrectSound();
    else playWrongSound();
    dispatch({
      type: "ANSWER",
      candidate,
      correctOption: mission.answer.correctSequence ?? mission.answer.correctAnswer,
      isCorrect,
    });
  }, [mission, state.phase]);

  const useHint = useCallback(() => dispatch({ type: "USE_HINT" }), []);

  const playAudio = useCallback((callbacks = {}) => {
    if (state.phase !== "playing" || !mission?.audioText) return;
    return speakChinese(mission.audioText, {
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
      className={`scene v2-scene v2-game-scene theme-${level.backgroundTheme} min-h-screen px-4 py-5 sm:px-6 lg:px-10`}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 35 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -35 }}
      transition={{ duration: reducedMotion ? 0 : 0.42, ease: "easeOut" }}
    >
      <div className="v2-starry-field" aria-hidden="true" />
      <div
        ref={backgroundRef}
        className="mx-auto max-w-7xl"
        data-testid="game-background"
        aria-hidden={paused ? "true" : undefined}
        inert={paused ? "" : undefined}
      >
        <div className="v2-game-header">
          <button className="v2-icon-button" type="button" onClick={backToMap} disabled={paused} aria-label="Return to map">
            <ArrowLeft size={23} />
          </button>
          <div>
            <h1>{level.title}</h1>
            <p>{level.location} - {level.topic}</p>
          </div>
          <div className="v2-mission-chip"><Shield size={18} /> Lv. {progress.level}</div>
        </div>
        <PlayerStatus progress={progress} compact />

        {state.phase === "intro" ? (
          <MissionIntro
            intro={intro}
            skipMissionIntro={skipMissionIntro}
            onSkipMissionIntro={onToggleSkipIntro}
            onStart={start}
          />
        ) : mission ? (
          <div className="v2-game-layout">
            <aside className="v2-game-console">
              <PandaGuide compact text={state.hearts > 1 ? "Take your time and use the hint when needed." : "One heart left. Review carefully."} mood={state.hearts <= 1 ? "sad" : "happy"} />
              <div className="v2-heart-row">
                {[0, 1, 2].map((heart) => (
                  <span key={heart} className={heart < state.hearts ? "alive" : "lost"}>
                    <Heart size={23} fill="currentColor" />
                  </span>
                ))}
              </div>
              <div className="v2-console-stat"><Star size={18} fill="currentColor" /> Score {state.score}</div>
              <div className="v2-console-stat"><Target size={18} /> Correct {state.correct}/{level.questions.length}</div>
              <button className="v2-button hint" type="button" onClick={useHint} disabled={state.hints <= 0 || state.showHint || disabled}>
                <Lightbulb size={20} /> Hint {state.hints}/2
              </button>
              <button className="v2-button glass" type="button" onClick={pause} disabled={paused || state.phase === "finished"}>
                <Pause size={20} /> Pause
              </button>
              <button className="v2-button ghost" type="button" onClick={backToMap} disabled={paused}>
                <Map size={20} /> Back to map
              </button>
            </aside>

            <main
              ref={arenaRef}
              tabIndex={-1}
              className={`v2-mission-arena ${mission.type === "finalBoss" ? "boss" : ""} ${state.feedback?.correct ? "is-correct" : state.feedback ? "is-wrong" : ""}`}
            >
              <div className="v2-mission-progress">
                <div>
                  <span>Mission {state.index + 1}/{level.questions.length}</span>
                  <strong>{missionNames[mission.type] ?? mission.type}</strong>
                </div>
                <ProgressBar value={state.index + 1} max={level.questions.length} />
              </div>

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
                  <div className={`v2-feedback ${state.feedback.correct ? "right" : "wrong"}`}>
                    <strong>{state.feedback.text}</strong>
                    {missionView.explanation ? <span>{missionView.explanation}</span> : null}
                    <button ref={continueRef} className="v2-button primary" type="button" onClick={continueMission}>Continue</button>
                  </div>
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
          onMap={backToMap}
        />
      ) : null}
    </motion.section>
  );
}
