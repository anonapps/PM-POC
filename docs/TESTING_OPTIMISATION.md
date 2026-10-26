# Testing optimisation

Branch: `chore/testing-optimisation`, based on `main` at `3c6ef7036d7a5ac7c66dcd7966a15324df212a5b` (26 October 2026). Application functionality, product requirements, persistence implementation and the `.pmp` contract are outside this change.

## Validation levels

| Level | Command | Scope |
| --- | --- | --- |
| Quick | `npm run validate:quick` | Domain and persistence Vitest cases. Smoke feedback, not PR approval. |
| Targeted | `npm run test:targeted -- unit src/features/tasks/commands.test.ts` | Explicit Vitest file/path selection; an empty selector is rejected. |
| Targeted | `npm run test:targeted -- layout e2e/layout/creation-panels.spec.ts --grep 'Task full'` | Explicit Playwright file/name selection. Requires a build or an intentionally supplied `E2E_BASE_URL`. |
| Targeted | `npm run test:targeted -- volume` | Independent 180-record open/render/sort/search/save/reopen scenario, using a disposable copy of the committed fixture. Add `--full` to exercise all 180 additional UI creations. |
| PR regression | `npm run validate:pr` | Every Vitest case, typecheck, lint, production build, full custom lifecycle and all Playwright cases. One owned production server; Atlas runs exactly once via Playwright. |
| Full release | `npm run validate:release` | PR validation plus blocking production dependency audit and informational full audit, preserving existing audit policy. Native browser/OS manual acceptance is still required. No release/deployment action. |

`CHROME_PATH=/path/to/chromium` selects an installed browser. `E2E_BASE_URL` opts into a known existing server; without it, PR/release validation builds and owns the production server and refuses an already occupied port. Do not run browser suites concurrently against the same debug port/server. CI retains the existing separate mandatory lifecycle gate job; its layout job excludes only Atlas, because that exact test runs in the lifecycle gate.

Legacy `test`, `test:watch`, `test:regression`, `test:lifecycle` and `test:layout` remain available. `test:e2e` now shares `test:regression`'s fixture setup, fixing its missing-setup failure. Do not execute overlapping aliases after a successful comprehensive run. `node e2e/run-regression.mjs --scenario=core` independently runs the original core create/edit/navigation/dependency/save/reopen journey. `--scenario=volume` selects only volume coverage. Default regression/lifecycle execution retains the complete original journey.

## Fixtures and assertions

The committed `src/testing/fixtures/regression-180.pmp` is the exact output of the existing deterministic regression generator and codec, copied from baseline collection. Its existing round-trip test additionally compares every byte to the committed artifact. Browser runs copy it into an OS temporary directory and clean that directory afterwards; no unit suite needs to rerun just to generate browser setup. The v1.4 fixture remains a file from the real legacy serializer, and the UI-created Atlas demonstration file remains covered by the existing unit round-trip case.

To deliberately regenerate the volume fixture after an intended generator change:

```sh
REGRESSION_PMP_PATH=src/testing/fixtures/regression-180.pmp npm test -- src/testing/regression.test.ts
```

All original assertions and viewport matrices remain. Full mode still creates 30 additional records through each of six UI forms and verifies all 60 per module after reopen. Atlas still creates every entity through the UI; it is not replaced with seeded data. Its final Save step now tolerates autosave having already completed: trigger Save only while enabled, then require Saved status and validate the complete saved bytes, relationships, warnings and audit history. The original click could wait forever on an already disabled Save button.

Optional successful layout screenshots are enabled with `CAPTURE_LAYOUT=1`; automatic failure screenshots remain enabled. Those PNGs were artifacts without image-comparison assertions, so this removes filesystem/browser capture work without reducing regression assertions. Capture-only pacing and media outputs are retained; no videos are regenerated.

## Coverage map

| Critical boundary | Retained protection |
| --- | --- |
| Functional commands, hierarchy/progress, statuses, filters, selection, creation validation | All domain/application/feature Vitest cases; core CDP; shared controls/batch/candidate; six entity creation panel tests at all original widths |
| Persistence, file validation, legacy compatibility, metadata, save failure recovery | Codec/browser-service/runtime Vitest; byte-checked volume fixture; v1.4 open/edit/save/reopen; core and volume save/reopen; Aurora and Atlas saved bytes |
| Dependencies and derived warnings | Task/milestone dependency, Gantt/Tube Map model and warnings unit cases; core warning navigation; Atlas warning open/correct/clear and saved dependency relationships |
| Layout and accessibility | All 54 Playwright cases across original widths plus CDP geometry, keyboard/focus, navigation semantics and mobile overflow assertions |
| Full lifecycle and release | All original CDP checkpoints, including 180 additional UI creations; Atlas and Aurora; main/PR lifecycle gate; nightly/manual full lifecycle workflow |
| Native consent and physical-machine compatibility | Existing manual acceptance boundary; Linux in-memory picker mocks do not establish native OS behavior |

Coverage here means scenario and assertion coverage. No new coverage dependency or instrumented percentage is introduced.

## Workflow consolidation

- `validate.yml` retains its job identifiers, PR/main triggers, unit/static/build/audit checks and mandatory full lifecycle gate. Remove the non-full custom regression from its other job because the full gate executes its complete superset. That job runs the 53 non-Atlas Playwright cases; the gate runs Atlas once. Branches/manual dispatches without the full gate retain a non-full regression/Atlas fallback.
- `v14-validation.yml` keeps its triggers and job identifier. Its job skips PRs targeting `main`, where `validate.yml` owns the same checks, avoiding a duplicate install/unit/typecheck/lint/build. Manual runs and PRs targeting other branches retain their original checks, preserving ongoing development. No branch-protection settings are changed; GitHub reports conditionally skipped jobs as successful checks.
- `regression-lifecycle.yml` retains nightly and manual execution; remove push execution already covered by the mandatory main gate. Scope its concurrency by ref so a manual branch run does not cancel a scheduled main run.
- Keep independent scheduled security audits, video playback checks and all release/publication workflows unchanged. Their distinct service/asset boundaries are not replaced by application validation.

No tests are deleted. Duplicate *executions* are consolidated, and the previously broken `test:e2e` setup is replaced by the tested shared fixture wrapper. Unit/browser checks that overlap behavior at different boundaries remain; they are not interchangeable.

## Logs, timings and limitations

Validation writes detailed stdout/stderr and a machine-readable `summary.json` under ignored `work/validation-<timestamp>/`. Console output contains one result, elapsed time and available test counts per stage. Failures show a bounded tail and link to the full local log. `E2E_VERBOSE=1` emits individual CDP checkpoints for investigation or coverage comparison. Acceptance no longer prints every successful checkpoint twice.

Baseline and after measurements are recorded below. The initial machine had stale/incomplete preinstalled dependencies; those attempts were discarded and `npm ci` installed the lockfile versions. Child servers and network calls require the managed executor's network-enabled command mode. Some initial browser timing was collected concurrently against a development server and is explicitly marked exploratory. Do not interpret a development-to-production difference or different host load as an isolated optimisation speedup. Stable performance claims require repeated measurements on a dedicated runner; do not repeat successful suites merely to obtain a better number.

## Baseline inventory and measurements

Baseline collection completed before editing tests. Exact results: [testing-baseline.json](testing-baseline.json). Linux, Node 24.19.0, Chromium, Vitest 4.1.12, Playwright 1.64.1, Next 16.4.2; installed from the unchanged lockfile. CI uses Node 22, so local timings are not a CI SLA.

| Suite/command | Baseline wall time | Baseline count/result | Conditions |
| --- | ---: | --- | --- |
| `npm test` | 65.894 s | 51 files / 453 passed | Concurrent with build; exploratory |
| `npm run build` | 78.324 s | Passed | Concurrent with unit tests; exploratory |
| `test:e2e` | 26.546 s | 115 checkpoints then missing TASK-005 setup failure | Sequential, production on port 3001 |
| `test:regression` | 120.681 s | 18 repeated unit cases, 240 CDP checkpoints and Atlas passed | Sequential, production on port 3001 |
| `test:lifecycle` | 741.439 s | 18 repeated unit cases, 246 CDP checkpoints and Atlas passed | Dev server shared with layout; exploratory |
| `test:layout` | 585.221 s | 54 cases: 53 passed; Atlas disabled-Save timeout | Dev server shared with lifecycle; exploratory |

Vitest configuration selects `src/**/*.test.ts` in Node. The 51 files cover domain (5), application (7), feature (28), persistence (2), runtime (1), shared metadata/assets (5), and testing/compatibility/volume (3); the authoritative file inventory is `rg --files src -g '*.test.ts'`. Playwright has 6 specs: creation-panels (21 cases), status-batch (7), search-filter (3), timeline-toolbar (21), release-smoke (1) and demo-lifecycle (1), totaling 54.

Custom runner inventory: `acceptance.mjs` owns the browser/profile/server and core journey; `v15-shared-controls.mjs` protects predictive controls, search/filter state and Today markers; `regression.mjs` protects volume rendering and persistence plus optional 180 UI creations; `v15-batch.mjs` protects filter logic, keyboard owners and relationship editors; `ui-design-system.mjs` protects geometry, sidebar and quick editors; `v15-candidate.mjs` protects blur normalization, undo/audit, legacy files and Save/Discard/Cancel/failure recovery; `atlas-regression.mjs` invokes the existing Playwright Atlas case. `verify-demo-site.mjs` protects native video playback, separately from application acceptance.

Fixture inventory: `src/domain/test-fixtures.ts` factories, `src/testing/regression-fixture.ts` deterministic 180-record state, `src/testing/fixtures/v1.4-rich-project.pmp` real legacy file, and `docs/media/Atlas-Software-Delivery.pmp` real UI-produced demonstration. Layout specs already use deterministic PMP setup; those were retained. Full lifecycle form creation and Atlas creation are assertions, not replaceable setup.

The most expensive retained work is the 180 UI form creations and the complete Atlas journey. Other avoidable costs are repeated unit setup, repeated Atlas/custom journeys, and successful screenshots across the viewport matrix. Capture-only pacing is already gated in the recorder; it was not globally replaced with sleeps or arbitrary shorter timeouts.

## After verification and comparison

`CHROME_PATH=/usr/bin/chromium E2E_VERBOSE=1 npm run validate:release` passed the complete shared PR/release path. The verbose flag was used once to compare checkpoint identities; routine validation uses concise output. [testing-after.json](testing-after.json) contains stage results and assertion-retention counts.

| Suite | Before | After | Result and interpretation |
| --- | ---: | ---: | --- |
| All unit tests | 65.894 s | 36.19 s | Same 51 files / 453 passing tests; added byte assertion inside an existing case. Before ran alongside build; not an isolated speedup. |
| Production build | 78.324 s | 34.73 s | Passed both times; before ran alongside unit tests; caches/load differ. |
| Non-full regression | 120.681 s | 124.399 s | Same 240 named CDP checkpoints and Atlas passed. This sample is 3.1% slower; no per-suite speedup claimed. |
| `test:e2e` | 26.546 s, failed at missing setup | 124.399 s, passed | Now the same fixture-backed entry point as non-full regression; previously only 115 checkpoints completed. This repairs coverage, not a speed claim. |
| Full lifecycle | 741.439 s, including Atlas | 111.90 s CDP stage; Atlas in layout stage | All 245 non-Atlas checkpoint identities match; all 180 additional UI creations retained. Before used a shared dev server; Atlas ownership changed. Do not directly divide these timings. |
| All Playwright | 585.221 s, 53 passed / 1 failed | 315.60 s, 54 passed | Every original case and viewport retained; disabled-Save race fixed. Before used a shared dev server. |
| Quick (new) | No dedicated level | 2.95 s | 7 files / 60 domain and persistence tests; narrower smoke scope. |
| Core (new selector) | Coupled to the extended journey | 26.686 s wall | 46 checkpoints; independent core UI creation/persistence scope. |
| Volume (new selector) | Coupled to core/shared controls/Atlas | 9.23 s stage, 10.252 s wall | 20 checkpoints; direct fixture open/render/sort/search/save/reopen. Excludes full form-creation mode unless `--full` supplied. |

Other full-run stages passed: typecheck 9.06 s, lint 10.47 s, production audit 1.11 s, development audit 1.53 s. Both audits found **0 vulnerabilities** at verification time. Summed full-pipeline stage time was 520.59 s; this is not a measured before/after CI wall-time comparison. Baseline shell timings include npm startup, whereas new stage timings measure the child process directly.

The reproducible savings are execution ownership and scope selection, independent of noisy host timings. On a source PR targeting main (when the historical workflow's path filter matched), automatic Vitest case executions fall from `453 + 453 + 18 + 18 = 942` to **453**, with the same unique cases. Static typecheck/lint/build batches fall from two to one. Full and non-full CDP journeys become one full superset, while Atlas executions fall from **three to one**. The full CDP success-checkpoint output falls from 492 duplicated lines to one summary by default; detailed checkpoints remain opt-in and full runner logs stay on disk.

| Consolidated/replaced work | New owner | Justification |
| --- | --- | --- |
| Two browser-time runs of all 18 regression unit cases | Main unit suite; byte-checked committed fixture copied for browser setup | Unit assertions remain; fixture creation no longer triggers unrelated validation. |
| Non-full browser regression alongside mandatory full regression | Full lifecycle gate on main/PRs | Full mode executes every non-full checkpoint plus six creation-volume checkpoints. Non-gated branch/manual fallback retained. |
| Atlas in both custom wrappers and all-layout | One Atlas execution per validation path | Exact Playwright test retained; full local validation owns it in layout, CI owns it in lifecycle. |
| Historical main-targeting PR static/unit/build batch | Existing main validation workflow | Preserve its triggers/job and all non-main/manual checks, protecting ongoing development. |
| Standalone lifecycle push duplicate | Existing main gate | Nightly/manual full regression remains. |
| Unconditional successful layout PNGs | Opt-in `CAPTURE_LAYOUT=1`; automatic failure PNGs unchanged | All 298 source `expect(...)` calls across the six specs remain, along with all parameterized tests. No image-comparison assertion existed. |
| Broken unseeded `test:e2e` entry point | Shared fixture-backed regression wrapper | Missing TASK-005 setup is repaired; every later assertion can now execute. |

No tests or assertions were removed. No application source, dependency version, engine declaration, lockfile, product requirement or `.pmp` implementation/contract changed. No merge, release or deployment was performed.

Remaining limitations: timings are single samples with differing contention/server modes and cannot establish a CI speedup percentage; local verification used Node 24 while CI uses Node 22; native Windows/macOS consent and physical disk evidence remain manual; demo recording and opt-in successful screenshot capture were not regenerated. Scheduled security/asset checks still have their distinct coverage responsibilities. PR CI is separate evidence from local success and must retain its mandatory lifecycle gate.
