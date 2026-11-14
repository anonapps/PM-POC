# Tooltip failure investigation and correction

Follow-up to PR #37's performance investigation, 14 November 2026. Starting commit: `1f937f4` on `perf/qa-automation-followup-36`. This follow-up is explicitly authorised to investigate and fix the tooltip errors. It retains the measured lifecycle optimisation and all PR #36 validation safeguards.

## Confirmed cause

The tooltip failure is test-induced browser starvation, not a confirmed defect in `TitleTooltipProvider`.

The unchanged `text-hint-overflow.spec.ts`, at the existing two-worker setting, reproduced **3 failures / 9 executions** in 63.57 s. Each failure waited for the long Task-owner hint at 900 or 1440 px. Instrumented reproduction with the same complete spec also failed. Event logs showed the pointer entering the correct owner summary, native-title suppression, then a 5–8 second browser scheduling gap before the correct app tooltip appeared. No intervening focus/scroll cancellation explained those failures.

A browser CPU profile captured a failed attempt. Its largest sampled self-time was approximately **4.82 s in Playwright's `isElementHiddenForAria`**. The caller chain ran through `visit` / `processElement`, `generateAriaTree`, and **`ariaSnapshotForExpectFailure`**, rather than the application's tooltip predicate or positioning code.

The installed, lockfile-pinned Playwright 1.64.1 source confirms the behavior: a missing non-array locator assertion collects an accessibility snapshot of `document.body` during its retry processing. The first poll for `.title-tooltip` occurs before the intentional 300 ms hover delay has elapsed. Walking the large Tasks accessibility tree can then occupy the browser long enough to prevent that very timer from running before the unchanged 5-second assertion deadline. This also explains a hint appearing in the later failure screenshot despite being absent during the assertion.

Earlier focus/scroll hypotheses remain unconfirmed and are not used to justify speculative application changes. There is no application, CSS, data model, fixture, PMP or dependency change in this fix.

## Correction and assertion retention

`e2e/layout/text-hint-assertion.ts` first polls `tooltip.allTextContents()`. When the hint is pending, the array read returns `[]` without requesting a whole-page missing-element accessibility snapshot. Within the existing default assertion deadline it requires **exactly one hint containing the expected complete text**. The original single-locator `toContainText(text)` assertion then remains in place.

Only the positive `hint` helper in the overflow spec uses this precondition. All existing assertions and scenarios remain: clipped versus fitting text, native-title suppression/restoration, scope abbreviation, focus behavior, Escape, icon tooltips, both widths, and the full page/viewport matrices. No sleep, timeout, test retry, worker count or application behavior changes. A missing, wrong or duplicate tooltip still fails; the precondition does not merely wait for any tooltip.

## Verification

- Targeted overflow and tooltip-consistency specs, each repeated three times at two workers: **15 passed**, 70.74 s child-stage time. This includes all 9 executions of the previously failing overflow spec plus 6 shared-surface/chart/keyboard checks. Different batch scope means this is not an isolated before/after speed comparison.
- Separate assertion controls using the real helper: missing hint rejected in 4.16 s; wrong text in 4.94 s; duplicate hints in 4.92 s; a correct delayed hint containing the expected substring passed in 0.39 s. The controls use the unchanged default deadline. They are diagnostic checks under ignored `work/`, not extra cases added to every full suite.
- Canonical `CHROME_PATH=/usr/bin/chromium npm run validate:release` **passed (exit 0)**. Runner contracts: 11 passed (2.37 s); Vitest: 67 files / 561 passed (30.99 s); typecheck: 4.80 s; lint: 14.42 s; canonical build/token gate: 23.25 s; full lifecycle: 245 checkpoints passed (121.12 s), retaining all 180 additional form creations; Playwright: **241 passed / 0 failed** (664.05 s).
- Production dependency audit passed (3.84 s), with 53 low and no moderate/high/critical advisories. Full audit remains informational under the unchanged policy (2.94 s): 53 low / 7 moderate, no high/critical. No dependency update is included.

The previous full run's 239/241 result took 646.03 s and stopped the two failing cases early; the corrected 241/241 run completes every journey. Those different outcomes and host variation preclude attributing their timing difference to a same-suite speed change. The practical improvement is eliminating the confirmed false failures and the full-suite reruns they can trigger. Single successful samples do not establish a zero future failure rate.

Raw baseline logs, event logs, the failed CPU profile, assertion controls and after logs remain in ignored `work/tooltip-fix/`. The source diagnostic wrappers and CPU profiling are not shipped or enabled during normal validation. Historical failed full runs remain in [the performance report](TESTING_PERFORMANCE_PR36.md); successful samples are not substituted for them.

## Reproduction and review

Use the unchanged lockfile and a canonical production build. Serialize browser commands, with `CHROME_PATH` selecting Chromium and `E2E_BASE_URL` set only for a known production server. The original failure can be investigated at `1f937f4`; the corrected branch runs the same cases.

```sh
CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout \
  e2e/layout/text-hint-overflow.spec.ts \
  e2e/layout/tooltip-consistency.spec.ts --repeat-each=3
```

The repeated targeted batch is investigation evidence, not a routine requirement for every change. A browser CDP CPU profile (`Profiler.enable`, `Profiler.start`, `Profiler.stop`) exposes the snapshot caller chain. Installed source evidence is in `node_modules/playwright-core/lib/coreBundle.js`, in the missing non-array expectation branch calling `ariaSnapshotForExpectFailure(document.body, ...)`. No library files were patched.

Machine-readable evidence: [testing-tooltip-fix.json](testing-tooltip-fix.json). CI for the updated PR is separate evidence linked in [PR #37](https://github.com/anonapps/PM-POC/pull/37). The historical failed runs remain recorded. No merge, release or deployment is performed.
