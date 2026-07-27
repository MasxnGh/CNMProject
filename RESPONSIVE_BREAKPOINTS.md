# Dujeen Quest Responsive Breakpoints

## Canonical Page Breakpoints

| Range | Rule | Purpose |
| --- | --- | --- |
| Mobile | base styles | Single-column page layouts, compact headings, stacked actions, and vertical map routes. |
| Tablet | `min-width: 48rem` (768px) | Restore multi-action controls, larger headings, two-column content grids, and the full HUD arrangement. |
| Desktop | `min-width: 64rem` (1024px) | Enable side-by-side Home and Game layouts, three-column collections, two-column result details, and horizontal constellation routes. |

The active V2 page layouts in `src/index.css` own their mobile base styles. Enhancements belong in the canonical `48rem` and `64rem` blocks rather than new `max-width` page overrides.

## Shared Primitives

`src/styles/responsive-tokens.css` owns the responsive token contract and the shared primitives:

- `.dq-scene` provides `min-width: 0`, `100vh` fallback with `100svh` support, safe-area-aware symmetric inline padding, and fluid page spacing.
- `.dq-container` centers regular page content at `--dq-content-max`.
- `.dq-game-container` uses the wider `--dq-game-content-max` for gameplay, result, and victory pages.

Every V2 page root opts into `.dq-scene`; page content uses one of the container primitives. Media, canvas, and SVG sizing safeguards are global to prevent intrinsic content from forcing horizontal overflow.

## Exceptions

- `@media (max-height: 500px) and (orientation: landscape)` is the single owner for short-landscape page layout. It compacts the Home composition without creating a separate breakpoint family. Task 9 extends this exact query when it needs additional short-landscape layout work.
- Legacy `680px`, `900px`, and `960px` rules remain outside the V2 page foundation and are not ownership for this task.
- The remaining V2 `max-width: 760px` block is a performance and decorative-art exception only: it hides expensive ambient elements and reduces paint work. It does not set page layout tracks, spacing, or container ownership.
- Mini-game interaction internals remain owned by their existing component styles. This foundation preserves their prior mobile panel dimensions without redesigning their controls or mechanics.
