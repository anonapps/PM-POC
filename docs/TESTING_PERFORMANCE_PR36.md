# QA performance follow-up to PR #36

Base: `562d8b57b723c51ad4d28fd4727142b6ad9e59bf`, the merged PR #36 commit on main. Dedicated branch: `perf/qa-automation-followup-36`. No application, UI, dependency, fixture or PMP changes are authorised by this investigation.

## Review before changing tests

The suite has 241 Playwright cases in 27 specifications. Similar browser scenarios protect different boundaries:

| Overlap | Distinct coverage retained |
| --- | --- |
| Creation panels / custom full lifecycle / Atlas | Panel validation, keyboard and viewport matrices / 180 additional form creations and reopen counts / complete UI-created delivery project, relationships, warnings and saved bytes |
| Atlas / Aurora release smoke | UI creation journey / independently seeded release scenario and saved project verification |
| Timeline toolbar / Gantt surface / Extended Gantt / desktop records | Search alignment and controls / surface styles / split resizing, quick edits and persistence / viewport fitting across record modules |
| Tooltip, action icons and shell | Clipped text and keyboard hints / action semantics / delayed hover and suppression behavior |
| Vitest persistence / browser picker mocks | Codec and file-service boundaries / user-visible open, save, close and reopen journeys |

No scenario is proposed for deletion or merging. Fresh Playwright contexts and independent picker bytes are intentional isolation. Similar mock shapes have different transactional writes, modification timestamps, picker counters and saved-byte accessors; replacing them wholesale risks losing observable behavior. Most fixtures already serialize once per worker module. Navigation is often the action being tested, not redundant setup.

The 400 ms negative-tooltip observation spans the application's 300 ms activation delay. Shell waits exercise delayed opening, closing and suppression; transition sampling checks intermediate geometry. They cannot simply be deleted. Recording pacing is already conditional. Successful screenshot outputs retained by PR #36 remain unchanged.

## Measurement protocol

Use the unchanged lockfile, production build and Chromium executable. Serialize browser runs against one production server; do not overlap lifecycle and Playwright. Run one full sample at each of two, three and four workers; record failures rather than retrying for a favorable result. Compare the selected final configuration again only for justified after measurement/full release validation. Single samples describe this runner, not a reliability rate or CI SLA.

Raw commands, JSON reports, failure artifacts and logs stay under ignored `work/qa-performance/`. Exclude dependency restoration and build preparation from browser timing. The initial preinstalled dependency tree lacked `lucide-react`; `npm ci --cache /workspace/PM-POC/work/npm-cache` restored the unchanged lockfile after the default cache path was unwritable.

Runtime: Linux, Node 24.19.0, Chromium 151.0.7922.173, Playwright 1.64.1; two CPUs of cgroup quota, 8 GiB memory limit. CI uses Node 22 and a different runner. PR #36 CI run [43418647344](https://github.com/anonapps/PM-POC/actions/runs/43418647344) reports 313 s layout and 224 s lifecycle browser steps; those are historical CI reference values, not a controlled local comparison.

## CI review

Keep `validate` and `lifecycle-release-gate`, all triggers and fallback paths, runner contracts, package build/token checks, audits, nightly/manual lifecycle and release validation. PR #36 already consolidated duplicate validation and Atlas ownership. npm caching already exists in both mandatory jobs. No cache or job change is justified without a measured benefit. Branch-protection metadata returned HTTP 403 (`Resource not accessible by integration`); settings are not modified.

## Worker benchmark results

All three samples used unchanged test code, the same production build and server, and zero retries. Wall time includes CLI startup and JSON reporting. Each sample collected all 241 cases; no skips occurred.

| Workers | Wall time | Result | Decision |
| --- | ---: | --- | --- |
| 2 | 690.82 s | 241 passed | Keep the default |
| 3 | 687.83 s | 240 passed / 1 failed | 0.4% faster is negligible; tooltip failure at 900 px |
| 4 | 728.76 s | 237 passed / 4 failed | 5.5% slower and unstable; omit |

Four-worker failures: Stream full creation panel at 1440 exceeded the unchanged 60-second test timeout; Delete-last pulse inspection received a null bounding box; long Task-owner tooltip assertions failed at both 900 and 1440. Three workers failed the same tooltip assertion at 900. Do not infer a population failure rate from these single, differently configured samples. No worker-count, retry, assertion, viewport or timeout change is retained.

The slowest baseline specifications by **summed test duration**, rather than parallel wall time:

| Specification | Two-worker test seconds |
| --- | ---: |
| creation-panels | 209.03 |
| timeline-toolbar | 175.87 |
| extended | 107.89 |
| compact-rhythm | 105.26 |
| demo-lifecycle (Atlas, one case) | 87.14 |
| consolidated-ui | 69.86 |
| critical-path | 60.97 |
| search-filter | 49.70 |

Atlas is the slowest individual case. Its full UI creation, pointer-cue assertions, warnings, dependencies, audit and saved-byte checks remain. The next slowest individual baseline case is the compact Gantt-band matrix (23.23 s). Higher concurrency lengthened individual cases substantially; it did not provide useful throughput here.

## Lifecycle profiling and optimisation

The unchanged custom full lifecycle passed all **245 checkpoints** in **142.61 s**, including the complete 180 additional form creations. The six creation loops occupied **57.33 s** (from decision-search completion to the final creation checkpoint). There is no evidence to replace those loops or their form submits with seeded data. Fixture opening was already fast (33 ms diagnostic), and the retained committed volume fixture eliminates runtime generator/test duplication.

CDP instrumentation recorded 2,269 requests and 117.04 s of summed request time. Of 223 gaps near the harness's 100 ms polling interval, **192** checked whether Streams had become the active page during the two intentionally blocked dirty-draft navigation attempts. The corresponding checkpoints were at 2.23 s before the guard scenario, 12.35 s for its first dialog, and 22.48 s after Discard. Each navigation-success wait spent its full existing 10-second deadline before a catch swallowed the expected timeout.

The retained change separates `requestNav` (click the navigation button and reject a missing button) from `nav` (request navigation, then require the destination to be active). Only the two dirty-draft attempts call `requestNav` directly. Both explicitly wait for “Discard unsaved changes?” before interacting. Existing Stay/draft preservation and Discard/destination assertions remain. Every normal navigation retains its original success wait, deadline and poll interval. No exception is swallowed to continue this scenario.

This removes two waits for a success condition that the scenario requires to be false. It does not shorten a readiness deadline or change application behavior. No change is made to form creation, project loading, file-picker mocks, fixture bytes, screenshots, generic polling or the full release gate.

## Tooltip investigation

The PR #36 long Task-owner tooltip failure reproduced on unchanged source at 900 px with three workers, and at both widths with four. Each failed while waiting for `.title-tooltip` to contain the complete owner name within the existing 5-second assertion deadline. Failure screenshots and error contexts are preserved under the corresponding `work/qa-performance/baseline-<workers>-artifacts/` directories.

A focused diagnostic copy retained the original assertions and added only event/title-mutation logging plus traces. Six cases (both widths repeated three times at three workers) passed in 65.66 s. Logs showed title suppression/restoration and custom-tooltip creation in successful attempts, plus browser scheduling gaps; they did **not** establish the failing event sequence or a root cause. Trace instrumentation adds load and those successful diagnostic attempts do not replace the failed full runs. The custom hint deliberately resembles native tooltip styling, so a screenshot alone cannot distinguish them.

Source inspection identifies possible cancellation paths: scrolling cancels pending hints, and movement within the same active anchor does not restart the delay. These are hypotheses, not confirmed causes. **Flakiness remains unresolved.** No application fix, hover reattempt, extra timeout, retry, forced interaction or weakened assertion is introduced to make this case pass.

## Reproduction

These are deliberate benchmarks, not routine validation commands. Do not repeat the worker matrix on every Codex task; rerun it only when the suite or runner characteristics justify a new concurrency investigation.

1. Restore the unchanged lockfile with `npm ci`, then `npm run build` (including the token gate).
2. Start one production server in another terminal: `npm run start -- --hostname 127.0.0.1 --port 3000`.
3. Serialize the following command for `N=2`, `N=3` and `N=4`, changing the JSON/artifact paths each time. Record the exit code and real elapsed time; do not retry a failed sample for a better result.

```sh
mkdir -p work/qa-performance
/usr/bin/time -p env CHROME_PATH=/usr/bin/chromium \
  E2E_BASE_URL=http://127.0.0.1:3000 \
  PLAYWRIGHT_JSON_OUTPUT_NAME=work/qa-performance/sample-N.json \
  LAYOUT_OUTPUT_DIR=work/qa-performance/sample-N-artifacts \
  node node_modules/@playwright/test/cli.js test --workers=N --reporter=json
```

For lifecycle comparison, use the same server/browser and run `node e2e/run-regression.mjs --full --skip-atlas` at the base commit and this branch, with `CHROME_PATH` and `E2E_BASE_URL` as above. Atlas is covered once in the complete Playwright suite. `E2E_VERBOSE=1` exposes checkpoint names for retention comparison. Full release verification must still use `npm run validate:release`; the benchmark commands are not substitutes for its package build, static, unit, lifecycle and audit gates.

## Before/after and validation

Both lifecycle profiles used the same Chromium, production application code, fixture, verbose checkpoints and CDP instrumentation, serialized on this runner. The after run is the lifecycle stage of canonical `validate:release`, with its own production server after the canonical package build. Profile wall time excludes the wrapper/server startup; the validation-stage measurement includes the fixture wrapper and cleanup.

| Measurement | Before | After | Interpretation |
| --- | ---: | ---: | --- |
| Dirty-draft guard scenario | 20.247 s | 0.057 s | **20.19 s removed** from two expected navigation-success timeouts |
| Full custom lifecycle, profiled process | 142.61 s | 110.63 s | Same 245 named checkpoints in the same order; total difference 31.98 s, not all attributed to the change |
| CDP requests | 2,269 | 2,077 | 192 unnecessary probes removed |
| Complete 180-form creation loops | 57.33 s | 56.50 s | Unchanged source and complete UI scenario; ordinary timing variation |

The attributable saving is the 20.19 s guard-scenario difference. Other unchanged stages also vary, so the full lifecycle difference is a single-sample observation, not a claim of a repeatable 22.4% speedup. Avoided deadlines apply to every execution of this custom journey, including the mandatory CI gate and nightly/manual lifecycle. No controlled before/after CI runner or monetary Codex billing claim is made. Actual savings are reported in elapsed time and removed redundant probes.

Current release validation: runner contracts 11 passed (2.36 s); Vitest 67 files / 561 passed (29.31 s); typecheck 9.66 s; lint 12.64 s; canonical package build with token gate 24.64 s; full lifecycle 245 checkpoints passed (110.77 s child-stage time). The full Playwright stage completed in **646.03 s: 239 passed / 2 failed**, with 241 collected. Both failures are the unchanged long Task-owner tooltip cases (900 and 1440 px). **The full release command exited 1 and is not clean.** Screenshots/error contexts were copied to `work/qa-performance/release-tooltip-failures/`. This also confirms that retaining two workers does not resolve the existing flakiness. No successful full suite is repeated to seek a green outcome.

Fail-fast validation stopped before the audit stages. Audits are therefore executed separately under the unchanged blocking-production/informational-full policy, with their results recorded below. This does not turn the failed full command into a pass.

Full command: `CHROME_PATH=/usr/bin/chromium E2E_VERBOSE=1 npm run validate:release`, with opt-in diagnostic `NODE_OPTIONS` importing the ignored CDP profiler only for the acceptance process. Instrumentation records timestamps/requests and does not change test conditions or behavior. Routine validation does not need that profiler or verbose mode.

All 27 Playwright spec hashes and their 1,524 source `expect(...)` calls match the base exactly. No application, dependency, lockfile, generated asset, fixture, PMP or workflow change is part of this PR. Native picker/OS consent remains a separate manual boundary; Linux mocks do not establish physical-machine acceptance.

Machine-readable measurements, stage results and limitations: [testing-performance-pr36.json](testing-performance-pr36.json).

Standalone audits (13 November 2026): production audit exited 0, with 53 low and no moderate/high/critical advisories; full audit exited 1, with 53 low and 7 moderate, no high/critical. The full audit remains informational under the existing policy. No dependency changes are made. These advisory results are time-dependent and do not change the failed browser/release status.

The PR is prepared as a draft because full release validation remains blocked by the reproduced tooltip flakiness. CI results are separate evidence; a passing CI run would not erase the local failed samples. No merge, release or deployment is authorised or performed.
