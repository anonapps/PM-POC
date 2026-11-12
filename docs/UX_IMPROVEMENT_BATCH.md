# UX improvement batch

> Implementation/evidence record. The consolidated content is now integrated through [PR #34](https://github.com/anonapps/PM-POC/pull/34) (`9266a02`, 12 November 2026). Use the [v1.7 manual](V1.7_UI_REFERENCE.md) and [current UI guide](ARGOS_PM_UI_REFERENCE.md) for final labels and behavior, including the historical-marker fix. Branch instructions and measurements below retain their original scope/date; this is not a release/deployment record.

Branch `feature/ux-improvement-batch`, based on current main `ed30f02`.
No combined UX branch existed locally or remotely. This branch brings together
the two completed feature changes and Fix 3 without changing main:

| Fix | Original feature commit | Batch commit |
| --- | --- | --- |
| 1 — Search result navigation | `bc8d073` | `51b2dfe` |
| 2 — Tube Map display/tooltips | `96edfbf` | `4bad0bd` |
| 3 — Warnings-to-Dependencies | This change | See branch history |

The two earlier commits were cherry-picked; overlapping documentation and CSS
append sections were retained together. Their details and retesting instructions
remain in `SEARCH_NAVIGATION.md` and `TUBE_MAP_DISPLAY.md`.

## Fix 3 root cause and behavior

Relationship diagnostics already carried `dependencyId`, but Warnings navigated
with `warning.entityId`, which is the owning milestone ID. Dependencies therefore
received an ID from the wrong entity collection. Cycle diagnostics additionally
lacked relationship identity entirely.

`warningNavigation` changes routing only for milestone Critical Path Analysis
relationship warnings. It resolves existing dependency IDs, deduplicates and
sorts them, and chooses the first stable ID for the main warning button. A compact
Locate dependencies disclosure offers each exact record when multiple links are
implicated. Labels/names and array/display order never select the target.

Cycle diagnostics receive optional transient `dependencyIds` from their actual
strongly connected component. Inter-component bridges and unrelated cycles are
excluded. Existing traversal, date/float/critical-path calculations and task
diagnostics remain unchanged. No new warning records are duplicated. All metadata
stays in the calculation/warning projection; nothing is written to `.pmp`.

Dependencies uses the Search batch's shared exact-row reveal, content-scroller
centering, focus and temporary highlight. Its existing filtering/sorting logic
temporarily includes the selected record. Only the Dependencies ↔ Warnings
round trip additionally preserves destination preferences; other ordinary page
navigation retains its existing reset behavior. Clicking inside the target stays
usable; Escape or interaction elsewhere dismisses the temporary reveal.

If IDs are missing or stale, the warning explains that no dependency can be
identified and opens the owning milestone. Resolution rechecks the live store
when activated. If a target disappears after arrival, Dependencies displays an
unavailable message in its existing scroll region and highlights no other row.
Task warnings, all other warning routes, corrective actions, filtering and the
file format remain unchanged.

## Fix 3 changed files

- `src/domain/critical-path/calculate.ts`, `types.ts`: transient cycle link IDs.
- `src/features/warnings/warnings.ts`, `use-project-warnings.ts`: carry metadata
  without duplicating warnings or replacing the owning entity identity.
- `src/features/warnings/navigation.ts`, `warnings-panel.tsx`: exact routing,
  multiple choices and meaningful fallback.
- `src/features/shared/navigation-session.tsx`: preserve the narrow Dependencies
  and Warnings settings round trip.
- `src/features/dependencies/dependencies.tsx`: missing-record message.
- `src/app/viewport-layout.css`: scoped chooser wrapping.
- `src/features/warnings/navigation.test.ts`,
  `src/features/shared/navigation-reveal.test.ts`,
  `e2e/layout/warning-dependencies.spec.ts`: focused regressions.
- This note, `docs/PROJECT_REQUIREMENTS.md` and `docs/ARCHITECTURE.md`.

## Retesting

```sh
npm run test:targeted -- unit src/features/warnings/navigation.test.ts src/features/warnings/warnings.test.ts src/features/warnings/warnings-panel.test.ts src/features/shared/navigation-reveal.test.ts src/features/critical-path/model.test.ts src/domain/critical-path/calculate.test.ts
npm run build
CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/warning-dependencies.spec.ts e2e/layout/search-navigation.spec.ts --workers=1
CHROME_PATH=/usr/bin/chromium npm run validate:pr
```

Omit `CHROME_PATH` for Playwright's installed browser. Unit/integration checks
cover task-route preservation, exact identity, multiple independent cycles and
bridges, deduplication, date-only warnings, stale/missing targets, missing-row
rendering and transient preferences. Browser checks cover task and milestone
warnings, off-screen dependencies, hidden query/relationship filters, preserved
descending sort, Escape, repeated multi-link selection and missing-target fallback.

Persisted projects correctly reject cycles. Genuine cycle metadata is tested
directly in the engine; the browser's defensive multiple-link and stale-warning
cases use controlled worker responses over valid serialized projects. This does
not weaken file validation or claim that cyclic `.pmp` files can be opened.

For manual testing, configure Dependencies filters/sort, open Warnings and activate
a milestone Critical Path Analysis relationship warning. Verify the exact row is
visible and highlighted, then dismiss it and confirm settings are unchanged.
Repeat with an off-screen link and an ordinary task warning. Native physical
machine UAT and actual GitHub PR checks require independent evidence.

## Local results — 2 November 2026

Linux Chromium, unchanged dependencies and `.pmp` schema:

| Check | Result | Elapsed |
| --- | --- | --- |
| Focused warning/engine/reveal unit checks | 40 passed, 6 files | 2.71s |
| Focused warning navigation and Search browser checks | 8 passed | 18.14s |
| Combined `validate:pr` unit | 536 passed, 64 files | 30.74s |
| Typecheck / lint / production build | All passed | 2.84s / 9.37s / 20.78s |
| Full lifecycle | 245 assertions passed, zero failures | 130.13s |
| Full browser suite | 170 passed, zero failures | 438.04s |

The complete combined `validate:pr` command exited successfully, including the
previous Tube Map Axis selector correction. Logs and stage timings are retained
under ignored `work/validation-2026-11-02T16-25-42.296Z/`. Focused browser evidence is
under `work/validation-2026-11-02T16-23-46.237Z/`. No actual PR CI or native macOS UAT
result is claimed. No merge, tag, release, publication or deployment is performed.
