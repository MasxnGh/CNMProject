import { AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import Button from "../components/ui/Button.jsx";
import PageTransition from "../components/ui/PageTransition.jsx";
import Sky from "../components/ui/Sky.jsx";
import UnlockModal from "../components/game/UnlockModal.jsx";
import Lesson from "./Lesson.jsx";
import Result from "./Result.jsx";
import Review from "./Review.jsx";
import { buildPool } from "../lib/exerciseMix.js";
import sentences from "../content/sentences.json";
import vocab from "../content/vocab.json";

const byId = (id) => vocab.find((entry) => entry.id === id);

const sentenceTokens = (sentenceId) => {
  const sentence = sentences.find((entry) => entry.id === sentenceId);
  return { sentence, tokens: sentence.tokens.map((id) => byId(id) ?? { hanzi: id, pinyin: "" }) };
};

/** Real content (ch1's vocab + a handful of sentences), one of each Prompt
    B/C exercise type, so Lesson.jsx/Result.jsx can be exercised end-to-end
    before this engine has real per-node content wiring. Not linked from
    any nav - reachable only at /lesson-preview while this is in review. */
const buildSampleExercises = () => {
  const options = ["v_nihao", "v_xiexie", "v_zaijian", "v_laoshi"].map(byId);

  const translationSample = sentenceTokens("s_wo_shi2_xuesheng");
  const arrangeSample = sentenceTokens("s_ta_qu_xuexiao");
  const completeSample = sentenceTokens("s_wo_xihuan_zhongguocai");
  const translateSample = sentenceTokens("s_jintian_wo_he2_cha");

  return [
    { type: "pickImage", prompt: byId("v_nihao"), options, correctId: "v_nihao" },
    {
      type: "pickTranslation",
      sentence: translationSample.sentence,
      tokens: translationSample.tokens,
      options: ["ฉันเป็นนักเรียน", "ฉันชอบอาหารจีน", "ฉันเป็นคนไทย", "ฉันพูดภาษาจีน"],
      correctIndex: 0,
    },
    { type: "pickAudio", vocabId: "v_xiexie", options, correctId: "v_xiexie" },
    {
      type: "arrangeFromAudio",
      sentence: arrangeSample.sentence,
      tokens: arrangeSample.tokens,
      poolChips: [...arrangeSample.tokens, byId("v_nihao")].sort(() => Math.random() - 0.5),
    },
    {
      type: "completeTranslation",
      sentence: completeSample.sentence,
      tokens: completeSample.tokens,
      blankIndices: [1],
      poolChips: [completeSample.tokens[1], byId("v_zaijian")].sort(() => Math.random() - 0.5),
    },
    {
      type: "translateSentence",
      sentence: translateSample.sentence,
      tokens: translateSample.tokens,
      poolChips: [...translateSample.tokens, byId("v_xiexie"), byId("v_laoshi")].sort(() => Math.random() - 0.5),
    },
    {
      type: "dialogueReply",
      question: sentences.find((entry) => entry.id === "s_ni_hui_shuo_yingyu_ma2"),
      options: [
        { ...sentences.find((entry) => entry.id === "s_wo_hui_shuo_yingyu"), correct: true },
        {
          ...sentences.find((entry) => entry.id === "s_wo_shi2_xuesheng"),
          correct: false,
          reason: "ตัวเลือกนี้บอกอาชีพ ไม่ใช่ตอบเรื่องภาษา",
        },
      ],
    },
    {
      type: "speakAloud",
      sentence: sentences.find((entry) => entry.id === "s_ni_hao"),
    },
  ];
};

/* Prompt E's unlock-test needs a real pool spanning 3+ lessons to exercise
   buildPool()'s even-distribution/no-type-streak behavior - three small
   synthetic "lessons" built from unrelated vocab groups so wrong answers
   land clearly in one lesson or another (for weakLessonId to point at). */
const LESSON_DEFS = [
  { lessonId: "demo_greet", label: "ทักทาย", icon: "学", wordIds: ["v_nihao", "v_xiexie", "v_zaijian", "v_laoshi", "v_xuesheng"] },
  { lessonId: "demo_family", label: "ครอบครัว", icon: "家", wordIds: ["v_baba", "v_mama", "v_gege", "v_jiejie", "v_jia"] },
  { lessonId: "demo_numbers", label: "ตัวเลข", icon: "数", wordIds: ["v_yi", "v_er", "v_san", "v_shi", "v_jintian"] },
];

const buildLessonQuiz = ({ lessonId, wordIds }) => {
  const words = wordIds.map(byId);
  return words.map((word, i) => {
    const distractors = words.filter((w) => w.id !== word.id).slice(0, 3);
    const shuffledOptions = [word, ...distractors].sort(() => Math.random() - 0.5);
    const type = i % 2 === 0 ? "pickImage" : "pickAudio";
    const base = { id: `${lessonId}_q${i}`, lessonId, options: shuffledOptions, correctId: word.id };
    return type === "pickImage" ? { ...base, type, prompt: word } : { ...base, type, vocabId: word.id };
  });
};

const exercisesByLessonId = Object.fromEntries(LESSON_DEFS.map((def) => [def.lessonId, buildLessonQuiz(def)]));
const allDemoExercises = Object.values(exercisesByLessonId).flat();
const lessonLabelById = Object.fromEntries(LESSON_DEFS.map((def) => [def.lessonId, def.label]));
const unlockLanterns = LESSON_DEFS.map((def) => ({ icon: def.icon, label: def.label }));

/* A fixed subset stands in for "progress.mistakes" for the Review.jsx demo -
   see Review.jsx's own note on why it takes pre-resolved exercises rather
   than reading a progress store directly. */
const INITIAL_MISTAKE_IDS = ["demo_greet_q0", "demo_greet_q2", "demo_family_q1"];

export default function LessonPreview() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState("menu");
  const [exercises] = useState(buildSampleExercises);
  const [unlockPool] = useState(() => buildPool(exercisesByLessonId, Object.keys(exercisesByLessonId), 15));
  const [mistakeIds, setMistakeIds] = useState(INITIAL_MISTAKE_IDS);
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [result, setResult] = useState(null);

  const reviewExercises = useMemo(
    () => allDemoExercises.filter((exercise) => mistakeIds.includes(exercise.id)),
    [mistakeIds],
  );

  const backToMenu = () => {
    setResult(null);
    setScreen("menu");
  };

  const content =
    screen === "review" ? (
      <Review
        key="review"
        exercises={reviewExercises}
        onResolved={(correctIds) => setMistakeIds((ids) => ids.filter((id) => !correctIds.includes(id)))}
        onBackToLearning={backToMenu}
      />
    ) : result ? (
      <Result
        key="result"
        correctCount={result.correctCount}
        total={result.total}
        comboMax={result.comboMax}
        elapsedMs={result.elapsedMs}
        coinsEarned={result.failed ? 0 : result.correctCount * 10 + (result.isUnlockTest ? 50 : 0)}
        isUnlockTest={result.isUnlockTest}
        failed={result.failed}
        weakLessonLabel={result.weakLessonId ? lessonLabelById[result.weakLessonId] : null}
        onPracticeWeak={backToMenu}
        chapterLanterns={result.failed ? null : result.isUnlockTest ? unlockLanterns : [
          { icon: "学", label: "ทักทาย" },
          { icon: "练", label: "ทวนคำทักทาย" },
        ]}
        onBackToMap={backToMenu}
        onNextLesson={backToMenu}
      />
    ) : screen === "lesson" ? (
      <Lesson key="lesson" exercises={exercises} onExit={backToMenu} onComplete={(summary) => setResult(summary)} />
    ) : screen === "unlockTest" ? (
      <Lesson
        key="unlockTest"
        exercises={unlockPool}
        mode="unlockTest"
        onExit={backToMenu}
        onComplete={(summary) => setResult({ ...summary, isUnlockTest: true })}
      />
    ) : (
      <PageTransition key="menu" className="lantern-app">
        <Sky />
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", gap: "16px", padding: "20px" }}>
          <Button onClick={() => setScreen("lesson")} style={{ maxWidth: "20rem" }}>
            ทดสอบบทเรียนปกติ
          </Button>
          <Button onClick={() => setUnlockModalOpen(true)} style={{ maxWidth: "20rem" }}>
            ทดสอบจุดโคมสามดวง (ข้ามด่าน)
          </Button>
          <Button onClick={() => setScreen("review")} style={{ maxWidth: "20rem" }}>
            ทดสอบหน้าทวน ({reviewExercises.length} ข้อ)
          </Button>
          <Button variant="ghost" onClick={() => navigate("/chapters")} style={{ maxWidth: "20rem" }}>
            กลับแผนที่
          </Button>
        </main>

        <UnlockModal
          open={unlockModalOpen}
          lanterns={unlockLanterns}
          attemptAvailable
          coins={30}
          payCost={50}
          onStartTest={() => {
            setUnlockModalOpen(false);
            setScreen("unlockTest");
          }}
          onPayToUnlock={() => setUnlockModalOpen(false)}
          onClose={() => setUnlockModalOpen(false)}
        />
      </PageTransition>
    );

  return <AnimatePresence mode="wait">{content}</AnimatePresence>;
}
