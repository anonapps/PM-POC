# Approved-design alignment evidence

Captured from the actual application on the alignment branch, using disposable browser PMP file adapters at 1440×1000. These are application evidence, not conceptual mockups. Initial inspection used main `1e9a35e`. The subsequent owner-requested fix aligns Task creation controls in the same standalone/Extended panel; other application surfaces remain unchanged.

- [Extended workspace and unchanged shell](alignment-extended-shell.png)
- [Collapsed sidebar and centered search](alignment-collapsed-sidebar.png)
- [Standalone Tasks after leaving Extended](alignment-standalone-tasks.png)
- [Aligned full-height right Add Task panel — after correction](extended-add-task.png)
- [Create Task before correction](extended-add-task-before.png)
- [Extended baseline/variance and shared edits](extended-baselines-and-edits.png)
- [Enhanced dependency inspection](dependencies.png)
- [Validation counts/timings and explicit initial failure record](validation.json)

The preservation test compares the complete navigation names/order/icons, vertical positions across collapse, project-header markup/geometry across modes, and standalone Tasks controls/values/geometry/typography before and after Extended. Existing three-width exact creation-panel equivalence and lifecycle coverage remain intact. See [reconciliation](../../V1.6_APPROVED_DESIGN_ALIGNMENT.md) for scope, confirmed editing behavior and remaining native OS acceptance.


## Extended Tasks continuity correction

The owner requested one horizontal task row, continuous header styling matching standalone Tasks, vertical control alignment and no horizontal scrolling. The change is scoped to Extended Tasks; standalone Tasks and Create Task remain intact.

- [Before: wrapped task cards](extended-tasks-before.png)
- [After: 1440px](1440-extended-tasks-aligned.png)
- [After: 1920px](1920-extended-tasks-aligned.png)
- [After: 1024px](1024-extended-tasks-aligned.png)
- [After: 900px](900-extended-tasks-aligned.png)

All 12 Extended cases pass on the final layout, including the original preservation, creation-panel and save/reopen cases. Narrow widths use compact controls to retain every column without horizontal scrolling, as explicitly requested.


## Single-line toolbar correction

Gantt title/Search/mode/Expand/Collapse/Zoom now share one vertical centerline. Embedded Tasks title/Search/Show Deleted/Add Task likewise stay on one line. Search stays centered; its width and action spacing adapt at narrower desktop widths. Other standalone pages retain their existing toolbars.

- [Before: wrapping Gantt actions](toolbar-before.png)
- [After: 1440px](1440-single-line-toolbars.png)
- [After: 1920px](1920-single-line-toolbars.png)
- [After: 1024px](1024-single-line-toolbars.png)
- [After: 900px](900-single-line-toolbars.png)
- [After: collapsed sidebar](collapsed-single-line-toolbars.png)

All 46 selected browser cases pass, including five new toolbar geometry/click cases in both modes/sidebar states. Build, typecheck and lint pass. Machine-readable follow-up evidence is appended in validation.json; prior full-suite evidence is labeled historical.

## Baselines proposal — approved reference

[Open the Baselines mockup PNG](baselines-proposed-mockup.png).

This generated proposal illustrates a continuous comparison table and aligned single-line rows. It is conceptual design evidence, not an application screenshot. The owner subsequently approved implementation; actual application screenshots are listed below. Existing UI details and actual date-format requirements remain authoritative over incidental generated-image differences.


## Implemented Baselines alignment

- [Before: comparison cards](baselines-before.png)
- [Actual implementation at 1440px](1440-baselines-aligned.png)
- [Actual implementation at 1920px](1920-baselines-aligned.png)
- [Actual implementation at 1024px](1024-baselines-aligned.png)
- [Actual implementation at 900px](900-baselines-aligned.png)

The approved proposal is implemented with existing application styles/labels: continuous nine-column comparison table, single-line aligned rows, compact baseline list with aligned actions, centered single-line toolbar, existing DD/MM/YYYY schedule dates and signed variance. Long entity/stream values remain in the DOM and in full-text titles; search retains full-name matching. Existing baseline selection/CRUD/Undo/save/reopen and historical stream behavior remain. All 44 targeted unit cases and 7 browser cases passed, plus build/typecheck/lint. See validation.json for scope/counts/timings.


## Final combined verification

All approved UI changes together passed `npm run validate:pr` on application commit `7e49771`: **477 unit/integration tests, 245 lifecycle checkpoints and all 83 Playwright cases**, plus typecheck, lint and production build. GitHub validation and the mandatory lifecycle gate also passed for that SHA; dependency audit steps succeeded and no review threads were present. Earlier targeted/initial failure records remain historical. Final counts/timings/CI link and native-OS limitations are recorded in validation.json and the reconciliation report. No merge or release action was performed.


## Mac desktop acceptance correction — latest verification

The owner's Mac screenshots exposed the generic 1350px card breakpoint and independently scrolling sidebar. Ordinary desktop record tables now have continuous headers matching their body columns; card fallback is reserved for <=600px content. Sidebar spacing fits every existing navigation item to window height with no sidebar scrolling.

- [People at 1366×768](mac-desktop-people.png)
- [Streams at 1366×768](mac-desktop-streams.png)
- [Risk Log at 1366×768](mac-desktop-risk-log.png)

Each screenshot includes all sidebar modules without a scrollbar. Eleven new regression cases assert desktop header/body/control alignment across six modules/five viewport sizes, plus complete fixed navigation at six heights in both sidebar states. Full `validate:pr` passed on application commit `e6d35a2`: **477 unit tests, 245 lifecycle checkpoints, all 94 browser cases**, typecheck/lint/build. This supersedes the earlier 83-case result for current application code. These are Linux Chromium screenshots at Mac-like dimensions; physical Mac confirmation requires pulling the branch/restarting the local server.

## Compact rhythm and consistent search correction

Actual application captures from the final regression run:

- [Tasks: compact control band and header](compact-tasks.png)
- [Streams: compact control band and header](compact-streams.png)
- [Milestones: wrapping scope pills and aligned controls](compact-milestones.png)
- [Dependencies: shared typography and compact rows](compact-dependencies.png)
- [Warnings: clickable content with no Open button](clickable-warnings.png)
- [Gantt: ordinary full-size centered Search](standard-gantt-search.png)
- [Gantt: ordinary narrow-window search-row fallback](standard-gantt-search-narrow.png)

The latest request supersedes the prior narrow Gantt reduced-width search: both modes now use exactly the ordinary 340px Search size and location, including the shared second-row fallback at narrow widths. Record lower padding is 4px, header bands 36px; multiline scope pills may grow their row. Warning titles/entities/descriptions route directly to the owning record using mouse or keyboard. Full Dependencies text remains available through titles/inspection. All screenshots are implementation evidence, not conceptual mockups. See the compact-rhythm entry in validation.json for final application SHA, complete validation and exploratory findings.

Final complete gate on `d4ca7ab`: **477 unit tests / 245 lifecycle checkpoints / all 104 browser cases passed**, plus typecheck, lint and production build. This supersedes the preceding 94-case evidence for current application code.
