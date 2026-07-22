# Dujeen Quest Adventure Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** เปลี่ยน Dujeen Quest ให้เป็นเกมผจญภัยจีนที่มีระดับความยาก 3 แบบ คอมโบ เวลา feedback และงานภาพ Chinese Fantasy Adventure ครบทั้ง 15 ด่าน

**Architecture:** รักษา React/Vite, Framer Motion, mission components และ content data เดิม เพิ่ม pure configuration/scoring modules และขยาย reducer ให้เป็นแหล่งข้อมูลจริงของ HUD จากนั้นประกอบ UI ใหม่ด้วย DOM components และ theme layer ใน CSS โดยไม่เพิ่ม game engine หรือ dependency ใหม่

**Tech Stack:** React 18, Vite 6, Framer Motion 11, Tailwind CSS 3, Vitest, Testing Library, Playwright

## Global Constraints

- ระดับความยากมี `traveler`, `adventurer`, `dragon` และค่าเริ่มต้นคือ `adventurer`
- ผู้เล่นเลือกความยากก่อนเริ่มแต่ละด่าน และระบบจำค่าล่าสุดใน Local Storage
- ความยากเปลี่ยนหัวใจ เวลา คำใบ้ ตัวคูณ และตัวลวง แต่ไม่ตัดเนื้อหาการเรียนรู้
- ห้ามเผย correct answer, pinyin, transcript หรือ explanation ก่อนผู้เล่นตอบตาม content-safety rules เดิม
- ใช้ palette แดงชาด `#A92D2D`, ทอง `#F4C95D`, ครีม `#FFF0CF`, หยก `#2F8C72`, หมึก `#202530`
- motion ใช้ transform/opacity เป็นหลัก และปิด ambient/parallax/particle เมื่อ reduced motion
- ต้องรองรับ 375x812, 768x1024 และ 1440x900 โดย HUD ไม่บังพื้นที่เล่น
- ไม่เพิ่ม dependency และไม่ย้ายไป Phaser

---

## File Structure

### New files

- `src/utils/difficultyConfig.js` — canonical difficulty ids, labels, hearts, hints, timer and multipliers
- `src/utils/difficultyConfig.test.js` — configuration and timer support tests
- `src/utils/challengeScoring.js` — pure combo and answer-score functions
- `src/utils/challengeScoring.test.js` — scoring tests
- `src/components/DifficultySelect.jsx` — accessible three-option selector
- `src/components/DifficultySelect.test.jsx` — selector behavior tests
- `src/components/AdventureBackdrop.jsx` — decorative Chinese landscape layers
- `src/components/GameHUD.jsx` — hearts, mission progress, combo, timer, hint and pause controls
- `src/components/GameHUD.test.jsx` — HUD state tests

### Modified files

- `src/utils/storage.js` and `src/utils/storage.test.js` — persist and migrate `difficulty`
- `src/utils/gameSessionReducer.js` and `.test.js` — initialize from difficulty and handle combo/timeout
- `src/utils/gameLogic.js` and `.test.js` — include challenge metrics in star calculation without reducing saved records
- `src/App.jsx` — own persisted difficulty and pass it to the game
- `src/components/MissionIntro.jsx` — show story briefing and DifficultySelect
- `src/components/GamePage.jsx` plus existing tests — timer lifecycle, GameHUD and contextual panda feedback
- `src/components/HomePage.jsx`, `StageSelectPage.jsx`, `MapPage.jsx`, `LevelCard.jsx`, `PlayerStatus.jsx`, `PandaGuide.jsx`, `ResultPage.jsx` — adventure presentation
- `src/index.css` — theme tokens, scene layers, responsive layout and reduced-motion rules
- `tests/e2e/game-flow.spec.js`, `tests/e2e/responsive.spec.js` — difficulty persistence and new UI flow

---

### Task 1: Difficulty configuration and save migration

**Files:**
- Create: `src/utils/difficultyConfig.js`
- Create: `src/utils/difficultyConfig.test.js`
- Modify: `src/utils/storage.js`
- Modify: `src/utils/storage.test.js`

**Interfaces:**
- Produces: `DIFFICULTY_IDS`, `DIFFICULTIES`, `normalizeDifficulty(value)`, `getDifficultyConfig(value)`, `getMissionTimeLimit(value, mission)`
- Produces progress field: `difficulty: "traveler" | "adventurer" | "dragon"`

- [ ] **Step 1: Write failing configuration tests**

```js
import { describe, expect, it } from "vitest";
import { getDifficultyConfig, getMissionTimeLimit, normalizeDifficulty } from "./difficultyConfig";

describe("difficulty configuration", () => {
  it("normalizes unknown values to adventurer", () => {
    expect(normalizeDifficulty("dragon")).toBe("dragon");
    expect(normalizeDifficulty("unknown")).toBe("adventurer");
  });

  it("exposes distinct hearts, hints and multipliers", () => {
    expect(getDifficultyConfig("traveler")).toMatchObject({ hearts: 5, hints: 3, scoreMultiplier: 1 });
    expect(getDifficultyConfig("adventurer")).toMatchObject({ hearts: 3, hints: 2, scoreMultiplier: 1.25 });
    expect(getDifficultyConfig("dragon")).toMatchObject({ hearts: 2, hints: 1, scoreMultiplier: 1.5 });
  });

  it("only times supported missions", () => {
    expect(getMissionTimeLimit("traveler", { type: "multipleChoice" })).toBeNull();
    expect(getMissionTimeLimit("dragon", { type: "hanziTrace" })).toBeNull();
    expect(getMissionTimeLimit("dragon", { type: "multipleChoice" })).toBe(18);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm.cmd test -- src/utils/difficultyConfig.test.js`

Expected: FAIL because `difficultyConfig.js` does not exist.

- [ ] **Step 3: Implement the configuration**

```js
export const DIFFICULTY_IDS = ["traveler", "adventurer", "dragon"];

export const DIFFICULTIES = {
  traveler: { id: "traveler", label: "นักเดินทางมือใหม่", hearts: 5, hints: 3, hintCoinCost: 0, scoreMultiplier: 1, timeLimit: null },
  adventurer: { id: "adventurer", label: "นักผจญภัย", hearts: 3, hints: 2, hintCoinCost: 0, scoreMultiplier: 1.25, timeLimit: 30 },
  dragon: { id: "dragon", label: "ปรมาจารย์มังกร", hearts: 2, hints: 1, hintCoinCost: 5, scoreMultiplier: 1.5, timeLimit: 18 },
};

const untimedTypes = new Set(["hanziTrace", "matching", "shopping", "finalBoss"]);

export const normalizeDifficulty = (value) => DIFFICULTY_IDS.includes(value) ? value : "adventurer";
export const getDifficultyConfig = (value) => DIFFICULTIES[normalizeDifficulty(value)];
export const getMissionTimeLimit = (value, mission) => {
  const config = getDifficultyConfig(value);
  if (!config.timeLimit || untimedTypes.has(mission?.type)) return null;
  return config.timeLimit;
};
```

- [ ] **Step 4: Add a failing storage migration assertion**

Add `difficulty: "adventurer"` to the fresh/legacy expectations and add:

```js
it("preserves a supported difficulty and normalizes an invalid one", () => {
  expect(saveProgress({ ...defaultProgress, difficulty: "dragon" }).difficulty).toBe("dragon");
  expect(saveProgress({ ...defaultProgress, difficulty: "impossible" }).difficulty).toBe("adventurer");
});
```

Run: `npm.cmd test -- src/utils/storage.test.js`

Expected: FAIL because progress has no normalized difficulty.

- [ ] **Step 5: Add difficulty to progress normalization**

Import `normalizeDifficulty`, add `difficulty: "adventurer"` to `defaultProgress`, and assign:

```js
difficulty: normalizeDifficulty(progress.difficulty),
```

inside the object returned by `normalizeProgress`.

- [ ] **Step 6: Verify Task 1 and commit**

Run: `npm.cmd test -- src/utils/difficultyConfig.test.js src/utils/storage.test.js`

Expected: both files PASS.

```powershell
git add src/utils/difficultyConfig.js src/utils/difficultyConfig.test.js src/utils/storage.js src/utils/storage.test.js
git commit -m "feat: add selectable adventure difficulty"
```

---

### Task 2: Combo, score and timeout session rules

**Files:**
- Create: `src/utils/challengeScoring.js`
- Create: `src/utils/challengeScoring.test.js`
- Modify: `src/utils/gameSessionReducer.js`
- Modify: `src/utils/gameSessionReducer.test.js`

**Interfaces:**
- Consumes: `getDifficultyConfig(difficulty)`
- Produces: `getNextCombo(combo, isCorrect)`, `getAnswerScore({ isCorrect, combo, multiplier, hintPenalty, timeRemaining })`
- Session fields: `difficulty`, `maxHearts`, `combo`, `maxCombo`, `timeouts`, `timeBonus`
- Reducer actions: `ANSWER`, `TIMEOUT`, existing `USE_HINT`, `CONTINUE`, `RESTART`

- [ ] **Step 1: Write failing scoring tests**

```js
import { describe, expect, it } from "vitest";
import { getAnswerScore, getNextCombo } from "./challengeScoring";

describe("challenge scoring", () => {
  it("builds combo on correct answers and resets on mistakes", () => {
    expect(getNextCombo(2, true)).toBe(3);
    expect(getNextCombo(2, false)).toBe(0);
  });

  it("adds combo, difficulty and time bonuses", () => {
    expect(getAnswerScore({ isCorrect: true, combo: 3, multiplier: 1.5, hintPenalty: 0, timeRemaining: 10 })).toBe(48);
    expect(getAnswerScore({ isCorrect: false, combo: 3, multiplier: 1.5, hintPenalty: 0, timeRemaining: 10 })).toBe(0);
  });
});
```

Run: `npm.cmd test -- src/utils/challengeScoring.test.js`

Expected: FAIL because module is missing.

- [ ] **Step 2: Implement pure scoring helpers**

```js
export const getNextCombo = (combo, isCorrect) => isCorrect ? combo + 1 : 0;

export const getAnswerScore = ({ isCorrect, combo, multiplier = 1, hintPenalty = 0, timeRemaining = 0 }) => {
  if (!isCorrect) return 0;
  const base = 20;
  const comboBonus = Math.max(0, combo - 1) * 5;
  const timeBonus = Math.max(0, Math.floor(timeRemaining / 5));
  return Math.max(0, Math.round((base + comboBonus + timeBonus) * multiplier) - hintPenalty);
};
```

- [ ] **Step 3: Write failing reducer tests for all three difficulties**

Add assertions that `createGameSession(level, { difficulty: "traveler" })` starts with 5 hearts/3 hints, dragon starts with 2 hearts/1 hint, two correct answers produce combo 2, wrong answer resets combo, and `TIMEOUT` enters feedback while losing one heart and incrementing `timeouts`.

```js
it("applies difficulty counters, combo and timeout feedback", () => {
  let state = createGameSession(level, { skipIntro: true, difficulty: "dragon" });
  expect(state).toMatchObject({ difficulty: "dragon", hearts: 2, maxHearts: 2, hints: 1, combo: 0 });
  state = reduce(state, { type: "ANSWER", isCorrect: true, candidate: "a", correctOption: "a", timeRemaining: 10 });
  expect(state).toMatchObject({ combo: 1, maxCombo: 1 });
  state = reduce(state, { type: "CONTINUE" });
  state = reduce(state, { type: "TIMEOUT", correctOption: "b" });
  expect(state).toMatchObject({ phase: "feedback", hearts: 1, combo: 0, timeouts: 1 });
  expect(state.feedback.text).toContain("หมดเวลา");
});
```

Run: `npm.cmd test -- src/utils/gameSessionReducer.test.js`

Expected: FAIL on missing difficulty/combo fields and unsupported `TIMEOUT`.

- [ ] **Step 4: Extend session initialization and reducer**

Use `getDifficultyConfig` in `freshSession`, calculate `earnedScore` with `getAnswerScore`, and route `TIMEOUT` through the same wrong-answer state transition with Thai feedback. `RESTART` must preserve `state.difficulty` unless `action.difficulty` is supplied.

```js
const freshSession = (levelId, missionCount, phase, difficulty) => {
  const config = getDifficultyConfig(difficulty);
  return {
    levelId, missionCount, phase, resumePhase: null, index: 0,
    difficulty: config.id, hearts: config.hearts, maxHearts: config.hearts,
    hints: config.hints, hintsUsed: 0, hintPenalty: 0,
    correct: 0, score: 0, combo: 0, maxCombo: 0,
    timeouts: 0, timeBonus: 0, showHint: false, feedback: null,
  };
};
```

- [ ] **Step 5: Verify Task 2 and commit**

Run: `npm.cmd test -- src/utils/challengeScoring.test.js src/utils/gameSessionReducer.test.js`

Expected: PASS with the original pause/restart/score regressions still green.

```powershell
git add src/utils/challengeScoring.js src/utils/challengeScoring.test.js src/utils/gameSessionReducer.js src/utils/gameSessionReducer.test.js
git commit -m "feat: add combo and timeout challenge rules"
```

---

### Task 3: Difficulty selection, timer lifecycle and game HUD

**Files:**
- Create: `src/components/DifficultySelect.jsx`
- Create: `src/components/DifficultySelect.test.jsx`
- Create: `src/components/GameHUD.jsx`
- Create: `src/components/GameHUD.test.jsx`
- Modify: `src/App.jsx`
- Modify: `src/components/MissionIntro.jsx`
- Modify: `src/components/GamePage.jsx`
- Modify: `src/components/GamePage.test.jsx`

**Interfaces:**
- `DifficultySelect({ value, onChange, disabled })`
- `GameHUD({ hearts, maxHearts, mission, totalMissions, combo, timeRemaining, hints, maxHints, onHint, onPause, disabled })`
- `GamePage` new props: `difficulty`, `onDifficultyChange`

- [ ] **Step 1: Write failing DifficultySelect and GameHUD tests**

```jsx
it("selects dragon difficulty accessibly", () => {
  const onChange = vi.fn();
  render(<DifficultySelect value="adventurer" onChange={onChange} />);
  fireEvent.click(screen.getByRole("radio", { name: /ปรมาจารย์มังกร/ }));
  expect(onChange).toHaveBeenCalledWith("dragon");
});

it("renders hearts combo timer and hint inventory", () => {
  render(<GameHUD hearts={2} maxHearts={3} mission={2} totalMissions={5} combo={4} timeRemaining={12} hints={1} maxHints={2} onHint={vi.fn()} onPause={vi.fn()} />);
  expect(screen.getByLabelText("หัวใจเหลือ 2 จาก 3")).toBeInTheDocument();
  expect(screen.getByText("คอมโบ x4")).toBeInTheDocument();
  expect(screen.getByText("00:12")).toBeInTheDocument();
});
```

Run: `npm.cmd test -- src/components/DifficultySelect.test.jsx src/components/GameHUD.test.jsx`

Expected: FAIL because both components are missing.

- [ ] **Step 2: Implement the selector and HUD as stateless components**

`DifficultySelect` maps `DIFFICULTY_IDS` to buttons with `role="radio"`, `aria-checked`, difficulty label, heart count, timer summary and hint count. `GameHUD` renders a single top cluster with decorative spans marked `aria-hidden`, semantic button labels, and no progress/economy duplication.

```jsx
export default function DifficultySelect({ value, onChange, disabled = false }) {
  return <div className="dq-difficulty" role="radiogroup" aria-label="เลือกระดับความยาก">
    {DIFFICULTY_IDS.map((id) => {
      const item = DIFFICULTIES[id];
      return <button key={id} type="button" role="radio" aria-checked={value === id} disabled={disabled} className={`dq-difficulty-card ${value === id ? "selected" : ""}`} onClick={() => onChange(id)}>
        <strong>{item.label}</strong><span>{item.hearts} หัวใจ · {item.hints} คำใบ้</span>
      </button>;
    })}
  </div>;
}
```

- [ ] **Step 3: Add failing GamePage integration tests**

Update `renderGame` defaults with `difficulty: "adventurer"` and `onDifficultyChange: vi.fn()`. Assert intro renders all three radio choices, selecting dragon calls the handler, starting creates two hearts, timer renders for a timed mission, pause freezes the timer, and timeout produces feedback exactly once.

Run: `npm.cmd test -- src/components/GamePage.test.jsx`

Expected: FAIL because GamePage does not accept difficulty or own a timer.

- [ ] **Step 4: Wire persistence and session creation**

In `App.jsx`, add:

```jsx
const setDifficulty = (difficulty) => {
  setProgress((current) => saveProgress({ ...current, difficulty }));
};
```

Pass `difficulty={progress.difficulty}` and `onDifficultyChange={setDifficulty}` to `GamePage`. In `GamePage`, initialize `createGameSession(level, { skipIntro, difficulty })`, pass selector props to `MissionIntro`, and dispatch `RESTART` when difficulty changes before play.

- [ ] **Step 5: Add the timer lifecycle**

Derive `missionTimeLimit = getMissionTimeLimit(state.difficulty, mission)`. Store `timeRemaining` in component state, reset it when `state.index` changes, decrement only while phase is `playing`, and dispatch `{ type: "TIMEOUT", correctOption: evaluation.correctOption }` once at zero. Cancel the interval on pause, feedback, mission change and unmount.

```jsx
useEffect(() => {
  setTimeRemaining(missionTimeLimit);
}, [mission?.id, missionTimeLimit]);

useEffect(() => {
  if (state.phase !== "playing" || timeRemaining === null) return undefined;
  if (timeRemaining <= 0) {
    dispatch({ type: "TIMEOUT", correctOption: mission?.answer?.correctAnswer });
    return undefined;
  }
  const timerId = window.setTimeout(() => setTimeRemaining((value) => Math.max(0, value - 1)), 1000);
  return () => window.clearTimeout(timerId);
}, [mission, state.phase, timeRemaining]);
```

- [ ] **Step 6: Replace the existing console strip with GameHUD**

Pass reducer state, `timeRemaining`, `useHint` and `pause` to `GameHUD`. Keep `PlayerStatus` outside active gameplay. Panda copy becomes correct/wrong/last-heart/timeout contextual copy.

- [ ] **Step 7: Verify Task 3 and commit**

Run: `npm.cmd test -- src/components/DifficultySelect.test.jsx src/components/GameHUD.test.jsx src/components/GamePage.test.jsx src/components/GamePage.nonChoice.test.jsx`

Expected: all component and keyboard/pause tests PASS.

```powershell
git add src/App.jsx src/components/DifficultySelect.jsx src/components/DifficultySelect.test.jsx src/components/GameHUD.jsx src/components/GameHUD.test.jsx src/components/MissionIntro.jsx src/components/GamePage.jsx src/components/GamePage.test.jsx
git commit -m "feat: integrate difficulty timer and game HUD"
```

---

### Task 4: Adventure scoring and result telemetry

**Files:**
- Modify: `src/utils/gameLogic.js`
- Modify: `src/utils/gameLogic.test.js`
- Modify: `src/components/ResultPage.jsx`

**Interfaces:**
- Consumes mission metrics `{ heartsRemaining, maxHearts, maxCombo, timeouts, timeBonus, difficulty }`
- Produces: `calculateAdventureStars(correctCount, totalQuestions, hintsUsed, missionMetrics)`
- Produces result fields `difficulty`, `maxCombo`, `timeouts`, existing `stars`, `score`, `earned`

- [ ] **Step 1: Write failing adventure-star tests**

```js
it("uses accuracy, hearts, combo, timeouts and hints for adventure stars", () => {
  const perfect = completeLevel(defaultProgress, level(), {
    correct: 5, hintsUsed: 0, score: 180,
    missionMetrics: { heartsRemaining: 3, maxHearts: 3, maxCombo: 5, timeouts: 0, difficulty: "adventurer" },
  });
  const damaged = completeLevel(defaultProgress, level(), {
    correct: 5, hintsUsed: 0, score: 120,
    missionMetrics: { heartsRemaining: 1, maxHearts: 3, maxCombo: 2, timeouts: 1, difficulty: "adventurer" },
  });
  expect(perfect.stars).toBe(3);
  expect(damaged.stars).toBe(2);
  expect(perfect.maxCombo).toBe(5);
  expect(perfect.difficulty).toBe("adventurer");
});
```

Run: `npm.cmd test -- src/utils/gameLogic.test.js`

Expected: FAIL because metrics are not surfaced.

- [ ] **Step 2: Add adventure-star quality scoring and expose metrics**

Keep `calculateStars` backward-compatible for legacy callers. Add a quality score that weights accuracy 70%, hearts 10%, combo 10% and clean timing 10%, subtracts five points per hint, and still requires at least three correct missions to pass:

```js
export const calculateAdventureStars = (correctCount, totalQuestions, hintsUsed, metrics = {}) => {
  if (correctCount < 3) return 0;
  const total = Math.max(1, totalQuestions);
  const maxHearts = Math.max(1, Number(metrics.maxHearts ?? 1));
  const accuracy = (correctCount / total) * 70;
  const heartQuality = (Math.max(0, Number(metrics.heartsRemaining ?? maxHearts)) / maxHearts) * 10;
  const comboQuality = (Math.min(total, Number(metrics.maxCombo ?? correctCount)) / total) * 10;
  const timingQuality = Number(metrics.timeouts ?? 0) === 0 ? 10 : 0;
  const quality = accuracy + heartQuality + comboQuality + timingQuality - (Number(hintsUsed) * 5);
  if (quality >= 85) return 3;
  if (quality >= 75) return 2;
  return 1;
};
```

In `completeLevel`, call `calculateAdventureStars` only when `performance.missionMetrics` is present; legacy numeric/object callers continue through `calculateStars`. Normalize metrics and return:

```js
const missionMetrics = {
  heartsRemaining: Number(performance.missionMetrics?.heartsRemaining ?? 0),
  maxHearts: Number(performance.missionMetrics?.maxHearts ?? 0),
  maxCombo: Number(performance.missionMetrics?.maxCombo ?? 0),
  timeouts: Number(performance.missionMetrics?.timeouts ?? 0),
  timeBonus: Number(performance.missionMetrics?.timeBonus ?? 0),
  difficulty: performance.missionMetrics?.difficulty ?? "adventurer",
};
```

Return `maxCombo`, `timeouts`, `difficulty` alongside `missionMetrics`. Do not change replay best-star/economy behavior.

- [ ] **Step 3: Send metrics from GamePage and render them in ResultPage**

Change the finish callback metadata to include reducer metrics. Replace the plain summary with seal chips for difficulty, max combo and hearts remaining while retaining correct count, score and hint count.

- [ ] **Step 4: Verify Task 4 and commit**

Run: `npm.cmd test -- src/utils/gameLogic.test.js src/components/GamePage.test.jsx`

Expected: PASS and original reward caps unchanged.

```powershell
git add src/utils/gameLogic.js src/utils/gameLogic.test.js src/components/GamePage.jsx src/components/ResultPage.jsx
git commit -m "feat: surface adventure challenge results"
```

---

### Task 5: Chinese Fantasy Adventure visual system and motion

**Files:**
- Create: `src/components/AdventureBackdrop.jsx`
- Modify: `src/components/HomePage.jsx`
- Modify: `src/components/StageSelectPage.jsx`
- Modify: `src/components/MapPage.jsx`
- Modify: `src/components/LevelCard.jsx`
- Modify: `src/components/PlayerStatus.jsx`
- Modify: `src/components/PandaGuide.jsx`
- Modify: `src/components/MissionIntro.jsx`
- Modify: `src/components/GamePage.jsx`
- Modify: `src/components/ResultPage.jsx`
- Modify: `src/index.css`

**Interfaces:**
- `AdventureBackdrop({ scene = "village", reducedMotion = false })`
- CSS scene classes: `.dq-scene`, `.dq-backdrop`, `.dq-scroll-panel`, `.dq-wood-button`, `.dq-route-map`, `.dq-game-hud`, `.dq-reward-scroll`

- [ ] **Step 1: Add the shared backdrop markup**

```jsx
export default function AdventureBackdrop({ scene = "village" }) {
  return <div className={`dq-backdrop scene-${scene}`} aria-hidden="true">
    <span className="dq-sun" />
    <span className="dq-mountain far" /><span className="dq-mountain near" />
    <span className="dq-cloud cloud-one" /><span className="dq-cloud cloud-two" />
    <span className="dq-bamboo bamboo-left" /><span className="dq-bamboo bamboo-right" />
    <span className="dq-lantern lantern-one" /><span className="dq-lantern lantern-two" />
    <span className="dq-mist" />
  </div>;
}
```

- [ ] **Step 2: Replace cosmic scene elements across pages**

Use `AdventureBackdrop` instead of `v2-starry-field`, rename visible copy from Star Gate/constellation/islands to เส้นทางคัมภีร์/แผนที่ผจญภัย/ด่าน, and preserve existing callbacks and test-facing accessible labels. Home gets one dominant CTA; secondary actions remain smaller. Stage cards become three scroll chapters. Map becomes a vertical winding route and locked levels use seal wording.

- [ ] **Step 3: Add the theme tokens and material styles**

Append a final cascade layer to `src/index.css` so it safely overrides the legacy v2 theme while components migrate:

```css
:root {
  --dq-cinnabar: #a92d2d;
  --dq-cinnabar-dark: #6f1f24;
  --dq-gold: #f4c95d;
  --dq-cream: #fff0cf;
  --dq-jade: #2f8c72;
  --dq-ink: #202530;
  --dq-paper: #f8dfaf;
  --dq-shadow: 0 18px 45px rgb(55 28 18 / 28%);
  --dq-spring: cubic-bezier(.2,.9,.25,1.2);
}

.dq-scene { position: relative; isolation: isolate; overflow: hidden; color: var(--dq-ink); background: linear-gradient(#f8d79b, #f4b66f 55%, #8db98d); }
.dq-scroll-panel { border: 3px solid #8a472d; border-radius: 28px; color: var(--dq-ink); background: linear-gradient(90deg, #d39b57 0 18px, var(--dq-paper) 18px calc(100% - 18px), #d39b57 calc(100% - 18px)); box-shadow: var(--dq-shadow); }
.dq-wood-button { border: 2px solid #f9d878; border-radius: 18px; color: #fff8e8; background: linear-gradient(#bd4a36, #8c292b); box-shadow: 0 7px 0 #5f2422, 0 14px 24px rgb(60 22 18 / 25%); transition: transform 180ms var(--dq-spring), box-shadow 180ms ease; }
.dq-wood-button:active { transform: translateY(5px); box-shadow: 0 2px 0 #5f2422, 0 7px 14px rgb(60 22 18 / 20%); }
```

- [ ] **Step 4: Add purposeful motion and reduced-motion overrides**

Define `dq-cloud-drift`, `dq-lantern-sway`, `dq-panda-breathe`, `dq-route-pulse`, `dq-seal-stamp`, `dq-correct-burst`, and `dq-wrong-shake`. Apply strong motion only to answer state, reward and unlock. Add:

```css
@media (prefers-reduced-motion: reduce) {
  .dq-cloud, .dq-lantern, .dq-mist, .dq-panda-guide, .dq-route-current::after { animation: none !important; }
  .dq-scene *, .dq-scene *::before, .dq-scene *::after { scroll-behavior: auto !important; transition-duration: 1ms !important; }
}

html[data-reduced-motion="true"] .dq-cloud,
html[data-reduced-motion="true"] .dq-lantern,
html[data-reduced-motion="true"] .dq-mist { animation: none !important; }
```

- [ ] **Step 5: Add responsive playfield protections**

At `max-width: 767px`, collapse HUD to two rows, keep minimum touch targets 44px, hide distant decorative layers, use a single-column mission arena, and keep fixed controls within safe-area insets. At desktop, cap persistent HUD at 22% viewport height.

- [ ] **Step 6: Run focused tests and build, then commit**

Run: `npm.cmd test -- src/components/GamePage.test.jsx src/components/GamePage.nonChoice.test.jsx src/components/QuestionRenderer.test.jsx`

Expected: PASS.

Run: `npm.cmd run build`

Expected: Vite production build exits 0.

```powershell
git add src/components/AdventureBackdrop.jsx src/components/HomePage.jsx src/components/StageSelectPage.jsx src/components/MapPage.jsx src/components/LevelCard.jsx src/components/PlayerStatus.jsx src/components/PandaGuide.jsx src/components/MissionIntro.jsx src/components/GamePage.jsx src/components/ResultPage.jsx src/index.css
git commit -m "feat: transform Dujeen Quest into Chinese fantasy adventure"
```

---

### Task 6: End-to-end playtest and regression gates

**Files:**
- Modify: `tests/e2e/game-flow.spec.js`
- Modify: `tests/e2e/responsive.spec.js`
- Modify: `PLAYTEST_REPORT.md`

**Interfaces:**
- Browser behavior only; no new production interface

- [ ] **Step 1: Add failing E2E coverage for difficulty persistence**

Extend seeded progress with `difficulty: "adventurer"`. In the first-flow test choose `ปรมาจารย์มังกร`, start the mission, assert `หัวใจเหลือ 2 จาก 2`, reload and reopen the level, then assert the dragon radio remains selected.

Run: `npm.cmd run test:e2e -- --grep "difficulty"`

Expected: FAIL until the full flow is wired.

- [ ] **Step 2: Add responsive mission checks**

For each viewport, navigate to level 1, select adventurer, start, and assert `documentElement.scrollWidth <= clientWidth + 1`. Also assert the mission arena and HUD bounding boxes do not overlap the center answer area.

- [ ] **Step 3: Run complete automated gates**

Run: `npm.cmd test`

Expected: all Vitest tests PASS with zero failures.

Run: `npm.cmd run validate-content`

Expected: 75/75 missions, 0 warnings, 0 errors.

Run: `npm.cmd run build`

Expected: exit code 0.

Run: `npm.cmd run test:e2e`

Expected: all Playwright scenarios PASS.

- [ ] **Step 4: Perform screenshot playtest**

Capture Home, Chapter, Map, Mission playing, Mission correct, Mission wrong, Result and Guardian/Victory states at 375x812, 768x1024 and 1440x900. Review Chinese-fantasy recognition, HUD obstruction, CTA hierarchy, animation state readability, touch targets and reduced motion. Fix any P0/P1 visual issue and rerun the affected test.

- [ ] **Step 5: Update report and commit**

Record exact test counts, browser, date, screenshots and any device-only limitations in `PLAYTEST_REPORT.md`.

```powershell
git add tests/e2e/game-flow.spec.js tests/e2e/responsive.spec.js PLAYTEST_REPORT.md
git commit -m "test: verify adventure difficulty and responsive game flow"
```

---

## Final Verification Checklist

- [ ] Difficulty selector appears before each level and persists the last selection
- [ ] Traveler has 5 hearts, Adventurer 3, Dragon 2
- [ ] Combo rises only on consecutive correct answers and resets on wrong/timeout
- [ ] Timer pauses with the game and cleans up on navigation/unmount
- [ ] Hint counts/cost presentation matches selected difficulty
- [ ] Correct, wrong, timeout and reward states have distinct feedback
- [ ] Home, chapter, map, mission and result read as Chinese Fantasy Adventure rather than cosmic dashboard
- [ ] Existing content-safety and all 15 levels remain intact
- [ ] Desktop/mobile/reduced-motion checks pass
- [ ] Unit tests, content validator, build and Playwright complete with exit code 0
