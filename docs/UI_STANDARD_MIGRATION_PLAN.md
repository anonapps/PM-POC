# UI standardization — migration and acceptance plan

**Status:** Audit/catalogue, compatibility tokens, initial shared compositions and first style ownership boundaries are implemented. Broader adoption and legacy cleanup continue incrementally with existing values preserved.
**Inputs:** [Audit](UI_STANDARD_AUDIT.md) · [Proposal and D01–D10 decisions](UI_STANDARD_PROPOSAL.md) · [Authoritative requirements](PROJECT_REQUIREMENTS.md).

## 1. Delivery boundaries

| Stage | Deliverable | Completion / review boundary |
| --- | --- | --- |
| 1 — prepare | Captured audit, proposal, contracts, exception register and this plan | Documents reviewed; candidate values are not silently promoted to requirements. |
| 2 — catalogue | Internal/development-only reusable-asset examples and compatibility aliases | Review populated normal/compact/state examples before page migration. No production navigation or data writes. |
| 3 — migrate | Incremental shared-component adoption | Each family/page wave meets its scoped acceptance checks and retains a rollback boundary. |
| 4 — govern | Retired overrides, authoritative token ownership and reuse rules | All consumers accounted for; full regression gate and visual acceptance before the PR is ready. |

Stages 2–4 follow review of Stage 1. A request to simplify tokens does not itself approve changing the accepted creation panel, supported fields, domain statuses or persisted preferences. No merge, tag, release or deployment belongs to these stages without separate authorization.

## 2. Implementation waves and parallel tasks

| Wave / task IDs | Work | Dependencies | Parallel ownership |
| --- | --- | --- | --- |
| W0 / S01–S03 | Audit capture; token/exception proposal; component contracts/acceptance plan | Current approved implementation | Independent read-only reviews can run in parallel; one author consolidates the documents. Completed in Stage 1. |
| W1 / F01–F03 | Choose token source/export mechanism; introduce equivalent aliases; prepare catalogue harness and disposable fixtures | Reviewed D01–D10; current computed-style baseline | One integrator owns shared styles/token source. Another task can prepare catalogue examples/fixtures after interfaces are fixed. |
| W2 / P01–P03 | Action controls; field framing/composition; choice rows/selection/overlay surfaces | Stable aliases and component interfaces | Separate component-owned files: A actions, B fields, C selectors. Shared CSS changes go through the integrator. |
| W3 / C01–C03 | Inline editors/forms/dialogs; table-cell/toolbar recipes; badge/icon/legend maps | W2 contracts and examples accepted | A compositions, B table recipes, C semantic assets. Do not concurrently change the same creation/table/shared component. |
| W4 / M01–M04 | Adopt on resources; record logs; read-only pages; timelines | Required shared families accepted | Module ownership can be separate once APIs are stable. Migrate one representative consumer before all remaining consumers of a family. |
| W5 / R01–R03 | Remove obsolete declarations/aliases; reconcile catalogue/docs; final verification | Every consumer mapped and accepted | CSS cleanup and integration are serialized. Independent documentation/reference review may run alongside. |

Use the same reviewed branch/worktree with disjoint ownership, or isolated worktrees when changes genuinely conflict. Agree interfaces before parallel editing. One validation owner runs browser suites serially; do not rebuild `.next` during an active browser run or share a browser/debug profile between suites.

Two implementation risks need explicit coverage: `SearchableOptionList` uses `closest("details")` for query reset and keyboard/dismissal behavior, so changing portal ancestry requires an equivalent tested adapter. `FitTable` traverses direct `<thead>/<tr>/<th>` React children; introducing component boundaries around headers must preserve shared wrappers, full titles and responsive labels explicitly.

## 3. Representative adoption order

1. **Action and field primitives:** a People/Streams table, the existing creation drawer and one compact editor. Demonstrate consistent component-owned styling in different ancestry contexts without changing their approved densities.
2. **Selections and overlays:** Owner single-select, a multi-relationship selector, module filter popup and Baselines action menu. Share surfaces, not selection semantics.
3. **Editor and modal composition:** Risk context/actions, Decision context, project forms and record creation. Standalone and Extended Add Task migrate through the same shared panel, not two copies.
4. **Table and toolbar recipes:** selection/entity/date/status/action cells, read-only comparison rows, centered Search and header actions. Adopt gradually without replacing every table at once.
5. **Semantic indicators and charts:** badge adapters, status palettes, icons, Today/baseline/relationship references and footer. Preserve chart calculations and entity identity.
6. **Cleanup:** remove an override only after its consumers have moved and computed-style/behavior comparisons prove it unnecessary.

## 4. Exception register

| Exception | Reason / preserved behavior | Review condition |
| --- | --- | --- |
| Creation fields 34px | Approved regular/creation/embedded distinction | Density reduction needs explicit acceptance; keep until then. |
| Standalone/Extended Add Task parity | Exact same accepted panel, overlay and field distribution | Migrate once; verify both contexts. |
| Main actions 30px / footer 56px | Approved compact rhythm and chart area | Do not inherit wrapped toolbar height or enlarge footers through a global button rule. |
| Column headings | One font/weight/background across modules | Permit truncation with full labels/titles; no responsive heading-font shrink. |
| Native select/date/checkbox/radio/tooltip | Browser and OS semantics/appearance | Document platform limits; a custom replacement is a separate decision. |
| Selection top layer vs filter portal | Dismissal, focus, clipping and query-reset ancestry | Preserve adapters unless behavior is separately proven equivalent. |
| Scope pills / multiline fields | Wrapping, content and native resizing | Do not force all controls into a single-line fixed-height box. |
| Read-only vs editable rows | Different information/editing needs | Share cells/headings while keeping explicit row recipes. |
| Task/milestone/severity/category palettes | Different domain meanings and existing references | Semantic mappings, not domain renaming or snapshot changes. |
| Chart geometry / sidebar sizing | Coordinate calculations and all-items-visible navigation | Extract styling without changing calculations or hiding content. |

## 5. Acceptance matrix

| Contract | Required evidence before a consumer wave is complete |
| --- | --- |
| Visual ownership | Font, line band, inset, border, radius, height and applicable state values match the chosen variant in table, standalone, embedded, drawer, dialog and popup contexts. No ancestor silently changes a control. |
| Responsive layout | Preserve current desktop widths and existing defensive narrow matrix. Include 900/1280/1440/1920 where relevant; retain all columns/actions, no horizontal overflow, continuous desktop headers, aligned selection centers, full-value access and pill wrapping. |
| Actions and choices | Native/custom keyboard behavior, clickable labels, disabled choices, one/multiple selection semantics, unavailable/deleted values, no-results and long content. |
| Popup positioning | Below/above placement based on actual height; viewport bounds, clipping escape, scrolling/resizing and outside/Escape dismissal; focus restores to the correct trigger. |
| Forms and drafts | Required markers/associations, stable error space, first-invalid focus, clean/dirty dismissal, multiline Enter behavior and canonical Save/Cancel. |
| Creation distinction | Record Create remains enabled to validate; New Project file access remains gated by valid mandatory values. Do not collapse these intentionally different flows into one disabled-button policy. |
| Table behavior | Sort direction and aria-sort; natural/date/numeric ordering and missing-values handling; selection/indeterminate state; inline edit; duplicate/restore/delete confirmation. |
| Field behavior | Human text normalizes at the existing command/blur boundary; search/dates/numbers/technical text do not. No extra Undo/audit event for formatting. |
| Timelines | Reachable final row/lane; actual complete footer/bottom bounds; date increments/ranges, Zoom reset, status and baseline meanings, quick edits, one active/pinned dependency, endpoint-only colors, synchronized hide/reset. |
| Persistence | No unexpected dirty state from catalogue, hover, selection, filtering or density. Preserve PMP open/save/reopen, legacy compatibility, immutable baselines, Audit History and Undo/Redo. |
| Accessibility | Applicable Tab/Shift+Tab, Arrow keys, Enter/Space, Escape, focus trap/restore, labels, error associations and full-value access. Screenshots alone do not establish accessibility conformance. |

## 6. Verification ownership and cost

Stage 1 changes documentation only. Check Markdown references, authority/status consistency, decision/contract completeness and `git diff --check`; do not rerun successful runtime suites for these documents.

For later implementation, select the smallest affected suites from [TESTING_OPTIMISATION.md](TESTING_OPTIMISATION.md). Relevant existing layout specs include `compact-rhythm`, `creation-panels`, `extended`, `shared-surfaces`, `read-only-pages`, `timeline-toolbar`, `gantt-surface`, `search-filter` and `status-batch` under `e2e/layout/`.

| Change | Scoped checks |
| --- | --- |
| Token/field/action ownership | Computed styles in representative contexts; affected layout specs; typecheck/lint/build when source changes require them. |
| Choice/popup behavior | Existing option-matching/filter/position unit coverage and selector/filter keyboard/browser checks. |
| Form/editor migration | Creation and context suites; required/optional values, validation, history and saved bytes where behavior crosses commands. |
| Table/toolbar migration | Alignment, sorting, filters, selection, viewport and full-value checks in affected modules. |
| Timeline/reference migration | Models where calculations change; focused browser geometry, interaction, footer and navigation coverage. |
| Final ready PR | Full `npm run validate:pr`, including all unit/browser cases and mandatory lifecycle coverage. No test/viewport deletion to reduce effort. |

Use deterministic existing fixtures for layout; retain full UI creation where creation itself is under test. Record exact source state, commands/scope, counts, elapsed times, failures and screenshot provenance. Retain successful unaffected checks; repeat only after changes, failures or a concrete unresolved concern. Preserve physical Mac/Windows acceptance as a manual boundary.

## 7. Per-task completion checklist

- [ ] Requirement and decision IDs identified; no candidate presented as approved.
- [ ] Consumers and intentional variants mapped before editing.
- [ ] One owner for shared tokens/styles and each changed component.
- [ ] Before/after examples include relevant states, contexts and widths.
- [ ] Existing behavior, data contracts and sidebar/page composition preserved.
- [ ] Affected checks pass; evidence states its actual scope and limitations.
- [ ] Superseded CSS removed only after all its consumers have migrated.
- [ ] Catalogue contract, usage guidance and rollback boundary updated.
- [ ] No release/merge/deployment action inferred from migration completion.

## 8. Stage 1 documentation verification

On 27 October 2026, the three new documents passed a local-reference check (14 references) and decision completeness check (D01–D10). `git diff --check` passed. Independent token and component-contract reviews found no blocking requirement or scope conflicts; their ancestry/header-traversal cautions were incorporated above. Only Markdown documentation and documentation index links changed. No runtime tests were rerun for this documentation-only delivery, and no UI/catalogue/runtime implementation is claimed.

## 9. Stage 2 foundation — 27 October 2026

The owner directed proceeding and parallel work after the Stage1 delivery. Implementation follows the compatibility-preserving direction: no typography rounding, density reduction, palette merging or production page migration. Parallel source review and component-contract documentation accompanied one integration owner for the isolated harness.

The [internal catalogue](../tools/ui-catalogue/README.md) is a separate loopback-only Next app outside production routing. It imports existing assets and styles, uses local state/disposable memory commands, and prototypes compatibility aliases only within the catalogue. [Component contracts](UI_COMPONENT_CONTRACTS.md) map source ownership, intentional variants and reuse rules. The catalogue README lists implemented examples and remaining coverage explicitly. W1 is a foundation delivery; the production token export/alias migration and all W2–W5 consumer changes remain pending.

Stage2 scoped verification: five unique catalogue Playwright scenarios passed (four in the final broad run, 12.2s; the additional navigation case in a focused run, 2.1s), covering geometry at 900/1440/1920, selectors, relationships, modal/creation behavior and model navigation increments/zoom reset. Typecheck, lint and the root production build passed. The root app-path manifest contains only `/page`, `/_not-found/page` and `/_global-error/page`; no catalogue route is shipped. A 1440px visual inspection caught and corrected full-height workspace inheritance in a specimen; the final screenshot reported no page errors and a 34px Search field. Seventy-two local Markdown references and whitespace checks passed. Logs and the review screenshot are retained under ignored `work/ui-catalogue-*`. Application lifecycle suites were not rerun for this isolated harness; their earlier evidence remains scoped to the recorded application commit. The navigation test initially read state before the React update; it was corrected to wait for exact expected start/end attributes and passed without changing application behavior. The draft PR remains draft.

## 10. Stage 2 representative compositions — 28 October 2026

Owner direction: continue where possible and use parallel tasks. Two independent files now supply all six real record creation panels and representative Tasks/Risk Log/Decision Log/Baselines modules. One integrator owns catalogue layout, references, browser checks and documentation. Production source, styles, commands, data contracts and runtime dependencies remain unchanged.

The record examples retain actual workspace/module ancestry and expose real sorting, selection/indeterminate state, editing, deleted values, compact context/actions and Baselines management. Baselines fixtures cover matched/added/removed schedules and variance. Reset reconstructs deterministic records, identifier sequences and disposable history. The actual Risk Matrix disclosure retains its existing session preference on the separate catalogue origin; no user project is involved. Reference specimens add shared Status/EmptyState/TodayMarker, anchored warning disclosure and native-title help. Native tooltip/calendar appearance remains browser/OS controlled.

Scoped validation: ten unique catalogue browser cases passed across the integration run and focused follow-ups. Nine passed in the initial 22.1s run; its remaining viewport case exposed missing catalogue workspace/module ancestry. Restoring that real wrapper fixed table overflow without production CSS changes; the geometry follow-up passed at 900/1440/1920 in 4.1s. The five affected expanded-example cases then passed in 10.3s. Checks cover six successful record creations/reset with real validation, table sort/selection/edit reset, Risk/Decision contexts, Baselines manager/all nine sortable headers and reference disclosure. File picker APIs were trapped and no calls occurred. Typecheck and lint passed. Visual inspection at 1440px recorded no page errors or horizontal overflow; screenshots/logs are under ignored `work/ui-catalogue-expansion-*` and `work/ui-catalogue-expanded-*`.

The root production build passed; its route manifest has no catalogue entry. Nine local documentation references and whitespace checks passed.

This provides representative compositions for catalogue review, not exhaustive native-platform acceptance or a completed token/component migration. Full chart-page comparisons, final visual decisions and W2–W5 production extraction remain ahead. Compatibility-first extraction can preserve current values; typography rounding, density reduction and palette consolidation require separately recorded acceptance. No merge, release or deployment is authorized by this work.

## 11. First compatibility-token wave and full chart examples — 28 October 2026

Owner direction continued implementation where possible, with parallel tasks. Independent work supplied actual full Gantt/Tube Map catalogue examples and reviewed token/cascade boundaries; integration retained one source/style owner. The catalogue now includes real Gantt Simple/Extended, splitter, Task creation, baselines/dependencies/filters/quick edits, and Tube Map, all on disposable schedule data. Charts retain their real clock in manual use; browser checks freeze the clock for reproducible fixture visibility. Navigation requests stay local.

The first production reuse step introduces [canonical JSON tokens](../src/ui/tokens.json), [maintenance guidance](../src/ui/README.md), generated CSS and a dependency-free generator. Existing field aliases and palette exports consume the same approved 36/34/30px heights, 20px line/8px inset, 56px footer minimum and ten distinct status colors. Selectors, cascade positions, behavior, font sizes, multiline exceptions and unrelated matching literals stay unchanged. Build now rejects stale generated CSS. This resolves source ownership for this wave, without adopting optional D01–D10 visual normalization or claiming every legacy literal/component has migrated.

Validation: before/after computed-style captures match exactly at 900/1440/1920 for sampled field font/height/line/padding/border/radius, both specimen footers/buttons and all ten palette swatches (`work/ui-tokens-before.json`, `work/ui-tokens-after.json`). Ten targeted unit cases passed in 1.62s, including exact approved token values/domain keys, generated freshness/import order and existing status compatibility. All 11 catalogue browser cases passed in 21.1s. Eight affected production layout cases passed in 13.0s: shared internal field alignment, Risk compact editors, four Gantt viewport widths, baseline overlays and unfocused editable dropdown search. Typecheck, lint and the freshness-gated production build passed. Full-chart visual inspection recorded 56px for each footer, no page errors and no document overflow. Evidence is retained under ignored `work/ui-token-*`; no full lifecycle rerun is claimed for this scoped extraction.

Compatibility-first source ownership is implemented; broad action/field/choice component extraction and override cleanup remain future waves. Review any proposed value change separately. The PR stays draft and release actions remain excluded.

## 12. First action and form composition adopters — 28 October 2026

Owner direction continued incremental implementation with parallel tasks. Separate file ownership delivered the native ActionButton facade and shared FormField/FieldMessage composition. Integration adopted them in shared module Search, both timeline footers, project fields and all six record creation kinds. The catalogue Actions section now demonstrates the actual facade.

ActionButton maps primary/secondary/danger to existing classes, forwards native attributes/ref and deliberately adds no default type. FormField retains the native label, required marker, child control and reserved message; FieldMessage preserves IDs, classes, existing alert policy and blank slots. Native date/select behavior, text normalization, callbacks, validation, first-invalid focus and command boundaries remain with the original consumers. No wrapper DOM, CSS, sizes, labels, domain/data behavior, dependencies or persistence contracts change. Broader field/style ownership and legacy override cleanup remain later work.

Before/after captures of all six record creation panels in clean and invalid states match exactly for sampled geometry, font/padding/borders, error text/roles and invalid/describedby associations (`work/ui-composition-before.json` and `work/ui-composition-after.json`). Existing targeted unit checks passed 33 cases in 0.7s. All 11 catalogue cases passed in 21.1s. Seventeen affected production layout/interaction cases passed in 32.3s: six full creation panels at 1440, New Project valid-status/file gating, conditional scope/initial Risk action validation, standalone/Extended Task panel parity at 1024/1440/1920, search/filter at 1280/1440/1920 and equal footers at 900/1280/1440. Typecheck, lint and freshness-gated production build passed. Independent source review found no markup/ARIA/ref/native-submit compatibility blocker. Logs remain under ignored `work/ui-composition-*`; no new full lifecycle run is claimed for this scoped extraction. The PR stays draft.

## 13. Native choice composition and broader action adoption — 28 October 2026

Independent tasks delivered ChoiceRow and broader ActionButton adoption; integration owned the catalogue and verification. ChoiceRow retains exact native label/input markup for PredictiveSelect, RelationshipPicker and FilterChoices, while their existing state, radio groups, click/change handlers, disabled/ARIA behavior and close/refocus semantics remain unchanged. ActionButton now also serves 21 action templates across record creation, Risk context and Baselines menus/dialogs. Sort headings and native table selection remain their existing recipes. No production CSS, geometry, validation, domain command, dependency or project-file contract changes.

Sampled owner, relationship and filter option rows match before/after for text, dimensions, typography, spacing and native input type/size/checked/disabled/ARIA (`work/ui-choice-before.json`, `work/ui-choice-after.json`). Seventy-three targeted unit cases passed in 3.49s. Ten catalogue cases passed in the initial 22.4s run; the remaining full-chart case exposed a pre-existing server-date versus frozen-browser-date hydration mismatch after the calendar day changed. Catalogue-only measured previews now mount on the client using existing Next tooling; production chart rendering stays unchanged. The focused full-chart check passed, then passed with an explicit no-page-error assertion in 5.4s. Thus 11 unique catalogue cases are green; no failed case/assertion was removed. Twenty affected production browser cases passed in 40.0s, covering six creation panels, conditional Risk validation, shared Search, Risk context, Baselines management and status/filter/picker layers at supported widths. Typecheck/lint and the production build passed; catalogue-only hydration stabilization was then checked by typecheck/lint/focused browser verification. Independent review found no DOM ancestry, FitTable heading traversal, native-submit or focus-restoration blocker. Evidence is under ignored `work/ui-choice-*`.

This wave removes duplicated native option-row composition and extends existing action reuse. Component-owned style extraction and obsolete-rule removal remain future scoped work; no visual normalization or release action is inferred. Full lifecycle evidence retains its previously recorded scope, with no new full run claimed.

## 14. Timeline style ownership and proven redundant declarations — 28 October 2026

Parallel read-only cascade review and ownership documentation supported one integration owner. The [style ownership map](UI_STYLE_OWNERSHIP.md) now identifies current asset/style locations, reuse boundaries, required exceptions and remaining migration work. `viewport.css` is an ordered, unlayered import entry: the original layout prefix remains in `viewport-layout.css`, followed by component-owned `timeline-surfaces.css`. Both production and catalogue consume the same entry. Reconstructing prefix plus suffix yields the original viewport source exactly, apart from two deliberately removed superseded stroke declarations. The old global footer-gap declaration is also removed because the identical later selector unconditionally supplies the accepted gap. All other selectors, conditions, winning values and ordering remain unchanged; the final more-specific dotted-line rule is retained.

Before/after computed samples match exactly for twelve chart/state/width combinations: Gantt/Tube Map, default/active relationship and 900/1440/1920. Captures include footer/button/legend metrics, color, borders/shadows, connector strokes/dashes/fills, hit targets and muted entity appearance (`work/ui-style-before.json`, `work/ui-style-after.json`). Twenty-seven targeted unit cases passed in 5.36s; all 11 catalogue cases passed in 27.9s; eighteen affected production layout cases passed in 25.5s, including all-module viewport fitting, universal headings, Gantt pane/baseline/search behavior, both dependency displays and equal footers. Typecheck, lint and freshness-gated build passed. Emitted production CSS inlines both imports, preserves final dotted-rule order and omits the superseded stroke value. Independent source review found no import/relative-asset/cascade blocker. Logs/source reconstruction evidence remain under ignored `work/ui-style-*`.

This is the first component-owned style boundary and a deliberately limited cleanup, not completion of every legacy stylesheet migration. No approved typography/density/palette value, DOM, behavior, runtime dependency or PMP contract changes. Further style moves require mapped consumers and equivalent evidence. No full lifecycle rerun or release action is claimed; the PR remains draft.

## 15. Field/search style ownership and remaining log actions — 28 October 2026

Parallel work reviewed exact style boundaries/dead selectors and adopted ActionButton in 17 native action templates across Decision Log/Risk Log. Special matrix, sorting and toggle controls retain their existing recipes. Reversing the facade substitutions reconstructs the prior two source files exactly, establishing unchanged handlers, state, props and native submit behavior.

The ordered style entry now separates field surfaces, planning controls and the editable dropdown-search input from late viewport/panel overrides. Concatenating the five extracted pieces reconstructs the prior layout source exactly after removing 12 obsolete toolbar-only Zoom rules. Five equivalent dead Zoom rules in globals are also removed. The approved footer location is the only live consumer; general field/native-select and footer-specific Zoom rules remain. No selector retargeting, value changes, layers, DOM or persistence changes are introduced.

Three before/after capture pairs match exactly: all six clean/invalid record forms at 1440, owner/relationship/filter option rows, and twelve chart/state/width samples at 900/1440/1920 (`work/ui-field-style-*`, `work/ui-search-style-*`, `work/ui-planning-style-*`). Forty-one targeted unit cases passed in 5.32s. Eleven existing catalogue cases passed in the initial 59.4s run; a new native-action flow case initially used a label locator that did not match the textarea's exposed naming. Switching that test to its textbox role/name resolved the locator without a product change; it passed in 2.4s. All 12 unique catalogue cases are green, including context Ctrl+Enter, native Enter submission, action delete and Undo. Typecheck/lint and freshness-gated production build passed. Production CSS inlines the new ordered imports and omits obsolete toolbar Zoom selectors. Independent review found no cascade/data-URI/default-submit compatibility blocker.

Twenty-nine affected production cases passed in 49.6s, covering shared field text metrics, six creation panels, project file gating, conditional Risk validation, standalone/Extended panel parity, anchored pickers, shared Search, Risk/Baselines surfaces, four Gantt viewport sizes and footer matching. Evidence remains under ignored `work/ui-field-style-*`; dropdown/timeline comparison files are also in `work/ui-search-style-*` and `work/ui-planning-style-*`.

This wave advances style ownership and action adoption without approving font rounding, density reduction or palette normalization. Remaining global/context overrides require separate mapped-consumer evidence. Full lifecycle verification retains its earlier recorded scope; no new full run or release action is claimed.

## 16. Shared headings, Baselines overlays and Dependencies adoption — 28 October 2026

The resumed managed environment was checked before continuing. Parallel tasks reviewed cascade interactions and adopted native ActionButton/ChoiceRow in Dependencies inspection/editing and its two relationship filter labels. Sort headings, endpoint state, validation, disabled Save, native submit types and existing accessibility labels remain unchanged. The catalogue Records section now includes the actual Dependencies module on disposable fixture data.

Unchanged universal table/Gantt/Tube Map heading rules now live in `table-headings.css`; unchanged compact Baselines controls, popover and manager rules live in `baseline-surfaces.css`. Their reviewed imports follow late panel rules and precede timeline surfaces: remaining panel declarations affect disjoint body/width/position properties, retaining winning typography/background and overlay values. The obsolete early Dependencies flex/min-height rule and unmatched direct-table rule are removed. Five earlier footer declarations already overridden by the final footer rule are also removed; live `bottom:0` and `z-index:16` are explicitly retained. No approved visual value, DOM wrapper, domain command, runtime dependency or PMP contract changes.

Twenty-four before/after table/menu/context samples match exactly at 900/1440/1920, including full heading/body typography, Baselines menu/manager metrics, compact Risk multiline height and Dependencies footer bottom/stacking (`work/ui-table-style-before.json`, `work/ui-table-style-after.json`). Eighteen targeted unit cases passed in 3.87s. Twelve existing catalogue cases passed in the initial 59.4s run; the new Dependencies case initially searched the visible Inspect text rather than its ID-specific accessible name. With that locator corrected to the existing accessibility contract, the focused case passed in 2.4s, including filter-label clicks/reset, invalid self-reference Save gating, Cancel, valid Save and footer paint values. Thus 13 unique catalogue cases are green; no failing assertion was removed. Seventeen production cases passed in 21.6s, covering readable values/filters, complete Baselines sorting/management, universal heading parity including both charts/Extended, Dependencies footer/scroll boundaries and all-module viewport fitting. Typecheck, lint and freshness-gated production build passed; emitted CSS preserves reviewed panel/baseline/heading/timeline order. Independent review found no cascade or native-action compatibility blockers. Logs remain under ignored `work/ui-table-style-*`; no fresh full lifecycle run or release action is claimed.


## 17. Resource actions and context composition — 28 October 2026

Parallel implementation migrated seven ordinary People/Streams button sites to ActionButton and the Risk/Decision Project-wide rows to ChoiceRow. Risk context now uses the existing reserved FieldMessage. Reverse substitutions reproduce the original source exactly, retaining native types, callbacks, whitespace, classes, error roles and Stream deletion confirmation. Sort headings remain native; no CSS, approved metrics, domain commands or persistence contract changed.

The isolated catalogue adds real People and Streams modules using its existing disposable store. A new browser scenario checks both Add panels and native action classes at 900/1440/1920, Person Delete/Restore, Stream Duplicate and Reset. Three unique targeted catalogue cases passed (two context/action cases in the initial run; resource case in the final 3.0s run). The initial resource assertion incorrectly scoped a page-level dialog inside table content; its locator was corrected, with no product change. A lint-disallowed test variable name was also corrected. Thirty-seven command unit cases passed in 2.15s; eight production layout cases passed in 13.0s, covering Person/Stream creation at three widths, horizontal context editors and compressed Risk alignment. Typecheck, lint and production build passed. Logs are under ignored work/ui-resource-*. This scoped evidence does not replace the full validate:pr gate or native physical-machine acceptance; the PR remains draft.

## 18. Task/Milestone action reuse — 28 October 2026

Parallel work migrated five Task and four Milestone ordinary action sites to ActionButton. Reverse transformations exactly reproduce each original file, preserving native omitted/explicit button types, row and bulk callbacks, dependency/Decision confirmation, attributes and class values. Sorting, selection/indeterminate refs and scope/dependency disclosures remain native. No styles, visual defaults, command behavior or persistence contract changed.

The isolated catalogue adds the real Milestones module to its disposable record tabs. Two unique catalogue scenarios passed: existing Task selection/sorting/reset (3.0s) and the new Task/Milestone action journey (final run 4.7s), covering Add at 900/1440/1920, Duplicate, confirmed Delete, Restore and Reset. The new journey initially used an ancestor-scoped inner locator; correcting its relative small-element locator fixed the test without product changes. Eighteen targeted Task/Milestone command/dependency unit cases passed in 0.63s. Fourteen production checks passed in 29.8s: Task/Milestone creation at three widths, Task bulk deletion/Undo, standalone/Extended Add Task parity and the continuous Extended table at four widths. Typecheck, lint, build and diff checks passed. Evidence is under ignored work/ui-task-milestone-*. Full current validate:pr and native physical-machine acceptance remain pending before readiness; the PR remains draft.

## 19. Planning option-row reuse — 28 October 2026

Parallel source review identified six exact ChoiceRow compositions: Tasks Show Deleted and predecessor options; Milestones Show Deleted, Project-wide radio, stream scope options and predecessor options. Their adoption preserves mapped keys, label titles, visible whitespace, radio attribute omissions and native controlled props. Reverse substitution reproduces both original files exactly. Table selection and its indeterminate refs remain native; no CSS, density, domain command or persistence change is included. Independent review found no blockers. Overview's eight ordinary actions are mapped as a future candidate, with catalogue coverage required before adoption.

Two catalogue checks passed in 14.3s: existing Task selection/sorting/reset and the new three-width option journey. At 900/1440/1920 the journey verifies disabled circular dependencies and explanatory label title, Escape/refocus, Show Deleted, Project-wide/stream exclusivity, visible scope pills, and dependency check/uncheck/reset. The existing last-stream and deleted-Milestone guards remain exact in source but are not newly claimed as directly exercised. Eight production browser checks passed in 10.7s, covering anchored picker layers at three widths, Extended table selection/alignment at four widths, and Task creation/edit/duplicate/saved-byte behavior. Typecheck, lint, build and diff checks passed. Command/dependency implementations are unchanged; the prior wave's 18 unit cases remain scoped evidence, not a fresh rerun. Logs are under ignored work/ui-planning-choices-*. Full current validate:pr and native physical-machine acceptance remain pending; the PR stays draft.

## 20. Overview action reuse — 28 October 2026

Parallel implementation/review migrated eight ordinary Overview actions (Warnings, Edit Project, four quick actions, Project Details Cancel/Done) to ActionButton. Exact reverse substitution reproduces the previous source; native omitted/explicit types, commands, callbacks and classes remain unchanged. Six KPI navigation cards and timeline sort headings remain native. No styles, visual defaults or domain/persistence behavior changed.

The real Overview is available in the isolated record catalogue. A module-level wrapper records navigation requests in a status output without application runtime routes. The disposable fixture merges Getting Started completion into existing metadata before store creation, preventing Overview's readiness effect from adding an incidental command. Reset replaces store/drafts and navigation state. One catalogue journey passed in 11.9s, covering all four quick destinations, Warnings, and at 900/1440/1920 Cancel/discard, required-name validation, Done/commit/reopen and Reset. Sixteen Overview project/timeline unit cases passed in 0.68s. Three production browser cases passed in 10.0s, retaining Overview card sizing and Project Details geometry/Cancel at 1024/1440/1920 alongside their existing picker checks. Typecheck, lint, build and diff checks passed. Independent review found no blockers. Logs are under ignored work/ui-overview-*. Full current validate:pr and native physical-machine acceptance remain pending before readiness; the PR remains draft.
