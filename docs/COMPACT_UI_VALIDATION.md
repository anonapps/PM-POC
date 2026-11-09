# Consolidated compact UI integration

## Base and scope

Branch: `integration/consolidated-compact-ui`.

Authoritative starting commit: `2b074aba3aa566b4682e413c52b55a55f81e64bd` on `feature/consolidated-ui-ux-batch`.
Imported change: `c901c7555de59cfb5690e06b532cef7232d05ceb` on `feature/compact-dialogs-baseline-manager`.
Review target: `feature/consolidated-ui-ux-batch`, not `main`.

The integration branch was created directly at the exact starting commit. A noncommitting cherry-pick exposed conflicts; the consolidated implementations were retained and only the approved presentation changes applied. Neither original branch was modified.

## Conflicts and shared components

- **Baselines:** retained `targetId`, navigation IDs/highlighting, Search reveal, session query/filter/sort, Lucide `Pencil`/`Trash2` actions, feedback and existing commands. Adapted only the manager row markup, footer grouping, compact editor class and comparison's separately rendered type label. Snapshot selection and date/variance calculations remain unchanged.
- **Decisions:** retained the entire consolidated component, including Search reveal/session state and `ActionIconButton` actions. Added only the `decision-title-cell` styling hook.
- **Requirements/architecture/plan:** retained all consolidated additions and appended the approved compact presentation scope.
- **Tooltips:** omitted the older commit's separate HeroUI baseline tooltips and handwritten icons. Baseline names/descriptions reuse the delegated `TitleTooltipProvider` with native title metadata, clipping-only policy, shared light-grey surface, focus descriptions and Escape dismissal. Full saved description text remains in the accessible label. Existing action tooltips remain shared.
- **Action sizing:** the shared `ActionIconButton` CSS uses the existing 30px page action height in workspaces/dialogs, retaining Lucide choices, 18px glyphs, count badges (including zero), colors, labels, feedback and commands. Floating global controls retain their existing size and behavior.
- **Tests:** retained the consolidated Settings entry point and floating toolbar helpers; adapted imported checks accordingly. Updated only the approved icon dimension expectations and added badge-overlap protection. No tests were deleted.

## Six approved changes

| Change | Integrated result |
| --- | --- |
| Compact dialogs/popups | Shared CSS uses existing action/embedded-field tokens, smaller padding/gaps and viewport-bounded scrolling; creation drawer footprint is retained. |
| Compact square actions | Existing shared Lucide controls use 30px squares in record/dialog contexts, retaining badges/tooltips and hit-area behavior. |
| Decision titles | Inputs fill the existing ID / Title cell with 12px right padding; column allocations and row heights are unchanged. |
| Baseline entity labels | ID, separator and saved name remain; only the separate kind label and redundant title suffix are removed. Saved words “task” and “milestone” are regression-tested. |
| Manage baselines | Fixed 64px rows with name/timestamp, single-line read-only descriptions, shared full-text hints, aligned edit/delete actions, sticky header, internal scrolling and footer actions; 680px maximum width / 520px maximum height. |
| Create/Rename baseline | 440px maximum width, compact required Name and optional Description; existing validation/save/cancel retained. |

## Preservation comparison against 2b074ab

Changes are restricted to the two affected page components, their/shared presentation CSS, focused tests and documentation. The entire shell/sidebar/floating toolbar, Tube Map, Gantt, Search, Warnings, shared tooltip/overflow implementations, action component logic and row-action feedback are unchanged from the authoritative commit. Existing Settings, Overview, milestone scope/alignment and navigation enhancements are retained.

No base files are deleted. Domain, application, runtime, persistence, file-format code, dependency manifests/lockfile and UI token source/generated values are unchanged. There is no `.pmp` migration or data modification. See `git diff 2b074ab` for the complete narrow integration diff.

## Validation

`CHROME_PATH=/usr/bin/chromium npm run validate:pr` ran against this integration:

| Stage | Result | Elapsed |
| --- | --- | --- |
| Unit | 67 files / 559 cases passed | 28.58s |
| TypeScript | Passed | 6.57s |
| Lint | Passed, zero warnings | 9.58s |
| Production build | Passed | 27.91s |
| Full lifecycle | 245 checkpoints passed, zero failures | 137.22s |
| Browser suite | 227 passed / 5 failed initially, all 232 executed | 542.81s |

The browser run identified one real spacing issue: a Risk Log badge overlapped its next action at narrow widths. The shared counted-button style now reserves 8px after the button without resizing/clipping the badge. Four Milestones Scope cases had obsolete 36px icon expectations; those expectations now require the approved 30px size, retaining every column/row/pill/persistence assertion. Screenshot review also caught a selector-specificity issue centering/clipping long manager names; the existing block/ellipsis recipe now wins, with a regression checking that the beginning of the name remains visible and the full name is available on focus.

After those corrections:

- `npm run build` passed again, including TypeScript and token checks (`work/integration-verified-build.log`).
- ESLint passed again on all three edited browser test files (`work/integration-final-test-lint.log`).
- `CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/action-icons.spec.ts e2e/layout/milestone-scope.spec.ts e2e/layout/compact-rhythm.spec.ts e2e/layout/v16.spec.ts --grep 'compact actions|tooltips appear|duplicate/delete/restore|Extended Gantt retains|Milestones Scope|record rows|compact baseline manager|Decision title'`: **12 passed**, 33.6s browser / 34.09s harness. This includes every failed case and all affected compact-action/row/name checks.
- All **232 unique browser cases** passed across the comprehensive run and affected rechecks. This is not a claim of a second complete green `validate:pr` execution. No tests/assertions were removed, and no test failures remain unresolved.

Complete logs/counts: ignored `work/validation-2026-11-09T21-52-07.703Z/` and `work/validation-2026-11-09T22-06-29.790Z/`. Preservation audit: `work/integration-preservation.json` verifies 22 protected paths remain identical to the base and no base files were deleted. Tracked screenshots regenerated by inherited tests were restored to their base bytes.

The full run covers consolidated row feedback, sidebar animation/keyboard focus, floating-toolbar interaction, Settings/Overview, milestone scope/alignment, Gantt compact bands/warnings, Tube Map today window/comparison controls, Search/Warn exact-record reveal and shared clipping-only tooltip behavior. New checks cover fixed baseline rows with empty/short/long descriptions, list scrolling/footer visibility, keyboard name/description hints, saved names containing task/milestone, required-name validation/cancel, Decision title width and compact Settings dialogs.

Manual screenshot inspection confirmed compact list/columns, proper name/description ellipses and persistent footer actions at [1024×600](media/compact-integration/manager-1024.png) and [1440×900](media/compact-integration/manager-1440.png). The consolidated sidebar/project status and reclaimed workspace remain visible. React review retained native semantic controls, stable keys, accessible descriptions, existing shared components and all commands/effects.

Initial dependency installation encountered an unavailable default npm cache path; installing with a workspace-local cache succeeded using the unchanged lockfile. No dependency versions were changed.

## Limits and lifecycle

Linux Chromium uses deterministic `.pmp` fixtures and mocked file pickers; this does not establish native Windows/macOS file-picker or physical-disk behavior. Manual owner visual acceptance remains separate. No merge, original-branch change, branch deletion, release or deployment is performed.
