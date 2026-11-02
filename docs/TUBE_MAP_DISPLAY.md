# Tube Map display enhancements

Branch `feature/tube-map-display`, created from latest `main` at `ed30f02`.

The existing comparison controls now offer Overlay / Separate, retaining Separate
as the default. Both reuse the historical, colourless hollow-diamond presentation
and the selected baseline. Overlay reserves historical rails only in populated
lanes; Separate keeps the historical map below the current map, without an extra
toolbar or footer. Current and historical coordinates use the same twelve-week
window, column scale, axis label choice and four-week navigation. Tube Map has no
independent zoom control; no new zoom mechanism is introduced.

Show milestone names defaults on. Hiding captions preserves IDs/names in the
tooltip and accessible names. Ordinary current lanes compact from 88px to 48px
(45% reduction); historical caption rows compact from 48px to 28px (42%). Overlay
combines the corresponding current/historical space. Dense collisions can add
28px compact rows to retain distinct hit areas. Diamond targets remain 26px;
dependency coordinates follow their actual lane positions.

One application-styled tooltip is shared across current and historical triggers.
It opens on hover or keyboard focus, supports pointer movement into its content,
is associated through `aria-describedby`, and dismisses on Escape, chart scrolling,
resize, trigger removal or Quick Edit. A portal and viewport measurement prevent
chart clipping. Native milestone titles and the old baseline CSS pseudo-tooltip
are removed. Quick Edit still opens only for current milestones.

Historical dates, names, membership and stream labels come from the immutable
snapshot. Historical-only streams remain visible in Overlay. Baselines do not
store status, so the historical tooltip says "Not captured in baseline" and
separately shows current status where available. Status filters use current
records where available; they do not fabricate a historical status. Current status
colours, critical-path indication, dependency identity, canonical edits, Undo,
baseline selection and file compatibility remain unchanged. No persisted state,
schema, dependency package or runtime service changes.

## Changed files

- `src/features/tube-map/tube-map.tsx`: display controls and shared render wiring.
- `src/features/tube-map/model.ts`: compact geometry and historical lane space.
- `src/features/tube-map/baseline-model.ts`: pure snapshot/filter/coordinate projection.
- `src/features/tube-map/milestone-tooltip.tsx`: single accessible portal tooltip.
- `src/features/baselines/tube-baseline.tsx`: shared historical indicators in both modes.
- `src/app/viewport-layout.css`: scoped display/tooltip styles and diamond alignment.
- `src/features/tube-map/baseline-model.test.ts`: focused projection regressions.
- `e2e/layout/tube-display.spec.ts`: display, tooltip, alignment and persistence cases.
- `e2e/layout/timeline-toolbar.spec.ts`: scope the existing Axis selector by name
  now that comparison display adds a second dropdown; retain all assertions.
- This note, `docs/PROJECT_REQUIREMENTS.md` and `docs/ARCHITECTURE.md`.

## Local retesting

```sh
npm run test:targeted -- unit src/features/tube-map/model.test.ts src/features/tube-map/baseline-model.test.ts src/application/baselines.test.ts
npm run build
CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/tube-display.spec.ts --workers=1
```

Omit `CHROME_PATH` when using Playwright's installed browser. Optional
`CAPTURE_LAYOUT=1` saves display screenshots in the test output folder. The browser
matrix covers baseline off/Overlay/Separate with names on/off, compact lane
metrics, date-axis alignment, shared navigation/selection, filtering, tooltip
uniqueness, keyboard focus, viewport edges, Quick Edit and unchanged snapshots
after saving. Unit tests cover dense collisions, historical-only streams,
immutable coordinates, boundaries and live status filtering.

For manual review, open a project with a baseline, enable Baseline milestones and
switch both displays with names on/off. Navigate dates and change the selected
baseline. Hover and Tab to current/historical diamonds, press Escape, and open a
current milestone for Quick Edit. Verify long names, dense milestones, changed
historical scopes and short laptop windows. Native macOS visual UAT is not claimed
by Linux Chromium checks.

The existing full PR gate is `CHROME_PATH=/usr/bin/chromium npm run validate:pr`.
Actual GitHub PR checks must be verified on the PR independently.

## Local validation — 2 November 2026

Linux Chromium, unchanged lockfile:

| Check | Result | Elapsed |
| --- | --- | --- |
| Focused Tube Map/baseline unit checks | 54 passed, 3 files | 1.29s |
| New display and existing v1.6 baseline browser checks | 15 passed | 34.18s |
| Full PR unit checks | 524 passed, 62 files | 29.72s |
| Typecheck / lint / build | Passed | 2.97s / 10.39s / 21.46s |
| Full lifecycle | 245 assertions passed, zero failures | 136.83s |
| Full browser attempt | 154 passed; 8 stopped at an obsolete unscoped Axis selector | 442.05s |
| Corrected sticky-bounds cases | All 8 passed, every geometry assertion retained | 14.03s |

The full `validate:pr` invocation exited nonzero because its eight sticky-bounds
tests assumed there was only one dropdown. Their selectors now explicitly name
Axis. The application code did not change after that full run; all eight affected
cases then passed via:

```sh
CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/timeline-toolbar.spec.ts --grep 'Tube Map sticky bounds' --workers=1
```

The other 154 browser results, unit/lifecycle/static/build results remain valid.
All 162 browser cases are therefore verified across the full run and focused
retest; the complete suite was not unnecessarily repeated. Focused lint on the
updated test also passed. Do not describe the original full command as green.

Logs: `work/validation-2026-11-02T15-14-53.457Z/` (full),
`work/validation-2026-11-02T15-26-23.343Z/` (corrected sticky-bounds cases).
Visual review also checked the Overlay screenshot and corrected a shared control
rule that had enlarged current diamond targets, shifting their centres off the
lane coordinates. Final tests assert the intended 26px target and exact centre.
