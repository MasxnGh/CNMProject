# Dujeen Quest Responsive UI Overhaul Implementation Plan

> **For Codex:** Execute this plan checkpoint by checkpoint. Follow test-driven development: add a focused failing assertion, verify the expected failure, make the smallest presentation change, then rerun focused and regression checks.

**Goal:** Consolidate Dujeen Quest into a mobile-first responsive system that works from 320px phones through large desktop without changing game logic, persistence, mission content, rewards, or the accepted Star Gate art direction.

**Architecture:** Keep the existing React component tree and `v2-*` visual vocabulary. Add shared responsive tokens and scene/container primitives, consolidate global page breakpoints, and use container queries inside reusable mini-games. Small markup changes are allowed only to establish semantic layout regions, compact labels, and stable test hooks.

**Stack:** React 18, Vite 6, Tailwind CSS 3, Framer Motion 11, Lucide React, Vitest, Testing Library, Playwright.

---

## Global Checkpoint Protocol

Before every checkpoint commit:

1. Run the focused test added for the checkpoint.
2. Run `npm run test`.
3. Run `npm run build`.
4. Run `npm run validate-content`.
5. Run the relevant Playwright project/spec.
6. Inspect browser console for warnings/errors.
7. Check horizontal overflow at the checkpoint viewports.
8. Capture at least one representative screenshot.

Production deployment is prohibited. Only a Vercel branch Preview may be created after the full playtest.

## Task 1: Record The Responsive Baseline

**Files:**
- Add: `RESPONSIVE_AUDIT.md`
- Add: `docs/superpowers/specs/2026-07-27-dujeen-quest-responsive-overhaul-design.md`
- Add: `docs/superpowers/plans/2026-07-27-dujeen-quest-responsive-overhaul-plan.md`

**Step 1: Verify branch and worktree**

Run:

```powershell
git branch --show-current
git status --short
```

Expected: branch is `feat/responsive-game-ui-overhaul`; only the approved responsive documents are untracked.

**Step 2: Verify baseline behavior**

Run:

```powershell
npm run test
npm run build
npm run validate-content
npm run test:e2e
```

Expected: all existing tests pass before presentation changes.

**Step 3: Verify browser baseline**

Inspect Home at 375x812, 768x1024, 1440x900, and 667x375. Record console state and overflow metrics in the audit.

**Step 4: Commit**

```powershell
git add RESPONSIVE_AUDIT.md docs/superpowers/specs/2026-07-27-dujeen-quest-responsive-overhaul-design.md docs/superpowers/plans/2026-07-27-dujeen-quest-responsive-overhaul-plan.md
git commit -m "chore: audit responsive game UI"
```

## Task 2: Add Responsive Test Infrastructure

**Files:**
- Modify: `tests/e2e/responsive.spec.js`
- Add: `tests/e2e/responsive-helpers.js`
- Add: `tests/e2e/responsive-home.spec.js`
- Add: `tests/e2e/responsive-game.spec.js`
- Modify: `playwright.config.js`

**Step 1: Write failing layout assertions**

Add reusable helpers for:

- document overflow
- visible elements outside the viewport
- control dimensions below 44x44
- bounding-box overlap between fixed sound control and primary actions
- maximum mobile HUD row count/height

Create named viewport fixtures for 320x568, 375x812, 390x844, 768x1024, 1024x768, 1440x900, and short landscape.

**Step 2: Run and confirm failure**

```powershell
npx playwright test tests/e2e/responsive-home.spec.js
```

Expected: current Home fails at least mobile first-viewport/HUD sizing or landscape composition assertions. Failures must identify the offending selector and viewport.

**Step 3: Keep tests diagnostic**

Do not relax assertions to make the baseline pass. Screenshot failures to `test-results` and emit measured dimensions in error messages.

## Task 3: Consolidate Breakpoints And Add Fluid Tokens

**Files:**
- Add: `src/styles/responsive-tokens.css`
- Modify: `src/main.jsx`
- Modify: `src/index.css`
- Add: `RESPONSIVE_BREAKPOINTS.md`

**Step 1: Add token contract test**

Extend responsive Playwright coverage to verify:

- `--dq-control-height` computes to at least 44px.
- page scene has `min-width: 0`.
- page scene uses `100svh` support/fallback.
- root containers have symmetric inline padding.

Run the focused test and confirm failure because tokens do not exist.

**Step 2: Create tokens and primitives**

Implement:

- fluid spacing, radius, typography, control, and size tokens
- `.dq-scene`
- `.dq-container`
- `.dq-game-container`
- safe-area padding
- default `min-width: 0` and media sizing safeguards

Import tokens before `index.css` rules through `src/main.jsx`.

**Step 3: Consolidate responsive ownership**

Convert active v2 page layout rules to base mobile styles with canonical `min-width` breakpoints. Remove obsolete 760/1100 v2 layout overrides as their declarations move to canonical blocks. Do not change mini-game layouts yet.

**Step 4: Document**

Record breakpoint purpose, page/container ownership, and exceptions in `RESPONSIVE_BREAKPOINTS.md`.

**Step 5: Verify and commit**

Commit checkpoints:

```text
refactor: consolidate responsive breakpoints
style: add fluid spacing and typography tokens
```

Split the commits so breakpoint ownership and token introduction remain reviewable.

## Task 4: Rebuild Mobile Home And Player Status

**Files:**
- Modify: `src/components/HomePage.jsx`
- Modify: `src/components/PlayerStatus.jsx`
- Modify: `src/index.css`
- Modify: `tests/e2e/responsive-home.spec.js`
- Add/Modify: component tests for accessible compact labels

**Step 1: Add failing tests**

Assert at 320/375/390:

- Logo stays inside its container.
- Home actions do not overlap and primary action is full width.
- HUD uses at most two visual rows.
- Hero stage stays within the page container.
- all controls are at least 44px.

At 667x375 assert the Home uses a compact two-column landscape composition and primary action remains visible.

**Step 2: Implement the smallest layout changes**

- Add shared scene/container classes.
- Replace fixed logo sizes with tokens.
- Use one-column phone actions and two-column large-phone secondary actions.
- Recompose Player Status into compact stat and XP rows.
- Make Hero stage fluid with bounded ornaments.

Keep the 1440x900 reference visually unchanged.

**Step 3: Verify and commit**

```text
fix: rebuild mobile home and player status
```

## Task 5: Rebuild Chapter Select And Adventure Map

**Files:**
- Modify: `src/components/StageSelectPage.jsx`
- Modify: `src/components/MapPage.jsx`
- Modify: `src/components/LevelCard.jsx`
- Modify: `src/index.css`
- Add: `tests/e2e/responsive-map.spec.js`

**Step 1: Add failing tests**

Assert:

- Chapter cards are 1/2/3 columns at phone/tablet/desktop.
- Card height follows content and widths match within a row.
- Locked cards remain readable.
- Map nodes stay within the map container.
- Long Thai level names wrap without overflow.
- Mobile route is vertical and content-height.
- Tablet route does not use the stretched phone layout.

**Step 2: Implement Chapter layout**

Remove fixed card/description minimum heights. Add content-driven footer placement and fluid emblem dimensions.

**Step 3: Implement Map layout**

Use a vertical route on phones, restrained zigzag on tablets, and five-node constellation on desktop. Route beams must align to node centers without contributing to layout dimensions.

**Step 4: Verify and commit**

```text
fix: rebuild responsive chapter and adventure map
```

## Task 6: Rebuild Game Header, Mission HUD, And Panda Guide

**Files:**
- Modify: `src/components/GamePage.jsx`
- Modify: `src/components/PlayerStatus.jsx`
- Modify: `src/components/PandaGuide.jsx`
- Modify: `src/components/PauseOverlay.jsx`
- Modify: `src/index.css`
- Add: `tests/e2e/responsive-game.spec.js`
- Modify: `src/components/GamePage.test.jsx`

**Step 1: Add failing tests**

Assert:

- Game header stays below 88px on phones.
- Title track has `min-width: 0` and long titles do not push controls offscreen.
- Mobile mission HUD uses no more than two rows.
- HUD does not overlap the mission arena.
- Panda bounding box never exceeds its container.
- no responsive Panda `transform: scale()` is applied.
- Pause remains keyboard-accessible.

**Step 2: Recompose markup**

Create semantic status groups for hearts/progress/pause and score/hint/sound. Preserve callbacks and reducer behavior. Use compact accessible labels rather than removing information.

**Step 3: Implement responsive Panda**

Drive Panda geometry from `--panda-size`. Phones use a guide strip; desktop uses the side rail.

**Step 4: Verify and commit**

```text
fix: rebuild mobile mission HUD and panda guide
```

## Task 7: Make Every Mission Type Container Responsive

**Files:**
- Modify: `src/components/QuestionRenderer.jsx`
- Modify as needed:
  - `src/components/ChoiceMission.jsx`
  - `src/components/PinyinDragMission.jsx`
  - `src/components/ToneChoiceMission.jsx`
  - `src/components/AudioChoiceMission.jsx`
  - `src/components/MatchingMission.jsx`
  - `src/components/SentenceOrderMission.jsx`
  - `src/components/ShoppingMission.jsx`
  - `src/components/HanziTraceMission.jsx`
  - `src/components/FillBlankMission.jsx`
  - `src/components/CultureQuizMission.jsx`
  - `src/components/FinalBossMission.jsx`
- Modify: `src/index.css`
- Modify: `src/components/MiniGameMissions.test.jsx`
- Add: `tests/e2e/responsive-missions.spec.js`

**Step 1: Read TDD test quality guidance**

Read `superpowers:test-driven-development/references/writing-good-tests.md` before modifying tests.

**Step 2: Add failing tests by mission family**

Test:

- Pinyin equation/chips wrap at 320px; tap and drag remain functional.
- Tone choices use 2x2 small and 4-column wide layouts.
- Audio wave does not alter layout.
- Matching is sequential/line-free on mobile and keeps animated connections on wide layouts.
- Sentence chips and controls wrap.
- Shopping uses 1/2/3/4 columns.
- Hanzi board is square, inside viewport, resizes for DPR, and supports clear/draw.
- Dialogue bubbles fit.
- Final Boss decoration does not expand layout.

**Step 3: Add container ownership**

Set mission stage/mission shell container context. Use container queries for reusable component composition and page queries only for scene-level landscape handling.

**Step 4: Improve Hanzi resize safely**

Use `ResizeObserver` to reconfigure the backing canvas when the CSS board changes. Preserve current strokes where feasible or clear predictably only before interaction. Cleanup observer on unmount.

**Step 5: Verify and commit**

```text
fix: make all mission types responsive
```

## Task 8: Improve Result, Library, Achievements, Victory, Modal, And Sound

**Files:**
- Modify:
  - `src/components/ResultPage.jsx`
  - `src/components/KnowledgeLibrary.jsx`
  - `src/components/AchievementPage.jsx`
  - `src/components/VictoryPage.jsx`
  - `src/components/Modal.jsx`
  - `src/components/SoundToggle.jsx`
  - `src/components/PauseOverlay.jsx`
  - `src/App.jsx`
  - `src/index.css`
- Add: `tests/e2e/responsive-collection.spec.js`
- Add: `tests/e2e/responsive-overlays.spec.js`

**Step 1: Add failing tests**

Assert:

- Result actions are visible and rewards stay compact.
- Collection cards use correct column counts.
- category rail is keyboard/touch usable.
- badge detail does not cover cards.
- Victory chest and certificate fit 320px.
- modal is within safe area and scrolls on short screens.
- sound toggle never overlaps primary page actions.

**Step 2: Implement page layouts**

Use existing content and callbacks. Change only layout grouping/test hooks where needed.

**Step 3: Move mobile sound access**

Hide the global fixed control only where an equivalent sound control exists in the mobile HUD/settings. Keep a discoverable Home/settings control and preserve `soundEnabled`.

**Step 4: Verify and commit**

```text
fix: improve responsive result and collection pages
```

## Task 9: Add Short-Landscape And Safe-Area Support

**Files:**
- Modify: `src/index.css`
- Modify: `src/styles/responsive-tokens.css`
- Modify: responsive E2E specs

**Step 1: Add failing landscape tests**

Cover 568x320, 667x375, 740x360, and 844x390:

- Loading progress remains visible.
- Home primary action remains visible.
- Game header/HUD leaves usable mission space.
- Hanzi board and controls are both reachable.
- Modal actions are reachable.

**Step 2: Implement one bounded landscape query**

Use `@media (max-height: 500px) and (orientation: landscape)` for density and scene composition only. Do not hide essential content or controls.

**Step 3: Verify and commit**

```text
fix: support mobile landscape and safe areas
```

## Task 10: Full Visual Regression And Playtest

**Files:**
- Modify: `tests/e2e/responsive.spec.js`
- Add/Modify visual E2E helpers/specs
- Add screenshots under `artifacts/responsive/`
- Add: `RESPONSIVE_PLAYTEST.md`

**Step 1: Add all requested viewports**

Run overflow and critical UI checks across all 18 requested sizes.

**Step 2: Capture canonical screens**

Capture Loading, Home, Chapters, Map, Mission Intro, each mission family, correct/wrong feedback, Result, Library, Achievements, Pause, Final Boss, and Victory. Store representative artifacts under:

```text
artifacts/responsive/320/
artifacts/responsive/375/
artifacts/responsive/390/
artifacts/responsive/768/
artifacts/responsive/1024/
artifacts/responsive/1440/
```

**Step 3: Playtest game flow**

Verify boot, chapter/map navigation, locked levels, mission input, stars, repeat-play star preservation, refresh persistence, reset confirmation, final boss, and Victory.

**Step 4: Record findings**

Document viewport, route, issue severity, result, console state, screenshot path, and residual risks in `RESPONSIVE_PLAYTEST.md`.

**Step 5: Commit**

```text
test: add responsive visual regression coverage
```

## Task 11: Remove Obsolete Responsive Rules

**Files:**
- Modify: `src/index.css`
- Modify: `RESPONSIVE_BREAKPOINTS.md`
- Add: `RESPONSIVE_CHANGELOG.md`

**Step 1: Find stale rules**

Run:

```powershell
rg -n "@media|transform:\s*scale|width:\s*190%|min-height:\s*(440|520|620|960)px" src/index.css
```

Confirm each remaining fixed value is an intentional artwork dimension, not layout sizing.

**Step 2: Remove obsolete ownership**

Delete unused legacy/v2 responsive declarations and duplicate reduced-motion blocks. Do not add a final override layer.

**Step 3: Document change set**

Complete `RESPONSIVE_CHANGELOG.md` with branch, changed files, removed media queries, new breakpoints, corrected fixed dimensions, overflow fixes, device results, artifact paths, build result, and residual issues.

**Step 4: Verify and commit**

```text
chore: remove obsolete responsive overrides
```

## Task 12: Final Verification And Vercel Preview

**Files:**
- Finalize: `RESPONSIVE_CHANGELOG.md`
- Finalize: `RESPONSIVE_PLAYTEST.md`

**Step 1: Run clean verification**

```powershell
npm install
npm run validate-content
npm run test
npm run build
npm run test:e2e
```

Expected:

- no build errors
- no important console errors/warnings
- all game and responsive tests pass
- no horizontal overflow
- no covered controls
- all mission families remain playable

**Step 2: Review React performance**

Apply the React best-practices review to changed components. Verify timer, speech, resize observer, and animation cleanup.

**Step 3: Push branch and create Preview**

Push `feat/responsive-game-ui-overhaul` and deploy a Vercel Preview only. Do not promote to production.

**Step 4: Verify Preview**

Repeat smoke checks at 375x812, 768x1024, 1024x768, 1440x900, and 667x375 against the Preview URL.

**Step 5: Final report**

Report:

- issues found and corrected
- files changed
- breakpoints and mission layouts
- mobile/landscape improvements
- automated/playtest/build results
- Preview URL
- genuine remaining issues
