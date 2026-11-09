# Compact Gantt stream and calendar bands

Approved follow-up on `feature/global-sidebar-floating-toolbar`, based on `e20f6b9`. The existing draft PR #30 remains open. The working tree was clean before this change.

One scoped CSS recipe in `src/features/shared/planning-controls.css` defines a private 24px Gantt band height. It applies to both cells of each Stream/Project-wide section and to each year/date line. Section buttons fit the new band without font changes; the Item heading spans the two calendar lines (48px). The bands remain fixed across Simple/Extended, expanded/collapsed and baseline/variance states. Narrow dates stay on one line, using the existing truncation and full-range titles.

Before: Simple section cells measured 45px (44px minimum plus content), Extended sections 32px, calendar labels 36px. After: all section cells and both calendar bands measure 24px. Direct before/after browser measurements confirm every captured font declaration is unchanged: 14px Stream names and 12.8px calendar text. Task/milestone row rules, chart data/geometry calculations, dependencies, colors, sidebar, save/undo/redo, persistence and PMP schema are unchanged.

## Validation

| Check | Result | Elapsed |
| --- | --- | --- |
| New compact-band layout case | Passed | 10.53s |
| Existing timeline, Extended and Critical Path specs (new case excluded) | 62 passed; three obsolete mode-height assertions corrected below | 147.45s |
| Final compact-band, footer/zoom and resizing cases | All 12 passed | 37.59s |
| TypeScript (`npm run typecheck`) | Passed; also checked by final build | 3.947s |
| Final lint (`npm run lint`) | Passed, zero warnings | 17.613s |
| Final production build (`npm run build`) | Passed, including token check and TypeScript | 29.466s |

**66 distinct browser cases verified across focused runs.** Existing three resizing cases previously asserted that the first section row becomes shorter in Extended mode. They now assert the approved 24px equality in both modes, retaining all palette, keyboard/pointer resizing, independent-scroll and overflow assertions. The remaining 62 existing cases passed, including Gantt footer/date navigation, Tube Map safeguards, Extended editing/history/PMP reopen, Critical Path selection/reveal and shared-layout checks.

The new case checks every section cell, header alignment, unchanged fonts, record-row minimums, expanded/collapsed parity, baseline and variance options, plus Week/Month/Quarter headers at 900px and 375px widths. The final 12-case run rechecks the affected mode assertions and footer/zoom matrices after making narrow dates single-line. No unit/full lifecycle suite is repeated for this CSS-only change; the shell validation at `e20f6b9` remains separately documented in `GLOBAL_SHELL_VALIDATION.md`.

[Before/after screenshots and measured fonts/heights](media/gantt-compact-bands/README.md). Logs are retained under ignored `work/gantt-bands-*.log` and `work/validation-2026-11-09*`. Captures use Linux Chromium and disposable browser file adapters; native OS file-picker/physical-machine evidence remains manual. Owner visual acceptance and CI are separate evidence. No merge, tag, release or deployment was performed.
