# v1.7 testing enhancement and cleanup

Source: current main `ab913ad372acf3822ee38d5b8df6f5536dbefa7a` (v1.7.0), 13 November 2026. Follow-up to merged PR #24. Scope is testing infrastructure and documentation; application functionality, requirements, `.pmp` data/format, dependencies, release and deployment workflows stay unchanged.

## Findings and changes

1. **Full validation bypassed the package build gate.** `package.json` now requires `ui:tokens:check` before Next.js, but `validate:pr` and `validate:release` called Next.js directly. Both now invoke `npm run build`, preserving current token validation and future npm build hooks. A failing package build stops browser execution and records the failing stage. Full validation requires its documented npm entry point and fails before running tests if called without npm context.
2. **Flags could accidentally select the entire suite.** Targeted commands previously checked only for a non-empty argument list. For example, `unit --passWithNoTests` or `layout --reporter=list` could run every case. An existing test path/directory or a positive test-name filter must now be first; reporter/output flags follow it. Empty, invalid or flags-only scopes fail before spawning tests.
3. **The orchestrator itself had no executable regression coverage.** Eleven small Node tests exercise the real CLI in temporary directories using command doubles. They verify the build failure barrier, suite ownership, full lifecycle flags/Atlas ownership, production versus informational audit failures, selection forwarding, quick scope, and fail-fast npm usage. No browsers or real builds are started by these tests; no dependency was added. They run once in quick/full validation and in a dedicated main CI step before the existing product unit suite. `npm test` retains its Vitest-only CLI behavior, including reporter and argument forwarding.
4. **Summary parsing could match test-name text.** Summary extraction now matches complete count lines, preventing names such as `--passWithNoTests` from expanding a concise result into unrelated TAP output. A runner test protects the one-line summary.
5. **Comparison screenshots dirtied tracked documentation assets.** The Milestones Scope and Tube Map comparison specs wrote four PNGs directly into `docs/media` during normal regression runs. They now keep the same captures under `info.outputPath(...)`, respecting Playwright’s per-test directory and configured output root. Original documentation images are restored; promoting new illustrations is a separate reviewed action. Both affected 1440px scenarios were rechecked, including capture existence and a clean `docs/media` diff.
6. **Documentation still described runtime fixture generation.** Corrected the architecture testing paragraph to describe the committed, byte-checked fixture copy. Marked old v1.5/v1.6 counts as historical evidence and updated Codex suite-selection guidance.

Valid targeted examples:

```sh
npm run test:targeted -- unit src/features/tasks/commands.test.ts
npm run test:targeted -- unit -t 'dependency'
npm run test:targeted -- layout e2e/layout/creation-panels.spec.ts --grep 'Task full'
npm run test:targeted -- layout --grep 'critical path'
npm run test:targeted -- volume
```

Run full validation through `npm run validate:pr` or `npm run validate:release`, so the package build gate and npm context are available. `npm run test:validation` checks the orchestrator alone. `test:watch`, existing browser aliases, the full 180-form lifecycle and all product test assertions remain available.

## Baseline

The restored environment initially lacked the already-declared `lucide-react` dependency; `npm ci` restored the unchanged lockfile. That incomplete-install attempt is excluded from performance comparison.

- Vitest: **67 files / 561 tests passed**, 32.03 s Vitest duration, 32.748 s shell wall time.
- Playwright: **241 cases in 27 specs** collected before changes.
- UI token check: passed on the unmodified generated CSS.
- Build-gap reproduction: a disposable package-build command was configured to fail with status 17, but the old full runner skipped that command, returned success and ran browser command doubles. The same test now requires a failure and zero browser commands.

The original historical timings remain in [Testing optimisation](TESTING_OPTIMISATION.md). They describe earlier product versions and are not a v1.7 speed benchmark. This follow-up closes false-success and accidental full-suite paths; it does not claim that executing the same full suite became faster.

## Coverage and limitations

No product test, assertion, viewport, fixture, lifecycle creation loop or release scenario is removed or weakened. All v1.7 Critical Path, warning/dependency, Gantt, Tube Map, baseline, file migration and persistence cases remain in the existing Vitest/Playwright discovery configuration. No browser timeout, retry policy or worker count is changed.

The Node command-double tests verify orchestration, not browser behavior; the full product suite supplies that separate evidence. Native browser/OS picker consent remains manual. Audit results depend on the advisory database at execution time, and full development audit failures retain the existing informational policy. Successful checks on unchanged product/test code are not repeated for documentation-only edits.


## Verification results

| Check | Result | Measured time |
| --- | --- | ---: |
| Baseline application Vitest | 67 files / 561 passed | 32.748 s shell wall |
| Runner contracts, final standalone check | 11 passed | 3.384 s |
| Application Vitest in full validation | Same 67 files / 561 passed | 38.96 s child stage |
| Typecheck / lint | Passed, including focused checks after the output-path change | 9.94 s / 13.23 s initial stages |
| Canonical package build | Passed, including `ui:tokens:check` | 49.09 s |
| Full lifecycle | All 245 checkpoints passed, including 180 additional form-created records | 155.77 s |
| Full Playwright run | **240 passed / 1 failed**, 241 collected | 746.51 s |
| Targeted browser recheck | **3 passed**: unchanged failed tooltip case plus the two screenshot-output scenarios | 21.48 s |

Full run: `CHROME_PATH=/usr/bin/chromium npm run validate:pr`.
Targeted recheck: `CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/text-hint-overflow.spec.ts e2e/layout/milestone-scope.spec.ts e2e/layout/tube-comparison.spec.ts --grep 1440`.

The full run failed in `text-hint-overflow.spec.ts`, “text hints appear only for clipped cells, selections and pills at 1440”, waiting for the long Task-owner tooltip. Its application implementation and test match main exactly. The single isolated recheck passed with the same assertions. The initial failure screenshot and error context were preserved in ignored `work/v17-testing/tooltip-failure/` before the recheck. Its intermittent cause is **unconfirmed**; no application code, test assertion, retry policy or timeout was changed to obtain a pass. **The full run is not reported as clean.** CI must still satisfy the normal mandatory checks; the follow-up PR remains draft pending that evidence.

All 241 browser definitions remain collected after cleanup, and all browser assertion lines match the baseline. The only product-spec edits move screenshot destinations and use the existing Playwright test-info argument. The tracked documentation PNGs, application source, fixture bytes, dependency versions, package version and lockfile are unchanged. Product tests were not repeated after documentation-only edits; only the failed case and the two changed output paths were rerun.

These are single samples, with baseline npm startup versus after child-stage timing and differing host load. No same-suite performance speedup is claimed. The benefit is eliminating accidental full-scope runs, restoring a required build gate, retaining concise summaries and avoiding routine tracked-asset rewrites. Raw logs remain ignored under `work/`; [machine-readable evidence](testing-v1.7-cleanup.json) preserves both the failed full run and successful focused recheck.

## Performance follow-up to merged PR #36

See [QA performance investigation](TESTING_PERFORMANCE_PR36.md) for the 2/3/4-worker comparison, the measured removal of two dirty-draft navigation timeouts, unchanged assertion/viewport coverage, and subsequent tooltip failures. Its final release validation is explicitly recorded as failed; successful focused diagnostics do not resolve the tooltip flakiness. The PR #36 implementation and historical evidence above remain intact.
