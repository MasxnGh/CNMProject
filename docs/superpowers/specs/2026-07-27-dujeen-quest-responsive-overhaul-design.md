# Dujeen Quest Responsive UI Overhaul Design

Date: 2026-07-27  
Branch: `feat/responsive-game-ui-overhaul`  
Status: Approved direction

## Objective

Make the existing Dujeen Quest game balanced, readable, touch-friendly, and performant from 320px phones through large desktops while preserving the accepted floating-island / Star Gate visual direction and all game behavior.

## Chosen Approach

Use a mobile-first consolidation rather than an override patch or component rewrite.

1. Map current selector ownership and remove overlapping responsive control.
2. Introduce shared responsive tokens and scene/container primitives.
3. Recompose page shells only where CSS cannot produce the intended information hierarchy.
4. Give mini-games container-aware layouts because their available width differs from the page viewport.
5. Add regression tests before each behavioral presentation change.

The existing `v2-*` visual classes remain the presentation vocabulary. No `v3-responsive`, `mobile-fix`, or final override namespace will be added.

## Responsive Architecture

### Page Breakpoints

- Base: 320px and above
- 360px: standard phone refinements
- 480px: large phone and secondary two-column controls
- 768px: tablet portrait
- 1024px: tablet landscape and small laptop
- 1280px: desktop
- 1536px: large desktop
- Special: below 360px
- Special: landscape with height at or below 500px

Page breakpoints control scene composition, page columns, navigation, and global density. Container queries control reusable mission content.

### Shared Primitives

- `.dq-scene`: safe-area-aware root with `min-height: 100svh` and clipped decorative overflow.
- `.dq-container`: centered page content up to 1280px.
- `.dq-game-container`: centered gameplay content up to 1120px.
- Fluid tokens for page padding, section gaps, card padding, radii, typography, controls, Panda size, and scene ornament density.

Existing Tailwind page padding utilities will be removed from scene roots once the shared primitives own spacing.

## Page Composition

### Loading

Use a bounded gate with fluid logo and padding. Short landscape screens use a compact two-column composition while retaining progress and status text.

### Home

Phones use one centered column with the primary action first and a compact mascot stage. Large phones can place secondary actions in two columns. Tablets receive a balanced composition rather than the current desktop-to-mobile jump. Desktop keeps the approved two-column visual reference.

The player HUD is reduced to two rows on mobile: player/level and compact stats, then XP. Long labels are visually hidden where icons and accessible labels communicate the same value.

### Chapters And Map

Chapter cards become content-driven at 1/2/3 columns. The map is a vertical content-height route on phones, a restrained zigzag on tablets, and the existing five-node constellation concept on desktop. Level cards no longer use fixed minimum heights.

### Game Shell

Mobile gameplay prioritizes the mission:

1. Compact game header.
2. Two-row mission HUD.
3. Panda guide strip.
4. Mission arena.

Desktop retains a real Panda/status side rail. The compact Panda uses actual responsive dimensions rather than visual scaling.

### Mini-games

The mission arena becomes a size container. Pinyin, options, shopping, dialogue, rewards, and Hanzi controls respond to arena width.

- Matching uses sequential full-width selection on phones and animated connections on wider containers.
- Shopping scales from 1 to 4 columns.
- Tone choices scale from 2x2 to four columns.
- Hanzi uses a square board, DPR-aware resizing, and a side-control layout in short landscape.
- Boss decoration is absolutely layered and reduced on mobile without changing boss logic.

### Results And Collections

Result rewards stay compact on phones instead of becoming one long card per row. Knowledge and badge collections use content-driven card grids and bounded detail surfaces. Victory chest geometry becomes fluid and the certificate remains readable without horizontal overflow.

### Overlays And Sound

Modal and pause panels are safe-area-aware, scroll internally, and remain usable with a short viewport or software keyboard. Sound moves into mobile game controls/settings; the fixed control remains only where it cannot cover primary actions.

## Motion And Performance

- Preserve interaction and reward animation.
- Reduce continuous ornament, shadow layers, and particles on small/short screens.
- Use transform and opacity for motion.
- Respect both `prefers-reduced-motion` and the saved in-game reduced-motion preference.
- Avoid animating layout dimensions continuously.

## Testing Strategy

Tests are added before responsive implementation changes:

- No horizontal document overflow.
- Touch targets are at least 44px.
- HUD stays within two rows on phones.
- Panda and mission content stay within their containers.
- Pinyin, Matching, Shopping, Sentence, and Hanzi remain playable on touch layouts.
- Modals and fixed controls do not cover primary actions.
- Landscape missions remain usable.
- Existing game-flow, content-safety, storage, stars, and final-boss tests remain green.

Visual checks cover all requested viewport families. Canonical screenshot artifacts are stored under `artifacts/responsive/{320,375,390,768,1024,1440}/`.

## Error And Regression Boundaries

- Presentation changes must not modify mission answers or evaluation.
- Existing progress must load without migration.
- A failed responsive assertion blocks its checkpoint commit.
- A failed build, important console warning, inaccessible action, or horizontal overflow blocks Vercel Preview.
- Production deployment is explicitly out of scope; only a branch Preview may be created after playtest passes.
