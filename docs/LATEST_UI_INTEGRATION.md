# Combined UI testing branch

`test/latest-ui-fixes` combines the current v1.7 main baseline with:

- `fix/milestone-scope-single-line`: fixed one-line milestone scope summaries and clickable +N overflow.
- `feature/global-icon-buttons`: shared accessible icon actions, wider milestone Scope column and same-map/below-map baseline choice.
- `feature/ux-improvement-batch`: Search result title navigation with preserved destination preferences, Tube Map names/tooltips and warning navigation to stable dependency IDs. This includes the changes also published independently on `feature/search-result-navigation` and `feature/tube-map-display`.
- `feature/global-sidebar-floating-toolbar`: sidebar project/save status, floating global controls, compact Gantt section/date bands, inline warning triangles the single-band Tube Map header, and PR #30 at `a87e616` including the Today-focused window with four historical weeks.

## Reconciled overlapping changes

The newest single-line Scope request supersedes the older wrapping behavior; the wider Scope column and compact action icons remain. Both scope layout and overflow interaction tests are retained.

Tube Map uses one comparison selector with the newer “In the same map” / “Below the map” labels. Same-map historical markers use the newer grouped projection, baseline-only lanes and unchanged live coordinates. Below-map rendering retains the earlier optional captions. Show milestone names continues to control live captions and below-map historical captions. Current, below-map and grouped same-map historical markers share the hoverable, keyboard-accessible Tube Map tooltip, including historical status and variance details. The older display tests use the current selector and geometry contract; the dedicated comparison tests retain coincident grouping, historical-only lanes and live-coordinate invariance checks.

Search uses clickable result titles rather than a separate Open details icon; deleted-result Restore remains an icon action. The floating toolbar retains the shared icon Undo/Redo and their accessible tooltips.

This branch is for combined local testing. It does not merge into main, publish a release or deploy the application.

## Validation — 9 November 2026

- Base integration: 65 unit files / 540 tests passed (34s), TypeScript passed (3.23s), lint passed (14.26s), production build passed. The new historical-filter regression subsequently passed with its complete five-case overlay unit file (3.32s).
- Broad browser run: 195 cases, 188 passed; seven integration failures were identified. The corrected scope expectations, toolbar gutter activation, tooltip pointer layer and shared historical filtering were verified in a 31-case focused run (93s), plus both connector tracing cases (6.73s). All 199 distinct pre-PR30 browser scenarios, including the four icon cases, have passing evidence across those runs. This is scoped aggregate evidence, not a claim that the interrupted/failed broad invocation passed.
- Complete custom lifecycle: 245 checkpoints passed with `node e2e/run-regression.mjs --full --skip-atlas`; Atlas separately passed in the broad Playwright run. Existing 180-record creation and save/reopen coverage remains.
- PR #30 is included through `a87e616b899b52de645a236453bd99fd55a1c30d`. Its date-window change passed all 47 local-date/model unit cases in Europe/Madrid (2.02s), all 17 Today-window/comparison/display browser cases (34.47s), and a fresh production build including TypeScript/token checks. Prior unrelated passing suites were retained rather than repeated.
- Comparison fixtures/assertions now account for the four historical weeks, including marker date-axis positions and explicit four-week paging. The imported window test uses the shared accessible Axis name.

Ignored detailed logs remain under `work/integration/` and the referenced `work/validation-*` directories. Browser file adapters do not establish physical Windows/macOS picker acceptance. No main merge, release or deployment was performed.
