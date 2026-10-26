# Automated regression suite v2

## v1.4.0 release validation

The ARGOS PM v1.4.0 PR #9 head `32093a9` passed both workflows: v1.4 validation run `39404077976` and PM-POC validation run `39404077980`. The extended browser acceptance regression covers People Name blur-commit and Undo/Redo. The production-only dependency audit passed; the full development dependency audit reported five high-severity findings. These results are specific to the release candidate, not a guarantee that later commits pass.


## Commands and execution

Run commands from the repository root after `npm ci`. The app supports Node.js 20.9+; browser tests require Node.js 22+ and a locally installed Chrome/Chromium executable. The harness uses Node's built-in WebSocket client and Chrome DevTools Protocol without adding a browser automation dependency to the app.

| Command | Scope | Automatic execution |
| --- | --- | --- |
| `npm test` | All Vitest domain, application, persistence and regression tests | Normal validation |
| `npm run test:e2e` | Original browser acceptance/smoke flow | Included by both larger browser suites |
| `npm run test:regression` | Fixture validation, smoke flow, 180-record browser regression | Push/PR to `main`; manual normal validation |
| `npm run test:lifecycle` | Extended regression plus 180 additional form-created records | Nightly at 03:00 UTC; manual dispatch; pushes to `main` changing `e2e/**`, `src/testing/**`, package manifests or the lifecycle workflow |

Normal validation also checks TypeScript, lint, production build and production dependency audit. The full dependency audit is informational. The lifecycle workflow has a 30-minute timeout; normal validation has a 20-minute timeout.

To run full lifecycle manually on GitHub, open **Actions → PM-POC full lifecycle regression → Run workflow**, select `main` and run. The schedule is fixed to UTC (05:00 Madrid summer time / 04:00 winter time), and scheduled runs use the default branch.

## Dataset

The fixture has exactly 180 active entity records: 30 Streams, 30 People, 30 Tasks, 30 Milestones, 30 Risks and 30 Decisions. Risk actions and dependency edges are additional supporting records. Gantt renders Tasks and Milestones; it is not a separate entity collection. Full mode creates 30 more of each entity through the actual forms, reaching 360 entity records before save/reopen.

Dates are anchored to `2026-10-11` in domain regression. Browser views retain their normal current-date behaviour, so browser checks avoid depending on historical fixture milestones remaining in the current 12-week window. IDs, names and dates are deterministic. The fixture uses supported product enums; Decisions have no status field.

| Dimension | Covered scenarios | Verification |
| --- | --- | --- |
| Status and owner | All five Task/Stream statuses × assigned/unassigned; four Milestone statuses × owner; four Risk statuses × owner | Explicit pair-count assertions |
| Dependencies and status | Every Task/Milestone status with/without incoming dependency | Explicit pair-count assertions |
| Dependency structure | None, chains, multiple predecessors, cross-stream task edges, task-to-milestone edge | Real container validation, model projection and deletion cleanup |
| Risk ratings | All nine probability × impact cells; Low/Medium/High derived levels | Matrix pair assertion, codec validation and rating edit |
| Risk actions | No actions or multiple actions; overdue Open and Complete actions | Overdue count, field persistence and duplication lifecycle |
| Decision context | Project-wide or linked scope, optional rationale, assigned/unassigned owner, dates, multiple risk links | Complete field round trip and relationship edit |
| Task hierarchy/progress | Flat Tasks and four levels; 0/25/50/75/100% propagation | Targeted hierarchy tests at each progress value |
| Dates and scope | Missing dates, before/inside/after project/window, shared dates, project-wide and multiple-stream Milestones | Codec equality, Gantt/Tube Map scope counts and boundary assertions |
| Names and identity | Long names, repeated names, Unicode and `<>&`; stable IDs and next sequence | Unique ID assertion, per-record ID search and duplication ID 031 |
| Lifecycle | Duplicate Tasks/Milestones/Risks/Decisions; delete/restore all six kinds; Undo/Redo; saved/dirty baseline | Store-level assertions and full field round trips |
| Crowded browser views | 30 rows per module, 31 Tube Map lanes, 12 labels, last Gantt Task, decision search | DOM/content checks |
| Form creation | 30 additional entities per module | Actual form submission and next human ID; full mode only |
| Persistence | Real `.pmp` encode/decode; save/close/reopen in browser | Whole-state equality in Vitest; counts in all six browser modules after reopening |

These assertions cover selected pairs and risky scenarios. They are not an exhaustive pairwise covering array across every field. Varied scenarios come from the validated fixture; the full form loop checks creation volume using required fields and defaults. Existing unit and smoke tests supply further validation, keyboard, draft, layout and file-lifecycle coverage.

## Implementation and isolation

- `src/testing/regression-fixture.ts` builds canonical project state and recalculates parent values.
- `src/testing/regression.test.ts` validates coverage and exercises commands, search, models and the real `.pmp` codec.
- `e2e/run-regression.mjs` creates an OS temporary directory, runs fixture tests to serialize a `.pmp`, runs browser acceptance and removes the fixture directory in `finally`.
- `e2e/acceptance.mjs` owns the local server/browser lifecycle, isolated temporary Chrome profile and in-memory File System Access API adapter.
- `e2e/regression.mjs` opens generated bytes through the app, verifies large views, optionally creates additional records and saves/reopens.

No user project files are accessed. No fixture or automation is imported into the app's runtime. Browser save/reopen uses the real application persistence path with the in-memory adapter; native file-picker consent and physical OS file access remain [manual boundary checks](ACCEPTANCE_TESTING.md#manual-native-boundary-checks).

## Configuration and failure diagnosis

| Variable | Purpose |
| --- | --- |
| `CHROME_PATH` | Absolute path to a Chrome/Chromium executable when automatic discovery is insufficient |
| `E2E_DEBUG_PORT` | DevTools port; default 9222 |
| `E2E_BASE_URL` | Explicitly opt into reusing a local test server instead of starting an owned server |
| `REGRESSION_PMP_PATH` | Internal runner variable specifying the temporary codec output; normally do not set manually |
| `E2E_FULL_LIFECYCLE` | Internal runner flag selected by `--full`; use `npm run test:lifecycle` |

The harness refuses to reuse an existing server on its default URL unless `E2E_BASE_URL` is explicitly supplied. Run browser suites sequentially on one machine, or allocate separate server URLs and DevTools ports. Console output lists PASS/FAIL assertions; the first failure exits non-zero. Inspect the failed GitHub step and rerun its command locally with the same commit.

Opening and module-navigation timings are diagnostic only, not hardware-dependent pass/fail thresholds. Geometry/content checks are not screenshot comparisons or comprehensive desktop viewport testing. The extended browser suite verifies rendering/search/persistence; the larger domain suite verifies mutation semantics. Native permissions, physical file writes and Windows/macOS launcher checks are separate boundaries.

## Recorded verification

On 11 October 2026, commit `14eb167` passed 27 Vitest files / 139 tests, TypeScript, lint, production build and dependency checks. GitHub [normal validation](https://github.com/anonapps/PM-POC/actions/runs/38133053042) and [full lifecycle](https://github.com/anonapps/PM-POC/actions/runs/38133053022) both passed. Full lifecycle created all 180 additional entities and saved/reopened the large project without browser runtime errors. This is a dated result; the current Actions run is the authority for later commits.

## v1.5 shared-controls coverage

`e2e/v15-shared-controls.mjs`, included in acceptance and both larger suites, verifies repeat inline creation for People/Streams, filtered creation reset, inline validation, Search disabled during creation, Show Deleted keyboard order, outside-click dismissal, predictive arrows/Enter/Escape, retained hidden selections, and shared Today marker body geometry. Unit tests cover Gantt final-day/zoom positioning and preservation of hidden Decision relationships through context editing and Undo/Redo.

Independent browser suites can share an immutable production server by explicitly setting `E2E_BASE_URL`, using separate `E2E_DEBUG_PORT` values and allowing each runner to create its own fixture/profile. Build before starting that server; run TypeScript checks after the build to avoid racing `.next/types` regeneration. Do not edit runtime source during a browser run.

## v1.5 consolidated interaction batch

The acceptance entry point also runs `e2e/v15-batch.mjs`. It checks the unified toolbar on all eight pages, multiple category selections, navigation resets, Risk Matrix/Level synchronisation, predictive owner IDs and selection without an extra history entry, context Cancel, multiline submission, hidden-field search and new Task/Risk relationship persistence through `.pmp` save/reopen. `v15-shared-controls.mjs` now exercises repeated filtered creation and inline validation for all six record types.

Creation forms intentionally expose mandatory fields only. Smoke coverage creates Tasks/Milestones first, then edits optional scope and predecessors through row controls. Dynamic owner controls are native disclosures with searchable radio options; owner sorting checks the displayed selected summary. These changes preserve coverage while following the approved v1.5 interaction contract.

## v1.5 candidate acceptance

`e2e/v15-candidate.mjs` extends both browser suites with normalised blur, one-event/no-op/Undo/Redo checks across six record modules, Project Details Cancel/Done, a live bundled-PDF fetch, sidebar position/ALL-pill/chart-control checks, genuine v1.4 bytes through the browser adapter, and dirty-file Save/Discard/Cancel/recovery flows. `text-edit-acceptance.test.ts` checks all sixteen editable text categories through command/audit/history/codec boundaries. `v14-compatibility.test.ts` uses a frozen fixture generated by actual v1.4 code, with a complete JSON oracle and failure/retry/timezone checks.

For the separate historical-reader check, `V14_ROUNDTRIP_PATH` may point to a disposable workspace output while running the compatibility unit test. Its successful candidate save can then be passed to the historical v1.4 reader. Do not regenerate frozen input fixtures using current v1.5 code. This is still separate from the native Windows/macOS checklist.


### Search/Filter layout acceptance (24 October correction)

Run a production build/server, then `npm run test:layout` in a second terminal. Use `CHROME_PATH` for an installed Chrome/Chromium executable, or run `npx playwright install chromium` once for the Playwright-managed browser. The dev-only Playwright suite complements the existing CDP suites. Default server URL is http://127.0.0.1:3000; override with E2E_BASE_URL. Screenshots/results default to ignored `test-results/`; LAYOUT_OUTPUT_DIR overrides that path. Run on macOS/Windows supported Chrome separately for native acceptance.

Three viewport tests cover all ten affected pages at 1280/1440/1920×1000, use a disposable in-memory 180-record legacy fixture with long names and 30-digit human IDs, and check toolbar geometry, panel bounds/layering, compact controls, non-overlapping sections/search/counters, combined query/filters, Clear, persistence across close, Escape/focus, outside dismissal, single chart checkbox and no project dirtying. Table dropdowns are also checked in the native top layer after scrolling. Existing CDP suites retain filtering/creation/navigation/Undo/Redo/legacy-file regression coverage. No mocked browser file adapter certifies native disk permissions.


### Gantt footer and independent toolbar centring

The layout suite additionally checks ten-page search centring at 900/1024/1280/1440/1920 pixels, with changed placeholders, action visibility, active filters, vertical scrolling and sidebar collapse. Search centres must match the content container and one another within one pixel, while titles/actions remain clear of the input. The narrower fallback uses a centred second row.

Eight Gantt browser cases combine 900/1280/1440/1920 widths with a short year-boundary project and a long leap-year project. Each exercises all three zooms, exact 1/7/14-day Previous/Next offsets, inclusive date range versus visible columns, Jump to today, full-body Today line, expanded/collapsed streams, vertical/horizontal scrolling, footer stability and final-row/dependency clearance. Shared footer/calendar unit tests protect presentation/order, caller-controlled enabled state and date boundaries. Tube Map retains its existing four-week offsets and disabled-at-origin control. No dependency change is needed for these corrections.


### Unified creation panels and stable validation

`creation-panels.spec.ts` covers all six full-field panels at 1024/1440/1920, initial focus, Tab/Shift+Tab, single-line Enter, textarea newline, stable field geometry on errors, dirty/clean outside dismissal, Stay/Discard, immediate Cancel, successful close/reset/restoration, optional field/relationship/dependency/Risk-action persistence and one-step Undo/Redo. New Project tests inspect the actual mocked picker/write call counts, blank initial Status, invalid draft guard and valid creation. Layout tests cover task bulk selection/count/delete/Undo inside the unchanged centred toolbar, selector borders, tall People Notes and Milestone scope rows, full-width context text and top-layer relationship popovers. Conditional Milestone scope and initial Risk action errors must remain associated and focus their control.

Pure panel-command tests cover each entity's required/optional values, untouched collections, identifier/history/audit behaviour, complete PMP round-trip, invalid fields and legacy command compatibility. Existing CDP suites now target the single side-panel route and successful close rather than repeat-inline mode. Run the CPU-heavy 5,002-change audit-retention test separately from simultaneous multi-browser stress when runner capacity is limited; do not infer a pass from a contention timeout or raise timeouts without evidence.


### Task status, chart projections and anchored layout batch

`status-batch.test.ts` verifies task-only Tentative create/edit/history/codec/legacy-status preservation and the existing duplicate reset; chart status projections, lane population/search, complete legends/shared colour sources, and measured above/below geometry. `status-batch.spec.ts` adds desktop/laptop checks at 1024/1440/1920: six Gantt colours/legend/status OR filters/clear/search/Hide Empty, top-layer warning content, milestone status/legend/filtered population, footer pseudo-element removal, popup gap/stacking before and after search/scroll, aligned context controls, compact Edit Project, natural Quick Actions height and session Matrix toggle without data persistence. UI create/edit/duplicate/save covers Tentative too. Existing creation/keyboard/validation, centred search and zoom/footer cases remain in the full Playwright suite.

PR #12 adds eight Tube Map scroll-boundary cases (short/31-lane projects × 1440/1080/768/375 widths), checking real overflow extent, sticky axis/date labels and footer at top/middle/bottom, last-lane clearance and unchanged project dirtiness. Existing 44 Playwright cases and the CDP design-system axis assertions remain intact. Footer paint must not generate a box that extends scroll overflow.


## Stable v1.5 release and future main/PR checks

The layout gate now also runs `release-smoke.spec.ts`: one real journey covers full-panel validation/focus, Tentative creation with owner/scope, combined filters, both chart legends/status filters and navigation, whole Risk Matrix toggle/context, Decision creation/Undo/Redo, stable manual HTTP response and 1.5.0 saved-byte reopen/equality. Ordinary CI runs without capture holds; `CAPTURE_V15_DEMO=1` records the same actual journey at natural speed. Existing 52 cases remain; total **53**. The full lifecycle release gate runs on main and PRs as well as the feature branch. Unit/regression/lifecycle/layout/audit checks remain enabled. Dependabot targets main after promotion.

The tag-only v1.5.0 publication workflow verifies stable metadata and exact-main-SHA successful validation before publishing PDF/video/checksums. It does not deploy. Future changes must retain all v1.5 behaviour and legacy fixture compatibility; historical v1.4 validation is additional evidence, not a replacement for these gates.


## Atlas recapture coverage

`demo-lifecycle.spec.ts` creates Atlas from an empty project through real UI commands and verifies 4/5/8/9/2/2 records, 2/2/5/0 milestone scope, all Task statuses/owners/dependencies, full Risk/Decision context, genuine warning navigation/correction, Tube quick edit/navigation/filtering, audit, save/close and PMP equality. `acceptance.mjs` invokes it in both regression/lifecycle commands through an isolated browser on the existing server; all original assertions remain. The full layout suite has 54 tests. Media checks bind actual MP4 and PMP checksums, duration ≤80, exact frame rate/count, codec and cue/data evidence. Static-site/native-player checks ensure only video files are published and require advancing frames. Pages preflight and live playback are mandatory publication checks; missing configuration must not be treated as success.

## v1.6 additions

Baseline/application tests cover multiple names, immutable detached schedules, metadata rename, confirmed UI deletion and Undo/Redo, audit independence, calendar-day variance, removed/added/undated items, legacy rich files, multi-stream milestones and 20-baseline populated PMP round trips. Dependency tests cover disjoint scopes, all supported relationship types, missing/deleted references, duplicate/self/cycle rejection, in-place editing, warning recalculation and date preservation.

`e2e/layout/v16.spec.ts` exercises baseline creation/selection/rename/delete/cancel/Undo, actual saved bytes and reopen, chart visibility controls, comparison and dependency editing. `timeline-toolbar.spec.ts` verifies all original module widths at 900/1024/1280/1440/1920 and vertical chart scrolling with persistent footers. Existing horizontal-scroll assertions and same-row alignment assumptions are superseded by the explicitly approved REQ-001 wrapping layout; field containment and accessibility remain asserted. Existing v1.5 regression/lifecycle/layout gates remain in force. Extended Mode checks remain pending approval and implementation, not skipped acceptance evidence.
