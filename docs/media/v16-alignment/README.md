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
