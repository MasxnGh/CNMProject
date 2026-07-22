# Dujeen Quest Playtest Report

วันที่ตรวจล่าสุด: 18 กรกฎาคม 2026  
Environment: Windows, React/Vite dev server, Chromium via Playwright 1.61.1

## Automated Results

| Scenario | Result | Evidence |
|---|---|---|
| Loading -> Home | PASS | Home CTA visible after the loading transition |
| Home -> Chapter Select -> Map | PASS | `game-flow.spec.js` |
| Locked chapter cannot enter | PASS | Chapter 2 button disabled with star requirement |
| First level opens | PASS | Level 1 Mission Intro visible |
| Pinyin pattern hides full answer | PASS | `m _ o` visible; `māo` absent before input |
| Audio pinyin hidden before answer | PASS | `content-safety.spec.js` |
| Sentence full answer hidden before input | PASS | `content-safety.spec.js` |
| Reset confirmation modal | PASS | `mission-inputs.spec.js` |
| Hanzi canvas and controls | PASS | `mission-inputs.spec.js` |
| Responsive width overflow check | PASS | 375x812, 768x1024, 1440x900 |
| Final Boss -> Victory | PASS | Seeded 14-level progress defeats all 5 phases and opens Victory |

Playwright run: 11/11 passed, including content-safety, reset, Hanzi canvas, responsive, and seeded Final Boss -> Victory coverage.
Screenshot artifacts are generated under `test-results/**/test-finished-1.png` for Home mobile/tablet/desktop, Chapter/Map, Pinyin, Hanzi, Result, Final Boss, and Victory states.

## Unit and Build Gates

- `npm.cmd test`: 129/129 passed.
- `npm.cmd run validate-content`: 75/75 missions, 0 warnings, 0 errors.
- `npm.cmd run build`: passed.
- `npm.cmd run test:e2e`: 11/11 passed with exit code 0 after the dedicated Vite runner fix.

## Notes

- Playwright test setup downloads Chromium on first run; it is not a production dependency.
- Native Web Speech pronunciation and stylus pressure still require a manual device check because headless Chromium does not provide reliable speech output or pressure hardware.
- The Final Boss browser test seeds progress for levels 1-14 so it verifies the final interaction path without making the test depend on a 15-level setup time.
