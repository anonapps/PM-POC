# Gantt warning placement

> Implementation/evidence record. The consolidated content is now integrated through [PR #34](https://github.com/anonapps/PM-POC/pull/34) (`9266a02`, 12 November 2026). Use the [v1.7 manual](V1.7_UI_REFERENCE.md) and [current UI guide](ARGOS_PM_UI_REFERENCE.md) for final labels and behavior, including the historical-marker fix. Branch instructions and measurements below retain their original scope/date; this is not a release/deployment record.

Follow-up on `feature/global-sidebar-floating-toolbar`, starting from clean commit `a4bf623`; draft PR #30 remains open.

The shared Gantt name wrapper preserves the original text area's width, indentation and font for both tasks and milestones. Existing milestone dependency warnings render a single triangle in that wrapper's existing left gutter, 3px before the name. The warning is absolutely positioned, so neither its presence nor opening the popup shifts/resizes the name. The native disclosure marker and separate visible count are replaced by the single triangle; the count remains in the accessible description and title. The existing PredictiveDisclosure retains keyboard opening, Escape/focus return, outside dismissal, top-layer popup positioning and unchanged messages.

Warning lookup rules are unchanged: Gantt currently displays this dependency-warning disclosure for milestones. No task-warning engine or new validation rules are introduced. Task quick edit and milestone navigation keep their existing handlers. The former separate warning line is removed, while name/date order, stream/header compact bands, colors, chart bars, dependency calculations, sidebar, file persistence and PMP schema remain unchanged.

## Verification

| Check | Result | Elapsed |
| --- | --- | --- |
| New placement/disclosure/action cases at 900px and 1440px | 2 passed, each in Simple and Extended | 5.41s |
| Existing warning-layer, Extended edit/history/PMP, analysis/selection and compact-band cases | 8 passed | 29.31s |
| Gantt model/connector and milestone dependency units | 2 files / 39 tests passed | 2.90s |
| TypeScript | Passed | 7.293s |
| Lint | Passed, zero warnings | 8.406s |
| Production build, token check and TypeScript | Passed | 18.184s |

Ten focused browser cases passed. The new cases assert the warning is left of the name with aligned vertical centers, the title retains its full available width and 14px font, and its original row-local offset is 5px/4px in Simple/Extended. They check no movement when the triangle is hidden or the popup opens/closes, two-warning message contents/count, mouse and keyboard operation, Escape/focus return, outside-click dismissal, task quick edit and milestone navigation. Existing status/warning-layer checks pass at 1024/1440/1920px. No broad successful suite is repeated for this scoped presentation change.

Direct before/after measurements using the original fixture confirm identical name x, width, height, font and row-local y offset in both modes. [Screenshots and metrics](media/gantt-warning-placement/README.md) include closed/open warning states before and after. Existing popup contents and warning calculations are preserved.

Logs are retained under ignored `work/warning-position-*.log` and `work/validation-2026-11-09*`. Browser file adapters and Linux Chromium evidence do not establish native OS/physical-machine acceptance. Owner visual review and CI remain separate evidence. No merge, tag, release or deployment.
