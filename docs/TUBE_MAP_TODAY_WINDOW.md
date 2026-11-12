# Tube Map today-focused default and Jump to today

> Implementation/evidence record. The consolidated content is now integrated through [PR #34](https://github.com/anonapps/PM-POC/pull/34) (`9266a02`, 12 November 2026). Use the [v1.7 manual](V1.7_UI_REFERENCE.md) and [current UI guide](ARGOS_PM_UI_REFERENCE.md) for final labels and behavior, including the historical-marker fix. Branch instructions and measurements below retain their original scope/date; this is not a release/deployment record.

Approved follow-up on `feature/global-sidebar-floating-toolbar`, from clean `764ccaa`, in draft PR #30.

Tube Map now passes a four-week-earlier local-calendar anchor into the unchanged twelve-week, Monday-aligned model. Default offset zero and Jump to today's existing reset-to-zero handler therefore use the same window: four complete weeks before the current week, then the current week and seven further weeks. The actual Today date/marker remains unbiased. Monday is exactly one-third through the time axis; later weekdays retain their exact position within the fifth column.

The new `tubeMapWindowAnchorDate` helper reuses existing UTC-safe local-calendar arithmetic and existing four-week paging. The original true-date helper, model calculations, labels, Previous/Next handlers, Jump disabled state at home, filters and all project/file data behavior are retained. No CSS, fonts, header height, persistence or PMP schema changes are included.

## Validation

| Check | Result | Elapsed |
| --- | --- | --- |
| New open/paging/Jump/re-entry browser cases in Europe/Madrid | 3 passed | 6.56s |
| Existing Tube Map/header/sticky/dependency/footer/status/analysis/PMP browser cases | 19 passed | 28.12s |
| Tube Map local-date/model units with `TZ=Europe/Madrid` | 2 files / 47 tests passed | 1.19s |
| TypeScript | Passed | 3.956s |
| Lint | Passed, zero warnings | 14.836s |
| Build, token check and TypeScript | Passed | 26.377s |

22 browser cases verified. The new cases cover a Monday, local New Year (UTC instant still in the previous year), and daylight-saving Sunday. They assert exact 84-day window boundaries/inclusive footer dates, true local Today labels/positions, 12 week columns, 24px header, four-week Previous/Next increments, Jump restoration, preserved date mode, module re-entry defaults and disabled Save Now throughout view-only actions. Unit additions cover actual Today remaining unchanged, year changes and spring/autumn daylight-saving boundaries.

The related existing cases cover week/date display, narrow/desktop headers, stream sorting/lane metrics, sticky/footer bounds, connector tracing/filtering, milestone status/warning layers and shared analysis/PMP compatibility. No successful broad suite is repeated for this focused viewport behavior change.

[Before/after screenshots and measured marker/window](media/tube-map-today-window/README.md). On the fixed Monday, the measured window is 2026-10-12 through 2027-01-03 inclusive, with Today 2026-11-09 at 33.33% across the time axis. The prior single-header evidence is reused as baseline because it is the exact starting implementation with identical fixture/date/viewport.

Logs remain under ignored `work/tube-window-*.log` and `work/validation-2026-11-09*`. Automated browser file adapters and Linux Chromium screenshots do not establish native OS/physical-machine acceptance; owner visual acceptance and CI remain separate evidence. No merge, tag, release or deployment.
