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

Measurement and final validation results will be added after the investigation.
