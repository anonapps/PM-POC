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
