# Compact action icon review

Branch: `feature/global-icon-buttons`, based on v1.7.0 (`ed30f02`). This is a presentation change; commands, confirmation policy, navigation, permissions, file format and persistence are unchanged. No release, deployment or merge is authorised.

## Audit and adoption

The audit covered every module and shared TSX control. `ActionButton` is the native labelled-action facade; HeroUI is already bundled. There was no shared action tooltip or Lucide package. Lucide React is now bundled locally (no runtime network access); HeroUI Tooltip provides the existing library's accessible hover/focus, Escape dismissal, close-on-press, portal measurement and viewport flipping.

| Page / surface | Compact actions |
| --- | --- |
| Overview | Edit Project |
| Streams | Duplicate, Delete, Restore |
| People | Delete, Restore |
| Tasks, including Extended Gantt | Duplicate, Delete, Restore |
| Milestones | Duplicate, Delete, Restore |
| Risk Log | Context, Actions with count, Duplicate, Delete, Restore; individual action Delete |
| Decision Log | Context, Duplicate, Delete, Restore |
| Dependencies | Inspect / Edit; existing entity-specific accessible name retained |
| Warnings | Remove dependency/scope correction, with full existing correction label and confirmation |
| Search | Open details, Restore |
| Baselines management | Rename, Delete; existing baseline-specific accessible names retained |
| Critical Path Analysis | Quick Edit |
| Shared shell / dialogs | Undo, Redo, Close |
| Creation panel | Audited; Remove action retains its workflow label and accepted compact form footprint |
| Gantt, Tube Map, shared Search, sidebar | Existing specialised filter, hierarchy, milestone-diamond and sidebar-toggle geometry retained, with shared custom action tooltips |
| File Information | Audited; file workflow actions retain text. Receives shared shell and Close controls. |

| Action | Lucide icon |
| --- | --- |
| Context | MessageCircle |
| Actions | Zap |
| Duplicate | Copy |
| Delete | Trash2 |
| Inspect / Edit / Quick Edit / Rename / Edit Project | Pencil |
| Restore | RotateCcw |
| Open details | ExternalLink |
| Remove dependency / scope relationship | Unlink |
| Undo / Redo | Undo2 / Redo2 |
| Close | X |

Text intentionally remains on Save, Cancel, Create, Apply/Confirm where present, Add entity/action, creation Remove action, bulk Delete selected (with selection count), Save Now, Open/Close Project, Save As, audit data/export/order controls, retry/recovery choices, baseline action-menu choices, onboarding/navigation cards, warning content, Risk Matrix, Simple/Extended tabs, Expand/Collapse All and timeline Previous/Next/Jump to today. Sort headings, named entity links, predictive/disclosure selectors, scope indicators, critical-path chart toggles and specialised diagram affordances retain their meaningful content and layout. Sidebar navigation retains its established native names/titles and geometry.

## Shared contract

`ActionIconButton` forwards native button props and ref, including type, disabled, aria-expanded, click events and existing aria-label overrides. It introduces no command, propagation or confirmation policy. `ActionTooltip` can also annotate specialised existing controls without replacing their geometry or event handlers.

Standard visual buttons are 36 × 36 px with 18 px Lucide icons. Creation-panel Close reuses the existing 30 px action token to preserve the accepted header/form footprint, with the same 18 px icon and a 40 px pointer target. All other compact actions use 36 px surfaces, thin control borders and existing surface/primary/radius/focus tokens. A 2 px pointer extension supplies a nominal 40 × 40 target without enlarging table rows where feasible. Fixed-height read-only rows retain a 36 × 36 target to preserve their 40 px band and avoid scrollable button overflow. Adjacent compact controls keep their existing spacing. The existing muted-red `#a12b20` is promoted to a named danger token and reused; no new palette colour is introduced. The CSS owner loads last and explicitly outranks old per-page density selectors. No theme is added; existing light-theme token behaviour is preserved.

Tooltips open after 300 ms hover and on keyboard focus, display complete action labels (including Actions counts), flip at viewport boundaries, close on press/Escape/blur and use no native title. Badges retain zero and nonzero counts. Disabled controls remain native disabled buttons; a focusable inline wrapper permits their tooltip without enabling the action. Icons and badge duplication are aria-hidden; buttons retain explicit accessible names. Tooltip text does not capture pointer events or obstruct dialogs/popovers. Native workflow types and row event bubbling remain unchanged.

A real catalogue example includes normal, destructive, disabled and zero/nonzero badge states. The token generator, aliases and existing compatibility test include the promoted danger role. CDP selectors now use accessible names for converted controls; assertions and lifecycle coverage are retained.

## Visual evidence and limitations

[Before](media/icon-buttons/before/) and [after](media/icon-buttons/after/) contain Tasks, Risks, Decisions, Warnings and Dependencies at 1440 × 900 with the same deterministic legacy PMP fixture. Baseline images were captured before implementation; final images use the production build. Linux Chromium and mocked native file pickers do not establish physical Windows/macOS consent or assistive-technology acceptance.

The owner confirmed that the written specifications are sufficient and that the mockup is unavailable in the repository. The written mapping, compact outlined squares, token-based blue/muted-red accents and hover/keyboard tooltips are the visual reference. Owner visual review remains pending; no merge permission is inferred from automated success.

## Validation

The final checks pass for all affected scenarios; the broad run and scoped reruns below retain every original case and assertion. Detailed command logs remain in ignored `work/`. Initial checks caught stale development CSS, a confirmation test selecting a task without dependants, legacy CDP selectors relying on removed native titles, Dependencies rows growing to45px and an unbounded Close-button pointer extension in portalled dialogs. These were corrected without weakening existing assertions: production styles cover body portals, Dependencies retains its 40 px row, CDP uses accessible names and confirmation setup uses deterministic TASK-005. The three focused correction checks pass, including narrow Extended Gantt action-cell bounds. A sandboxed token test could not spawn its generator (`EPERM`); the complete unit stage subsequently passed with process permissions enabled.

| Page | Before | After |
| --- | --- | --- |
| Tasks | [Before](media/icon-buttons/before/tasks.png) | [After](media/icon-buttons/after/tasks.png) |
| Risks | [Before](media/icon-buttons/before/risks.png) | [After](media/icon-buttons/after/risks.png) |
| Decisions | [Before](media/icon-buttons/before/decisions.png) | [After](media/icon-buttons/after/decisions.png) |
| Warnings | [Before](media/icon-buttons/before/warnings.png) | [After](media/icon-buttons/after/warnings.png) |
| Dependencies | [Before](media/icon-buttons/before/dependencies.png) | [After](media/icon-buttons/after/dependencies.png) |


### Recorded results

| Command / scope | Result | Elapsed |
| --- | --- | --- |
| `CHROME_PATH=/usr/bin/chromium npm run validate:pr` unit stage | 61 files / 520 tests passed | 14.60 s |
| PR typecheck / lint stages | Passed; final build TypeScript and final lint also passed | 2.09 s / 5.54 s initial |
| Production build (including token freshness) | Passed, rebuilt after final scoped corrections | 13.04 s initial; final total not separately timed |
| `E2E_BASE_URL=http://127.0.0.1:3000 CHROME_PATH=/usr/bin/chromium node e2e/run-regression.mjs --full --skip-atlas` | 245 checkpoints passed, all 180 additional UI creations retained | 84.44 s |
| All Playwright specs, Atlas once | 158 cases collected; 154 passed, four layout failures identified | 262.74 s |
| `test:targeted -- layout creation-panels.spec.ts read-only-pages.spec.ts` (full paths under `e2e/layout/`) after row-target/creation-label correction | 31 passed, including every read-only-page case; two Risk fit cases still failed, leading to preservation of creation Close density | 57.70 s |
| Final `test:targeted -- layout` on action-icons, creation-panels and extended specs, selecting all full creation forms, all fit/narrow/expanded-action cases, all standalone/Extended creation equality cases and all four shared-icon scenarios | **32 passed**, including both previously failing Risk cases | **72.45 s** |

The original PR command stopped on legacy native-title selectors before the layout stage. After those selectors were corrected, its complete lifecycle and 158-case layout stages resumed against the production build. All four later layout failures have passing scoped verification on the corrected relevant code. The single `validate:pr` invocation itself did not finish green; passing unit/static/build evidence and unaffected browser cases were retained in accordance with TESTING_OPTIMISATION.md instead of repeating overlapping full suites. No cases were deleted, skipped or weakened. Atlas and all original viewport matrices remain covered. Final source lint and production build pass; documentation-only edits do not trigger another build/test run.

Logs: `work/validation-2026-11-02T23-40-27.120Z/` (unit/static/initial gate), `work/icon-lifecycle.log`, `work/icon-layout.log`, `work/validation-2026-11-02T23-54-15.341Z/` (read-only scope) and `work/validation-2026-11-02T23-56-18.943Z/` (final 32-case verification). These are intentionally ignored local logs, not committed runtime assets.

Remaining acceptance: owner visual review; physical OS/native-picker and assistive-technology acceptance remain manual. Draft PR only. No merge, tag, release or deployment performed.
