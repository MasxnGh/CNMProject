# Dujeen Quest Content-safe Adventure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ปิดเฉลยรั่วใน Mission ทั้ง 75 ข้อ ปรับ state flow และ mini-game ให้เป็นเกมผจญภัยที่เล่นได้จริง พร้อม Pause, responsive controls, content validator และ end-to-end playtest โดยรักษาระบบดาวและ Local Storage เดิม

**Architecture:** ย้าย Mission ไปยัง contract `beforeAnswer/answer/afterAnswer` และให้ game engine เป็นผู้ถือเฉลย ส่วน renderer รับเฉพาะ public view model ระหว่างเล่น ใช้ reducer ควบคุม Intro/Playing/Feedback/Pause/Result และแยก mini-game interaction ออกจากการคำนวณดาวและ persistence

**Tech Stack:** React 18, Vite 6, Tailwind CSS 3, Framer Motion 11, Lucide React, Web Speech API, Web Audio API, Local Storage, Vitest, Testing Library, Playwright

## Global Constraints

- แก้จากโปรเจกต์เดิม ห้ามสร้างโปรเจกต์ใหม่
- รักษา 15 ด่าน 75 Mission และระบบ `levelStars`, `totalStars`, XP, Coins, Badge, Knowledge
- ห้าม render `answer`, `correctAnswer`, `correctSequence`, `finalPinyin`, `afterAnswer.explanation` ก่อนสถานะ feedback
- Pinyin Drag ต้องรองรับ mouse drag และ mobile tap
- Hanzi Writing ต้องรองรับ mouse, touch และ stylus โดยไม่อ้างว่าเป็น AI handwriting recognition
- ทุก test ใช้ isolated Local Storage ห้ามแก้ progress ผู้ใช้
- จออ้างอิง: 375x812, 768x1024, 1440x900
- Animation ใช้ transform/opacity เป็นหลักและรองรับ reduced motion
- Git metadata ใน workspace ปัจจุบันไม่สมบูรณ์ จึงรัน commit steps ได้เมื่อ repository ถูกเชื่อมคืนเท่านั้น

---

### Task 1: Test Tooling และ Content Validator

**Files:**
- Modify: `package.json`
- Create: `src/utils/contentLeakValidator.js`
- Create: `scripts/validate-content.mjs`
- Create: `src/utils/contentLeakValidator.test.js`
- Create: `vitest.config.js`

**Interfaces:**
- Consumes: `levels` จาก `src/data/levels.js`
- Produces: `validateMission(mission)`, `validateLevels(levels)`, CLI `npm run validate-content`

- [ ] **Step 1: เพิ่ม test scripts และ dependencies**

เพิ่ม scripts:

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "validate-content": "node scripts/validate-content.mjs",
  "test:e2e": "playwright test"
}
```

เพิ่ม devDependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@playwright/test`

- [ ] **Step 2: เขียน failing validator tests**

```js
import { describe, expect, it } from "vitest";
import { validateMission } from "./contentLeakValidator";

const base = {
  id: "9-1",
  levelId: 9,
  type: "pinyinDrag",
  beforeAnswer: { title: "ประกอบเสียง", instruction: "เติมช่องว่าง", pinyinPattern: "m _ o", options: ["a", "e", "i", "u"] },
  answer: { correctAnswer: "a", finalPinyin: "māo" },
  afterAnswer: { chineseText: "猫", pinyin: "māo", thaiMeaning: "แมว", explanation: "m + ao = māo" },
  hint: "ลงท้ายคล้ายเสียง เอา",
};

it("rejects final pinyin in before-answer copy", () => {
  const result = validateMission({ ...base, beforeAnswer: { ...base.beforeAnswer, title: "ประกอบ māo" } });
  expect(result.errors.map((item) => item.code)).toContain("PINYIN_FINAL_VISIBLE");
});

it("does not flag a one-letter answer by substring", () => {
  expect(validateMission(base).errors).toEqual([]);
});
```

- [ ] **Step 3: รัน test ให้ล้ม**

Run: `npm.cmd test -- src/utils/contentLeakValidator.test.js`  
Expected: FAIL เพราะ module ยังไม่มี

- [ ] **Step 4: Implement pure validator**

สร้างผลลัพธ์รูปแบบ:

```js
export const validateMission = (mission) => ({
  missionId: mission.id,
  errors: [],
  warnings: [],
});

export const validateLevels = (levels) => ({
  total: 75,
  passed: 0,
  warnings: [],
  errors: [],
  missions: [],
});
```

ใช้ type-specific token normalization: Unicode NFD, ตัด combining tone mark เฉพาะเมื่อเทียบพินอินเต็ม, เทียบ Chinese token แบบ exact และไม่ใช้ substring สำหรับ answer ยาวหนึ่งตัวอักษร

- [ ] **Step 5: เพิ่ม fixture ครบกฎ**

เพิ่ม tests สำหรับ Tone, Audio, Sentence, Fill, Matching, duplicate options, missing correct option, direct hint และ missing after-answer fields

- [ ] **Step 6: สร้าง CLI output และรัน baseline**

```js
const result = validateLevels(levels);
console.log("CONTENT VALIDATION");
console.log(`- Total missions: ${result.total}`);
console.log(`- Passed: ${result.passed}`);
console.log(`- Warnings: ${result.warnings.length}`);
console.log(`- Errors: ${result.errors.length}`);
process.exitCode = result.errors.length ? 1 : 0;
```

Expected baseline: command FAIL และชี้ Mission ที่อยู่ใน `CONTENT_LEAK_REPORT.md`

---

### Task 2: Mission Data Contract และ Migration ครบ 75 ข้อ

**Files:**
- Modify: `src/data/levels.js`
- Modify: `src/utils/contentLeakValidator.test.js`
- Create: `src/data/levels.test.js`

**Interfaces:**
- Produces Mission shape: `{ id, levelId, type, beforeAnswer, answer, afterAnswer, hint, audioText, reward, mechanics? }`
- Preserves: `level.questions`, `level.knowledge`, `level.reward`, `level.badgeUnlock`

- [ ] **Step 1: เขียน shape tests**

```js
it("exports 15 levels with exactly 75 safe missions", () => {
  expect(levels).toHaveLength(15);
  expect(levels.flatMap((level) => level.questions)).toHaveLength(75);
  for (const level of levels) {
    expect(level.questions).toHaveLength(5);
    for (const mission of level.questions) {
      expect(mission.levelId).toBe(level.id);
      expect(mission.beforeAnswer).toBeTruthy();
      expect(mission.answer).toBeTruthy();
      expect(mission.afterAnswer.explanation).toBeTruthy();
    }
  }
});
```

- [ ] **Step 2: รันให้ล้มกับ flat schema เดิม**

Run: `npm.cmd test -- src/data/levels.test.js`  
Expected: FAIL ที่ `beforeAnswer`

- [ ] **Step 3: เปลี่ยน mission constructors**

ใช้ helper เดียว:

```js
const mission = ({ levelId, order, type, beforeAnswer, answer, afterAnswer, hint, audioText, mechanics }) => ({
  id: `${levelId}-${order}`,
  levelId,
  type,
  beforeAnswer,
  answer,
  afterAnswer,
  hint,
  audioText,
  mechanics,
  reward: { score: 20 },
});
```

Constructors แต่ละ type map fields อย่างชัดเจน ห้าม copy `pinyin` เข้า `beforeAnswer` ของ Tone/Fill/Audio/Sentence

- [ ] **Step 4: แก้ immediate leaks ทั้ง 30 Mission**

ใช้รายการใน `CONTENT_LEAK_REPORT.md` เป็น acceptance checklist โดยเฉพาะ 9-1:

```js
beforeAnswer: { chineseText: "猫", thaiMeaning: "แมว", pinyinPattern: "m _ o", options: ["a", "e", "i", "u"] },
answer: { correctAnswer: "a", finalPinyin: "māo" },
afterAnswer: { chineseText: "猫", pinyin: "māo", thaiMeaning: "แมว", explanation: "m + ao รวมเป็น māo และใช้เสียงที่ 1" },
hint: "คำนี้ลงท้ายด้วยเสียงคล้ายคำว่า เอา",
```

- [ ] **Step 5: แก้ direct hints และ Shopping/Matching content**

Matching hint เปลี่ยนจาก `จีน = ไทย` เป็น cue ของหมวด/ลักษณะคำ; Audio hint ใช้จำนวนพยางค์/tone contour; Shopping ไม่ใส่ target Thai translation ก่อนตอบ

- [ ] **Step 6: รัน validator จนผ่าน 75/75**

Run: `npm.cmd run validate-content`  
Expected: `Total missions: 75`, `Errors: 0`

---

### Task 3: Safe Mission View Model และ Renderer

**Files:**
- Create: `src/utils/missionViewModel.js`
- Create: `src/utils/missionViewModel.test.js`
- Modify: `src/components/QuestionRenderer.jsx`
- Modify: `src/components/ChoiceMission.jsx`
- Modify: `src/components/AudioChoiceMission.jsx`
- Modify: `src/components/FillBlankMission.jsx`
- Modify: `src/components/ToneChoiceMission.jsx`
- Modify: `src/components/CultureQuizMission.jsx`
- Modify: `src/components/FinalBossMission.jsx`

**Interfaces:**
- `getMissionView(mission, phase)` where phase is `playing | feedback`
- `QuestionRenderer({ missionView, onSubmit, disabled, feedback })`

- [ ] **Step 1: เขียน failing no-leak view tests**

```js
it("never exposes answer fields while playing", () => {
  const view = getMissionView(mission, "playing");
  expect(JSON.stringify(view)).not.toContain("correctAnswer");
  expect(JSON.stringify(view)).not.toContain("finalPinyin");
  expect(JSON.stringify(view)).not.toContain("explanation");
});
```

- [ ] **Step 2: Implement view model**

```js
export const getMissionView = (mission, phase) => phase === "feedback"
  ? { ...mission.beforeAnswer, ...mission.afterAnswer, id: mission.id, type: mission.type }
  : { ...mission.beforeAnswer, id: mission.id, type: mission.type };
```

ห้ามส่ง `mission.answer` เข้า renderer props

- [ ] **Step 3: Refactor ChoiceMission**

ให้ ChoiceMission รับ `view.options`; feedback รับ `{ selectedValue, correctOption, explanation }` เฉพาะหลัง engine ตรวจแล้ว และ render after-answer panel เฉพาะ feedback

- [ ] **Step 4: Refactor QuestionRenderer dispatch**

ทุก branch ส่ง `missionView` เท่านั้น ไม่มี `{ ...question }` fallback ที่พา answer fields ลง child

- [ ] **Step 5: Component leak tests**

Render Tone/Fill/Audio/Sentence/Pinyin ด้วย Testing Library และ assert ว่า final pinyin/transcript/full sentence ไม่อยู่ก่อน submit แต่ปรากฏหลัง feedback

---

### Task 4: Game State Machine, Mission Intro และ Pause

**Files:**
- Create: `src/utils/gameSessionReducer.js`
- Create: `src/utils/gameSessionReducer.test.js`
- Create: `src/components/MissionIntro.jsx`
- Create: `src/components/PauseOverlay.jsx`
- Modify: `src/components/GamePage.jsx`
- Modify: `src/App.jsx`
- Modify: `src/utils/storage.js`

**Interfaces:**
- `createGameSession(level)`
- `gameSessionReducer(state, action)` actions: `START`, `ANSWER`, `CONTINUE`, `USE_HINT`, `PAUSE`, `RESUME`, `RESTART`, `FINISH`

- [ ] **Step 1: Reducer tests**

Test start state, correct/wrong answer, heart loss, hint score penalty, pause input lock, continue next Mission, result, and restart

- [ ] **Step 2: Implement reducer without timers**

Reducer เป็น pure state; UI timer/transition dispatch action เท่านั้น เพื่อ cleanup ได้

- [ ] **Step 3: Add Mission Intro**

Intro ใช้ level metadata และรายการ type ที่ dedupe ไม่ใช้ mission question/options แสดง CTA เริ่มทันทีและ Skip intro setting

- [ ] **Step 4: Add Pause Overlay**

Overlay มี Resume, Sound, Reduced Motion, Restart Level, Back to Map; background input disabled และ Escape toggle

- [ ] **Step 5: Fix timer and navigation race**

ใช้ `timeoutRef`; `clearPendingTransition()` ถูกเรียกก่อน Map, Pause, Restart, level change และ unmount

- [ ] **Step 6: Add keyboard and scroll/focus behavior**

Scene change เรียก `window.scrollTo({ top: 0 })`; Escape pause, Enter check/continue, 1-4 select, Space audio โดย ignore เมื่อ focus อยู่ input/button ที่ไม่เกี่ยวข้อง

- [ ] **Step 7: Test persistence schema migration**

เพิ่ม `reducedMotion` และ `skipMissionIntro` ด้วย defaults โดย save เก่าไม่มี field ต้อง load ได้เหมือนเดิม

---

### Task 5: Mini-game Interaction Upgrades

**Files:**
- Modify: `src/components/PinyinDragMission.jsx`
- Modify: `src/components/ToneChoiceMission.jsx`
- Modify: `src/components/AudioChoiceMission.jsx`
- Modify: `src/components/MatchingMission.jsx`
- Modify: `src/components/SentenceOrderMission.jsx`
- Modify: `src/components/ShoppingMission.jsx`
- Modify: `src/components/HanziTraceMission.jsx`
- Create: `src/utils/hanziCoverage.js`
- Create: `src/utils/hanziCoverage.test.js`

**Interfaces:**
- Mini-game emits `onSubmit(candidate, metrics?)`; parent engine owns correctness
- Hanzi result: `{ strokeCount, pointCount, boundsCoverage, quadrantCoverage, passed }`

- [ ] **Step 1: Pinyin drag/tap tests**

Test tap option -> tap drop zone, drag/drop candidate, wrong reset, correct combination visible only after feedback

- [ ] **Step 2: Matching shuffle and mobile presentation**

สร้าง `shuffleWithSeed(items, seed)`; seed เปลี่ยนเมื่อ retry ทั้ง left/right มี order แยกกัน Desktop lines ใช้ port endpoints; CSS media query ซ่อน lines และใช้ matched tray บน mobile

- [ ] **Step 3: Tone graph และ Audio playing state**

Tone options แสดง contour icon; Audio button ตั้ง speaking state จาก utterance events และ cancel เมื่อ unmount

- [ ] **Step 4: Sentence/Shopping polish**

Sentence ใช้ Thai target ก่อนตอบ มี Undo/Clear/Check; Shopping มี basket count และ card motion แต่ไม่แสดง direct translation pair

- [ ] **Step 5: Hanzi coverage tests**

```js
expect(scoreStrokeSet(pointsAcrossCharacter, canvasSize).passed).toBe(true);
expect(scoreStrokeSet(pointsInTinyCorner, canvasSize).passed).toBe(false);
```

- [ ] **Step 6: Hanzi Practice/Challenge implementation**

เก็บ stroke arrays เพื่อ Undo; Practice guide ตลอดและไม่เสียหัวใจ; Challenge preview 2.5s, hint แสดง guideและแจ้ง parent ใช้ hint; canvas uses pointer capture and prevents touch scrolling

---

### Task 6: Rewards, Final Boss และ Sound Manager

**Files:**
- Modify: `src/utils/gameLogic.js`
- Modify: `src/utils/gameLogic.test.js`
- Modify: `src/utils/speech.js`
- Create: `src/utils/soundManager.js`
- Modify: `src/components/FinalBossMission.jsx`
- Modify: `src/components/GamePage.jsx`
- Modify: `src/components/ResultPage.jsx`

**Interfaces:**
- `completeLevel(progress, level, performance)` where performance includes correct, hintsUsed, score, missionMetrics
- `soundManager.play(name)`, `.setEnabled(value)`, `.dispose()`

- [ ] **Step 1: Reward regression tests**

Test 3/2/1/0 stars, best stars never decrease, no unlimited repeat reward, newRecord flag, level 15 victory

- [ ] **Step 2: Cap replay rewards**

First clear/new stars award configured XP/Coins; equal/lower replay gives no economy reward but Result can show practice completion

- [ ] **Step 3: AudioContext singleton**

สร้าง context เมื่อ user gesture ครั้งแรก, reuse oscillator/gain graph, resume when suspended, cancel speech and close context on dispose

- [ ] **Step 4: Boss phases and HP**

Map Mission 1-2 to sound gate, 3-4 sentence/seal, 5 final seal; derive HP from completed correct Mission count, animate damage only on correct answer

- [ ] **Step 5: Result new-record presentation**

ดาวเด้งตาม count, rewards แสดงเฉพาะที่ได้จริง, knowledge 2-5 cards, CTA Next/Map/Replay

---

### Task 7: Page UI, Responsive และ Performance Pass

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/components/LoadingScreen.jsx`
- Modify: `src/components/HomePage.jsx`
- Modify: `src/components/StageSelectPage.jsx`
- Modify: `src/components/MapPage.jsx`
- Modify: `src/components/PlayerStatus.jsx`
- Modify: `src/components/KnowledgeLibrary.jsx`
- Modify: `src/components/AchievementPage.jsx`
- Modify: `src/components/VictoryPage.jsx`
- Modify: `src/index.css`

**Interfaces:**
- Home receives `onContinue` and derived compact status
- Scene components keep existing callbacks and progress contract

- [ ] **Step 1: Lazy-load secondary scenes**

ใช้ `React.lazy` สำหรับ Knowledge, Achievement, Victory และ preload via idle/hover; Loading/Home/Game stay eager

- [ ] **Step 2: Loading readiness**

ใช้ font/document readiness + minimum 700ms + maximum 1200ms; progress derives from readiness milestones and reduced-motion skips nonessential particles

- [ ] **Step 3: Home first viewport**

375x812 ต้องเห็น logo, mascot signal, Continue/Start CTA และ star chip โดยไม่ถูก full HUD ดันลง

- [ ] **Step 4: Chapter/Map responsive paths**

Desktop path alternates nodes with depth layers; mobile vertical path cards preserve 44px targets, no horizontal overflow, locked message short

- [ ] **Step 5: Remove duplicate HUD and CSS generations**

Game scene uses compact mission HUD only; remove obsolete selectors only after `rg` confirms no component references; retain content-visibility for long card lists

- [ ] **Step 6: Responsive screenshot assertions**

Check scrollWidth equals clientWidth, no text clipping and primary CTA visible at 375/768/1440

---

### Task 8: End-to-end Playtest, Screenshots และ Reports

**Files:**
- Create: `playwright.config.js`
- Create: `tests/e2e/game-flow.spec.js`
- Create: `tests/e2e/content-safety.spec.js`
- Create: `tests/e2e/mission-inputs.spec.js`
- Create: `PLAYTEST_REPORT.md`
- Update: `AUDIT_REPORT.md`
- Update: `CONTENT_LEAK_REPORT.md`

**Interfaces:**
- Tests use helper `seedProgress(page, progress)` before app load in isolated context
- Screenshots output to test artifacts, not production source

- [ ] **Step 1: E2E smoke and lock tests**

Loading -> Home -> Chapter -> Map, first level available, locked levels disabled, reset confirm modal

- [ ] **Step 2: Content safety tests**

Assert Pinyin final absent before answer/present after; Audio transcript absent before/present after; Sentence full Chinese absent before/present after

- [ ] **Step 3: Input tests**

Pinyin mouse drag + mobile tap, Sentence order, Matching shuffle, Hanzi draw/clear, Escape pause, Space audio

- [ ] **Step 4: Progress tests**

Finish 3 stars, replay lower score keeps old stars, refresh keeps progress, repeated clear does not inflate rewards

- [ ] **Step 5: Final Boss/Victory seeded test**

Seed 30 stars + level 14 complete, play level 15 phases, assert boss HP reaches zero and Victory renders

- [ ] **Step 6: Capture required screenshots**

Home desktop/mobile, Chapter, Map, Pinyin before/after, Hanzi, Result 3 stars, Final Boss, Victory ที่ viewports ตาม Global Constraints

- [ ] **Step 7: Full verification**

Run in order:

```powershell
npm.cmd run validate-content
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Expected: validator 75/75, all tests pass, Playwright pass, Vite build exit 0, no relevant console errors

- [ ] **Step 8: Write PLAYTEST_REPORT**

รายงาน environment, viewport, pass/fail 15 scenarios, screenshot paths, console health, performance observations และปัญหาที่ยังเหลือจริง

## Plan Self-review

- ครอบคลุม requirement หลัก: content safety, 75 Mission, star persistence, Pinyin, Hanzi, Matching, Audio, Sentence, Shopping, Boss, Intro, Pause, responsive, performance, tests และ reports
- ทุกขั้นมีไฟล์ คำสั่ง ผลลัพธ์ที่คาด และขอบเขตชัดเจน
- Interface หลักสอดคล้อง: Mission contract -> view model -> renderer -> reducer -> completion logic
- งานเรียงตาม dependency: validator ก่อน migration, data ก่อน renderer, renderer ก่อน state/UI, unit tests ก่อน E2E
