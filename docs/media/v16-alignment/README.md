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

## Shared internal field text alignment

- [Streams: Name, Owner and Status text share a fixed internal band](shared-field-text-streams.png)
- [Create Task: the same metrics at the existing creation-field height](shared-field-text-create-task.png)

One shared 20px line and 8px inset now determine text placement in boxed native inputs/selects, dates, textareas and predictive/relationship summaries. Existing ordinary/creation/embedded heights derive their symmetric padding from the same variables. Scope-pill wrapping remains unchanged. The new browser assertion measures actual summary glyph rectangles, shared computed field metrics, and available selected-label space; earlier checks only tested outer boxes and missed the discrepancy.

Final affected verification on `0956f17a27b1bbd950a6432bff0ca085a0e26e4b`: **all 60 browser cases passed** (90.25s), build/typecheck/lint passed. Earlier complete gates remain historical evidence for unchanged persistence/domain behavior; no merge/deploy/release.

## Standard Gantt surface and full viewport

- [Simple: shared action sizes and docked footer](gantt-standard-simple.png)
- [Extended: Tasks fills the remaining viewport](gantt-standard-extended.png)
- [Extended at 900px](gantt-standard-extended-900.png)
- [Grey baseline band and red delayed finish](gantt-visible-baseline-comparison.png)
- [Shared clearly editable dropdown search](dropdown-editable-search.png)

These are actual application screenshots. Standard Gantt actions use another toolbar row when the centered Search leaves insufficient room; they retain the same font/height as ordinary page actions. Comparison fields share compact spacing/text alignment across Gantt/Tube Map/Baselines. The grey baseline band remains visible below current bars; red marks only finishes after the selected approved date. The measured workspace reaches the viewport bottom; Extended retains its splitter, independent scrolling and fully displayed Add Task. The focused and complete-gate results are recorded in validation.json.

Complete serial verification on `a8dc681983670244771e8c22cdd5d295d0f62111`: **480 unit tests, 245 lifecycle checkpoints, all 111 browser cases passed**, plus typecheck/lint/build. Screenshots above come from that final run; minimum splitter assertions retain a complete first task and no Tasks bottom gap in the tested fixtures. Exploratory interrupted/failed runs are superseded and recorded in validation.json.

## Footer Zoom, short dropdown placeholder and shared Tasks selection

- [Simple: Zoom beside date navigation](gantt-footer-zoom-simple.png)
- [Extended: Zoom in upper pane footer](gantt-footer-zoom-extended.png)
- [Dropdown placeholder: Type to filter](dropdown-short-placeholder.png)
- [Standalone Tasks: aligned selection column](tasks-selection-aligned.png)

Latest presentation-only follow-up: 71 affected browser cases passed, then all three corrected content-band selection tests passed (9.0s); build/typecheck/lint passed. The selection cases cover both views and sidebar states at three widths, including keyboard select-all and indeterminate states. Exact scope and preceding full-gate evidence remain in validation.json.
