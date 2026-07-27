# Dujeen Quest Responsive Audit

Date: 2026-07-27  
Working branch: `feat/responsive-game-ui-overhaul`  
Baseline branch: `feat/game-ui-overhaul-v3` at `d230375`

## Scope

This audit covers the current React presentation layer before responsive CSS changes. Game logic, mission data, stars, progress, sound, and local storage are out of scope for behavioral changes.

Baseline checks completed:

- Git worktree was clean before the responsive branch was created.
- Existing app was run at `http://127.0.0.1:5175/`.
- Home was inspected at 375x812, 768x1024, 1440x900, and 667x375.
- `src/index.css` contains 4,660 lines and two active responsive systems: legacy rules at 680/900/960 and v2 rules at 760/1100.
- The current visual direction is the dark floating-island / Star Gate theme and will be preserved.

## Baseline Measurements

| Viewport | Document size | Horizontal overflow | Observation |
|---|---:|---|---|
| 375x812 | 360x1347 | No | HUD, logo, copy, and actions consume the first viewport; mascot stage is below the fold |
| 768x1024 | 753x1300 | No | Home becomes one column at 1100px and leaves a long vertical composition |
| 1440x900 | 1440x900 | No | Two-column desktop composition is balanced and should remain the visual reference |
| 667x375 | 652x643 | No | Mobile-landscape still uses a tall stacked layout and requires vertical scrolling |

## Findings

| Severity | Page | Component | Selector | Screen size affected | Problem | Cause | Planned fix |
|---|---|---|---|---|---|---|---|
| High | All scenes | Root scene | `.scene`, `.v2-scene`, Tailwind `min-h-screen px-* py-*` | 320px-landscape through desktop | Each page owns different padding and uses viewport-height assumptions that do not account for mobile browser UI | Scene sizing is split between utility classes and legacy CSS; there is no shared safe-area container | Introduce `.dq-scene`, `.dq-container`, and `.dq-game-container` with `100svh`, safe-area padding, and shared max widths |
| High | All pages | Responsive cascade | `@media (max-width: 680px)`, `760px`, `960px`, `1100px`, `min-width: 900px` | All responsive sizes | Components can be controlled by legacy and v2 breakpoint families simultaneously | Mobile-first rules were added after desktop-first rules without consolidating ownership | Replace with canonical base/360/480/768/1024/1280/1536 rules and remove obsolete overlapping declarations |
| High | Home | Main layout | `.v2-home-grid` around line 2946 | 768px-1100px | Tablet uses a long one-column layout even when two balanced columns would fit | A single `max-width: 1100px` switches desktop directly to stacked mobile layout | Use explicit mobile, tablet, and desktop tracks; add compact landscape composition |
| High | Home | Player status | `.v2-status-hud` around line 2757 | 320px-760px | HUD takes too much vertical space and repeats long labels | Mobile rule creates three columns but forces player and XP to separate full rows | Build a two-row mobile HUD with compact icon stats and a full-width XP track |
| Medium | Home | Logo | `.v2-logo-mark span`, `.v2-logo-mark strong` around lines 2968-2976 | 320px-430px | Logo dominates the viewport and pushes actions down | Fixed 4.4rem/6.2rem desktop values and fixed 3rem/4rem mobile overrides | Use fluid logo tokens with `clamp()` and balanced wrapping |
| High | Home | Hero stage | `.v2-hero-stage` around line 3008 | 320px-1100px | Mascot scene is pushed below the fold and remains 430px tall on mobile | Fixed `min-height: 560px`, reduced only to `430px` below 760px | Use fluid `aspect-ratio`/`min-height`, compact ornament sizing, and a two-column low-height landscape variant |
| Medium | Home | Actions | `.v2-hero-actions` around line 2996 | 320px-479px | Four actions create a tall stack and compete with the hero | All actions become one column below 760px with no intermediate large-phone layout | Base one column; allow two-column secondary actions from 480px |
| Medium | Loading | Loading gate | `.v2-loading-gate`, `.v2-loading-gate h1` around lines 2885-2915 | 320px-390px and height <=500px | Gate padding and title are oversized for short screens | Fixed 2rem padding and 4.3rem/3rem title sizes | Apply fluid width, padding, title, mascot, and a compact two-column landscape state |
| High | Chapter Select | Chapter cards | `.v2-chapter-grid`, `.v2-chapter-portal` around lines 3095-3112 | 320px-1100px | Cards are taller than their content and tablet jumps between one and two columns without fluid spacing | `min-height: 440px` plus fixed three/two/one-column rules | Remove fixed minimum height; use controlled 1/2/3-column mobile-first grid |
| Medium | Chapter Select | Description | `.v2-chapter-portal p` around line 3158 | 320px-767px | Short descriptions reserve unnecessary blank space | Fixed `min-height: 96px` | Let content define height; align desktop rows through grid structure instead |
| Critical | Map | Route layout | `.v2-constellation-map`, `.v2-route-beam` around lines 3219-3244 | 320px-1100px | Tablet receives a full vertical route designed as a collapsed desktop grid; route alignment is fragile | Five desktop columns collapse to one column at 1100px while the beam is absolutely centered | Rebuild route as content-height mobile flow, tablet zigzag, and desktop five-node path |
| High | Map | Level cards | `.v2-level-island` around lines 3263-3275 | 320px-1100px | Cards are tall, visually heavy, and long titles can consume excessive height | Fixed `min-height: 268px`/`230px` and desktop ornament proportions | Remove fixed height, clamp ornament size, line-clamp title/topic, and use compact reward chips/actions |
| High | Game | Game layout | `.v2-game-layout` around line 3379 | 320px-1100px | Console becomes a full block above the mission, increasing scroll and separating status from play | Desktop side rail changes to a single column at 1100px without a dedicated mobile HUD | Move essential controls into a two-row mission HUD; keep Panda as a compact guide strip on mobile |
| High | Game | Panda guide | `.v2-panda-guide.compact` around lines 4243-4245 | All game sizes, especially 320px-768px | Visual size is reduced but its intrinsic layout remains desktop-sized | `transform: scale(0.78)` changes paint size, not the layout box | Replace scaling with a responsive `--panda-size` and real mobile/desktop layouts |
| Medium | Game | Header | `.v2-game-header`, `.v2-game-header h1` around lines 2862-2883 | 320px-760px | Back button, title, topic, and mission chip can create a tall header | Flex layout has no explicit mobile text track; chip is simply hidden | Add fixed 44px control track, `min-width: 0`, title ellipsis, and a second-line topic |
| High | Game | Mission arena | `.v2-mission-arena` and mission primitives | 320px-landscape through tablet | Mission-specific grids inherit page breakpoints rather than their available arena width | No container context exists for reusable mini-games | Set `container-type: inline-size` and use container queries for options, controls, and reward layouts |
| High | Pinyin | Builder equation | `.word-bank`, `.vowel-chip`, Pinyin layout selectors | 320px-390px | Large chips and equation spacing can crowd narrow cards | Fixed minimum chip dimensions and font sizes | Add wrapping, fluid chip sizes, and compact drop-zone tokens while preserving tap selection |
| High | Matching | Two-side board | Matching mission grid/SVG selectors | 320px-479px | Two narrow columns and connection lines become crowded on mobile | Desktop matching presentation remains active at small widths | Use sequential full-width selection on mobile and keep animated SVG connections for wider containers |
| High | Shopping | Product grid | `.shopping-grid`, `.shop-item` around lines 2305-2332 | 320px-479px | Two columns make product cards narrow and text dense | Base grid starts at two columns with 142px minimum card height | Start at one column, then 2/3/4 columns at 480/container/tablet/desktop sizes |
| High | Hanzi | Trace board | `.trace-board` around lines 2376-2389 | 320px-landscape and tablets | Board proportions vary with viewport rather than mission container; minimum height can exceed short screens | `height: min(52vw, 340px)` plus `min-height: 250px` | Use `aspect-ratio: 1`, `width: min(100%, 340px)`, DPR-aware resize, and a landscape board/control split |
| Medium | Result | Reward grid | `.v2-reward-grid`, `.v2-result-actions` | 320px-760px | Rewards and actions become long single-column stacks | One blanket mobile rule forces all named grids to one column | Use compact 2/3-column reward grids and one/two-column action rules based on container width |
| Medium | Knowledge | Collection grid | `.v2-library-command`, `.v2-category-dock`, `.v2-knowledge-grid` | 320px-1100px | Search/counter/categories consume vertical space; cards are oversized | Page breakpoint rules do not distinguish command bar from card grid | Use compact command stack, discoverable horizontal category rail, and 1/2/3/4 card columns |
| Medium | Achievements | Badge detail | `.v2-badge-grid`, `.v2-badge-detail` around line 4137 | 320px-760px | Detail panel becomes a long inline block and card density is inconsistent | Shared mobile flex-direction rule treats detail like unrelated components | Use one-column mobile medal list and a bounded modal/inline detail presentation |
| High | Victory | Final chamber | `.v2-final-chamber`, `.v2-arcane-chest`, `.v2-victory-stats` | 320px-760px | Fixed chest geometry and 620px chamber minimum can overflow short/mobile layouts | Desktop-sized absolute chest parts and fixed minimum heights | Drive chest geometry with fluid custom properties; use a 2-column mobile stat grid and content-driven chamber |
| High | Modal | Modal panel | `.v2-modal-panel`, `.v2-modal-actions` around lines 4180-4234 | Height <=500px and keyboard-open mobile | Content and actions can fall outside the visible area | No `100dvh` maximum height or internal scrolling; close target is only 40px | Add safe-area width, `max-height`, internal scroll, 44px close target, and stacked small-screen actions |
| High | All pages | Sound toggle | `.sound-toggle` around lines 1284-1303 and 4377 | 320px-430px | Fixed bottom-right control can cover navigation or submit buttons | Global fixed placement does not know page actions or safe-area action bars | Move sound into mobile HUD/settings; keep safe-area-aware fixed control only on desktop |
| Low | Performance | Continuous effects | `.v2-panda-guide`, star/reward effects around lines 4572-4599 | Low-power phones | A few ambient effects continue indefinitely even where space is constrained | Motion reduction is mostly viewport-based and not component-density-based | Reduce decoration and shadow layers on small/short viewports; preserve interaction/reward motion |

## Existing Responsive Ownership

- Legacy/base responsive blocks: lines 1802-1887 and 2560 onward.
- v2 layout blocks: lines 4402-4517.
- v2 performance/mobile block: lines 4519-4649.
- Reduced-motion blocks exist twice: around lines 2070 and 4651.
- The active UI is predominantly `v2-*`; older selectors remain in the same global file and should not govern v2 components after consolidation.

## Guardrails

- No `transform: scale()` or CSS `zoom` for responsive layout.
- Do not solve overflow only by hiding it at `body`.
- Preserve 1440x900 composition as the desktop reference.
- Do not change mission evaluation, reward calculation, local storage schema, or audio behavior.
- All interactive controls remain at least 44x44px.
- CSS changes begin only after this audit and the approved design are committed.
