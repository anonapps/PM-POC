# UI standardization — migration and acceptance plan

**Status:** Stage 1 documentation complete; Stage 2 catalogue foundation implemented after owner direction to proceed. Production migration is not started.
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
