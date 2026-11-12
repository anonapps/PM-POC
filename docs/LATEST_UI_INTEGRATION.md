# Combined UI testing branch

> Implementation/evidence record. The consolidated content is now integrated through [PR #34](https://github.com/anonapps/PM-POC/pull/34) (`9266a02`, 12 November 2026). Use the [v1.7 manual](V1.7_UI_REFERENCE.md) and [current UI guide](ARGOS_PM_UI_REFERENCE.md) for final labels and behavior, including the historical-marker fix. Branch instructions and measurements below retain their original scope/date; this is not a release/deployment record.

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
- Broad browser run: 195 cases, 188 passed; seven integration failures were identified. The corrected scope expectations, toolbar gutter activation, tooltip pointer layer and shared historical filtering were verified in a 31-case focused run (91.84s), plus both connector tracing cases (6.73s). All 199 distinct pre-PR30 browser scenarios, including the four icon cases, have passing evidence across those runs. This is scoped aggregate evidence, not a claim that the interrupted/failed broad invocation passed.
- Complete custom lifecycle: 245 checkpoints passed with `node e2e/run-regression.mjs --full --skip-atlas`; Atlas separately passed in the broad Playwright run. Existing 180-record creation and save/reopen coverage remains.
- PR #30 is included through `a87e616b899b52de645a236453bd99fd55a1c30d`. Its date-window change passed all 47 local-date/model unit cases in Europe/Madrid (2.02s), all 17 Today-window/comparison/display browser cases (34.47s), and a fresh production build including TypeScript/token checks. Prior unrelated passing suites were retained rather than repeated.
- Comparison fixtures/assertions now account for the four historical weeks, including marker date-axis positions and explicit four-week paging. The imported window test uses the shared accessible Axis name.

Ignored detailed logs remain under `work/integration/` and the referenced `work/validation-*` directories. Browser file adapters do not establish physical Windows/macOS picker acceptance. No main merge, release or deployment was performed.

## Tube Map control refinement — 9 November 2026

The baseline/current key sits immediately beside the bottom Milestone legend, with footer counts wrapping safely on narrow maps. Search filters exclusively own Hide Dependencies and Hide Milestones Names; names start visible and Clear all restores them. Combined/Detached native radio segments replace the baseline checkbox and display dropdown. A selected snapshot is compared with live captured milestone and stream content, independently of task-only edits, filters, sorting, paging and capture identity. Identical or absent snapshots disable both options with an explanation; differing snapshots compare automatically, defaulting to Detached. Critical Path stays in the control row.

Validation: the three relevant unit files passed all 15 cases (1.94s); production build/token check/TypeScript passed. Twenty-one comparison/display/filter/date-window browser cases passed (62.4s), both dependency connector cases passed, and the adapted baseline edit/save/reopen journey passed (8.15s): 24 relevant browser scenarios in total. An initial narrow-footer overflow was corrected without hiding the legend, and obsolete checkbox selectors were migrated to the requested filter/radio behavior. The save/reopen test explicitly saves its newly introduced live-plan edit before closing. Earlier unrelated broad checks were not repeated.

## Timeline filter and baseline-tooltip refinement — 9 November 2026

Show Critical Path now lives exclusively in each chart's search filter dropdown, preserving independent Gantt/Tube Map project-session state and resetting the relevant overlay through Clear all. Gantt dependency visibility is exclusively Hide Dependencies, matching Tube Map. Gantt's removed Variance indicators state/control/inline labels are replaced by pointer- and keyboard-accessible historical-marker tooltips showing the item name and all current/baseline start/end dates. Grey bars, delayed-finish segments, live editing and connector geometry remain. Tube Map's outer panel inherits the page surface like Gantt; its plotting/header surfaces remain unchanged and colour parity is browser-asserted.

Validation: all 60 Gantt model/connector and Critical Path model unit cases passed (7.5s). Production build/token check/TypeScript passed. All 32 Critical Path, Gantt surface/tooltip, shared search/filter and Tube Map comparison browser cases passed (103.68s), followed by six relevant Extended editing, baseline save/reopen, connector, compact-band and comparison-control cases (39.22s): 38 browser cases passed. Tooltip checks assert the item name, all four dates, hover/focus accessibility, Escape dismissal and absence of a duplicate native title. No unrelated full suite was repeated.

## Unified tooltip design — 9 November 2026

All tooltip surfaces now share the compact light-grey/dark-text treatment requested from the native task-name hint: common control-size Arial, regular body weight, restrained headings, 5×8px padding, a 3px radius, subtle neutral border/shadow and bounded wrapping. One stylesheet owns action, Gantt and Tube Map tooltip appearance. Native HTML/SVG title hints use a single delegated provider with no extra per-cell wrappers, temporary title suppression/restoration, accessible descriptions, Escape dismissal and viewport-safe positioning. The removal observer is connected only while a title trigger is active. Existing hoverable chart details and disabled-action wrappers retain their behavior. Keyboard-focused dependency hints stay visible and reposition when focus scrolls the chart.

Validation: production build/token check/TypeScript passed. The new 900/1440px browser cases assert identical colours, font metrics, padding, radius, border and shadow across name hints, icons, baseline details, milestone details and SVG connectors, with metadata restoration and keyboard dismissal. Together with existing action, shell, Gantt and Tube Map cases, all 29 focused cases passed (98.32s); both connector-interaction cases passed (6.36s). The core create/edit/navigation/save/close/reopen journey passed all 46 checkpoints. Tests caught and corrected focus-induced scrolling dismissing an SVG hint. No model/persistence changes or unrelated full-suite reruns were needed.
