# Consolidated UI/UX batch

This batch implements the six approved changes on `feature/consolidated-ui-ux-batch`, based on `test/latest-ui-fixes`. Its review target is `test/latest-ui-fixes`; merging, publishing and deploying are outside this task.

## Branch preservation

Verified base: `9d96aa1200043dbcefb01bc6bafbc18d115c3362`.
Verified main: `ed30f02b907ba0ff1641def0cb550d95a10ae832`.

`main` is an ancestor of the testing branch, and `git log test/latest-ui-fixes..main` is empty. There were no main-only commits to integrate and no conflicts. The base retains compact action icons, fixed one-line milestone scope summaries, floating global actions, sidebar project/save status, search navigation and warnings, compact timeline headers, PR #30's today-focused Tube Map window, comparison controls, search filters, baseline date tooltips and the unified light-grey tooltip surface. The six changes extend that history rather than replacing it.

## Implementation

1. **Row action feedback.** Shared action buttons check actual store changes before showing independent 600ms effects. Duplicate highlights the source row, even when its copy is offscreen. Delete follows stable identities from the previous visible order and draws a separator at the next row's top, the previous row's bottom, or the empty boundary. No deleted row is retained. Effects follow scrolling/layout, clear on navigation/unmount, ignore cancelled/failed actions, and use a static reduced-motion fallback. Existing domain commands, confirmations, selection, undo and audit behavior remain in place.
2. **Sidebar animation.** The existing expanded/collapsed grid widths transition over 300ms with simultaneous label fading and synchronized workspace movement. CSS transitions reverse from their current interpolated width. Reduced motion disables transitions. Floating actions retain their implementation.
3. **Sidebar keyboard navigation.** Focused page buttons use non-wrapping Up/Down navigation. Focus survives page rendering, including Search's autofocus. Forward Tab targets the current page's Search, preserving its value/caret, or its first main control. Shift+Tab retains browser order.
4. **Settings and Overview.** The visible File Information label becomes Settings with the existing Lucide cog; its internal route key remains unchanged. The original Project Details editor is extracted and opened from the top Settings card. File operations and the full-width, hidden-by-default audit view retain their behavior. Overview uses `Project Progress (manual)`, a shorter bar and compact numeric input with an internal percentage suffix. Valid whole percentages save immediately; intermediate invalid drafts cannot write invalid values. KPI, progress and Quick Actions cards share one height rule, including the narrow-screen adjustment.
5. **Milestone alignment.** Every dependency control reserves the same external warning gutter. Warning icon/count stay outside the control, and the Actions heading and buttons move together through the table's column allocation. Warning popovers, scope controls and density remain intact.
6. **Tube Map frame.** Only the page-level left/right border colors become transparent. Retaining their 1px footprint preserves exact chart geometry; internal stream/week grid borders, plotting surfaces and chart behavior remain unchanged.

No schema, persistence format, dependency or scheduling changes are included. Existing tests were updated for the approved Settings entry point and sidebar transition completion; their coverage is retained.

## Visual evidence

Captured at 1440 × 1000 with the same rich fixture and fixed date:

| Page | Before | After |
| --- | --- | --- |
| Overview | [Before](media/consolidated-ui/before-overview.png) | [After](media/consolidated-ui/after-overview.png) |
| Milestones | [Before](media/consolidated-ui/before-milestones.png) | [After](media/consolidated-ui/after-milestones.png) |
| Tube Map | [Before](media/consolidated-ui/before-tube-map.png) | [After](media/consolidated-ui/after-tube-map.png) |

[Settings after](media/consolidated-ui/after-settings.png) shows the relocated editor entry and retained file/audit sections. Machine-readable measurements accompany these images. The baseline has unequal summary heights; the final implementation tests equal heights at 375, 900 and 1440px. Milestone alignment and Tube Map boundaries are checked at 1024, 1440 and 1920px.

## Validation

`npm run validate:pr` was run. Its unit suite passed **559 tests in 67 files** (33.97s), TypeScript passed (4.39s), lint passed (12.69s), and production build passed (24.50s). After the final test/CSS corrections, `npm run build` (including TypeScript and token checking) and `npm run lint` passed again.

The lifecycle initially stopped on obsolete native-title assertions. The full layout run completed **211 passing / 9 failing cases** (11.6 minutes). Failures identified two timing-sensitive new tests, collapsed-label geometry, tooltip transient attributes, the approved sidebar focus priority, and the inherited PR #30 date window. The source/test corrections retained the relevant coverage. All nine affected cases then passed together via `npm run test:targeted -- layout … --grep …` (**78.32s**), including the complete Atlas journey. Thus all **220 layout cases** passed across the full run and focused rechecks; this was not a second complete layout run.

The complete lifecycle was rerun with `E2E_BASE_URL=http://127.0.0.1:3000 CHROME_PATH=/usr/bin/chromium npm run test:lifecycle -- --skip-atlas`: **245 passed, zero failed**, approximately 155s. Atlas runs in the layout suite and passed in the focused recheck, avoiding a duplicate Atlas run. Logs and timings remain under ignored `work/`. There are no unresolved test failures.

Focused unit coverage exercises actual action success and stable separator identity; browser coverage exercises deletion positions, cancellation, independent duplicate effects, offscreen copies, retained selection, cleanup, reduced motion, sidebar animation/focus, Settings editing/save compatibility, summary sizing, dependency gutters and internal chart borders.

Browser file workflows use deterministic Linux file-picker mocks. These checks do not constitute native physical-machine file-picker evidence.

## Local testing

```sh
git fetch origin
git switch --track origin/feature/consolidated-ui-ux-batch
npm ci
npm run dev
```

Open http://localhost:3000. If the branch already exists locally, switch to it and use `git pull --ff-only`. The review branch includes all fixes inherited from `test/latest-ui-fixes`, including PR #30.
