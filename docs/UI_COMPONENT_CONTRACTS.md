# UI component contracts — compatibility catalogue

**Status:** Stage 2 compatibility contracts; this document does not approve visual normalization.
**Date:** 27 October 2026 (Europe/Madrid).
**Authority:** [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md).
**Related:** [Current audit](UI_STANDARD_AUDIT.md) · [Standard proposal](UI_STANDARD_PROPOSAL.md) · [Migration plan](UI_STANDARD_MIGRATION_PLAN.md).

## 1. Purpose and ownership

These contracts describe the existing reusable pieces and the examples required to inspect them in a catalogue. Family names such as Button, FormField and PopoverSurface identify responsibilities; they do not imply that a new public component with that name already exists. Keep compatible exports and behavior adapters while ownership is consolidated.

Catalogue examples use disposable, in-memory data and local callbacks. They must not access a user project handle, write a PMP, create an Undo/audit entry in a user project, add production navigation, or change a production page merely to expose an example. A component may demonstrate its real behavior against isolated state; a visually similar mock is not proof that the production component satisfies the contract.

| Owner | Responsibility |
| --- | --- |
| Component | Parts, typography, alignment, geometry, border/radius, applicable states, accessible names and focus presentation. |
| Page/composition | Content, data adapters, grouping, approved variant choice and available layout space. |
| Existing command/domain layer | Validation, state transitions, relationships, history and persistence. |
| Chart model | Entity identity, visible-window population, dates, coordinates and relationship endpoints. |
| Catalogue | Reproducible examples, explanatory labels and isolated state, without changing domain behavior. |

Ancestor styling currently affects some controls. The catalogue must identify the actual context and computed values rather than asserting that all shared components already have identical styling. A later extraction proves equivalent appearance before retiring those ancestor rules.

## 2. Compatibility values to preserve

Values below are existing contracts or audited compatibility variants, not a new density preference.

| Role | Preserved reference |
| --- | --- |
| Family | Arial, Helvetica, sans-serif. |
| Module title | 11.52px, weight 700, uppercase, `.12em` tracking, `#2459a9`. |
| Column title | 12.8px/20px, weight 700, text `#445268`, background `#edf1f5`; 36px heading band. |
| Single-line internal band | 20px line height, 8px horizontal inset, weight 400. Vertical padding derives from outer height and borders. |
| Regular / creation / compact field | 36 / 34 / 30px. Preserve creation separately; do not silently reduce three variants to two. |
| Main action | 30px height, 12.8px text, weight 600, 6px radius, `2px 10px` padding. Existing secondary context sizes remain documented variants. |
| Module Search | 340px preferred width, 34px height, 13px text; existing centered placement and narrow second-row fallback. |
| Timeline footer | 56px desktop minimum, 30px actions, 18px legend row, `2px 8px` outer padding; complete bottom boundary without extra Tube Map padding/borders. |
| Scope capsule | 24px height and stable name-based palette assignment; allow wrapping selectors without clipping pills. |
| Focus | Existing 2px ring and normal/inset placement variants. Chart relationship emphasis supplies its own focus presentation. |

A declared value is not always the computed value. For example, the audit measured the accepted creation drawer at 24px padding and 18px radius because theme rules override its more specific-purpose declarations. Preserve the actual accepted standalone/Extended panel while reviewing ownership. Typeface rounding, border/radius simplification and changes to initial multiline heights remain separate review candidates.

## 3. Text, icon and action assets

### C01 — Text roles and content formatting

Sources: [typography and actions](../src/app/globals.css), [foundation tokens](../src/app/design-system.css), [compatibility/responsive rules](../src/app/viewport.css), [human text adapters](../src/features/shared/human-text.tsx), [normalization](../src/features/shared/text-normalisation.ts), [timeline dates](../src/features/shared/timeline-date.ts).

- Distinguish module title, section heading, column heading, body/control text, caption, KPI and technical/date presentation. Do not alias roles solely because two current values happen to match.
- HumanTextInput/HumanTextArea normalize human-readable text at the existing blur/command boundary. Search, numbers, stored ISO dates and technical identifiers retain their semantics.
- Keep existing labels, status names and required markers. Any copy/case normalization is an explicit later decision.
- Show short/long labels, accented text, technical IDs, ellipsis/full-title access, dates and multiline content. Record the existing responsive font path where it differs.

### C02 — Icons and action controls

Sources: [shell Button/Chip usage and inline icons](../src/features/shell/shell.tsx), [ModuleSearch filter icon](../src/features/shared/module-search.tsx), [Baselines action menu](../src/features/baselines/baselines.tsx), [timeline navigation](../src/features/shared/timeline-navigation.tsx).

- Catalogue filled, outline, destructive, quiet/link, icon-only and segmented/disclosure actions as distinct roles. Sort and navigation actions must retain their semantics and accessible names.
- Preserve current main actions at 30px. Filter Clear all (28px), creation actions (32px), general controls (36px minimum with content-dependent measured height), warning summaries and icon controls remain explicit compatibility examples. Record responsive/contextual typography exceptions from the audit; catalogue preparation does not silently normalize them.
- Icon-only controls require an accessible name independent of the glyph. Decorative SVG/shapes are hidden from assistive technology where appropriate.
- Record default, hover, focus-visible, active and disabled states. Add pressed/expanded only where the actual control supports those states.
- Native `<button>` disabled behavior and current focus rings remain functional. Do not simulate disabled controls by color alone.

## 4. Field and selection assets

### C03 — FormField and input frame

Sources: [CreationField](../src/features/shared/creation-field.tsx), [ProjectFormFields](../src/features/shared/project-form-fields.tsx), [record creation composition](../src/features/shared/entity-creation-panel.tsx), [human text adapters](../src/features/shared/human-text.tsx).

- The field recipe owns label, required marker, input/selector slot, hint/error association, reserved error area and density.
- Preserve real native text/date/number/select/textarea elements and existing onChange/onBlur/submit boundaries. A catalogue callback may update isolated state, never a real project.
- Compare identical values in regular table, creation, compact editor and popup contexts. Record height, font, line band, inset, border and radius; context differences are evidence rather than normalization permission.
- Multiline examples record their actual initial size and resize behavior. They must not be forced into a single-line field contract during catalogue preparation.
- Show empty/value/long-content, focus, supported disabled/unavailable and real invalid-message examples. Required/error associations must be inspectable without submitting an actual project form.
- Error slots retain existing 24px creation/project, compact/editor and table variants until individually reviewed. Do not add validation rules to unify appearances.

### C04 — SingleSelect and Owner/Baseline adapters

Sources: [PredictiveSelect](../src/features/shared/predictive-select.tsx), [SearchableOwnerSelect](../src/features/shared/searchable-owner-select.tsx), [BaselineSelector](../src/features/baselines/selection.tsx).

- Controlled value is an option ID; options provide names, optional human IDs and supported disabled states. Display adapters may supply scope-pill content.
- Trigger content remains accessible through its label/title. Preserve Unassigned, No baselines and unavailable-current-value representations; do not fabricate a replacement entity.
- Searchable single selection uses radio choices, closes after choosing a value and returns focus to the trigger. Same-value selection must not create an extra domain edit.
- Demonstrate normal and disabled triggers, deleted/disabled choices, no matches, long names and current-value rendering. Owner and Baseline remain domain-option adapters, not duplicate selector engines.

### C05 — MultiSelect and relationship/scope/predecessor adapters

Sources: [RelationshipPicker](../src/features/shared/relationship-picker.tsx), [Task scope/predecessor renderers](../src/features/tasks/tasks.tsx), [Milestone scope/predecessor renderers](../src/features/milestones/milestones.tsx), [ScopePill](../src/features/shared/scope-pill.tsx).

- Controlled state is a collection of IDs; retain uniqueness, selected count/pills and existing page-specific constraints. Project-wide exclusivity, parent-task scope inheritance and valid predecessor selection are domain/composition responsibilities.
- RelationshipPicker retains selected deleted items for visibility while excluding unrelated deleted options. Catalogue examples must label unavailable/deleted values accurately.
- Multiple choice uses native checkbox labels and keeps its existing open/selection behavior. Do not apply single-select close-on-choice behavior to it.
- Show none/one/many selected, wrapping pills, empty options, search/no matches, long content and existing invalid associations. If an adapter does not expose a disabled prop, record that limitation instead of pretending it supports one.

### C06 — ChoiceRow, checkbox and radio

Sources: [SearchableOptionList](../src/features/shared/searchable-option-list.tsx), [FilterChoices](../src/features/shared/record-filters.tsx), [PredictiveSelect](../src/features/shared/predictive-select.tsx), [RelationshipPicker](../src/features/shared/relationship-picker.tsx).

- Record visible glyph dimensions separately from the clickable label/hit area. Current sampled sizes are 13px table selection, 15px filter checkboxes and 16px table dropdown radio choices; 16px everywhere is only a review candidate.
- Preserve native checked, disabled, indeterminate and keyboard behavior where applicable. Indeterminate belongs to table selection, not to every checkbox example.
- Render wrapped and single-line labels, checked/unchecked, focus and supported disabled choices. Native appearance remains platform-dependent.

### C07 — SearchableOptionList behavior kernel

Source: [SearchableOptionList](../src/features/shared/searchable-option-list.tsx).

- Placeholder remains `Type to filter`; descriptive accessible labels retain their context.
- Filtering is case-insensitive through existing matching helpers. Empty-result messaging and search-result status remain exposed.
- Arrow keys move between available choices/search; Enter selects; Escape clears/dismisses as implemented. Technical typing must not leak to unrelated form shortcuts.
- Query reset depends on the closest native `details` ancestor. A portal or wrapper extraction must preserve that ancestry or provide a tested equivalent adapter before changing it.
- The same kernel currently inherits different typography in table and filter contexts. Examples must retain and identify both until styling ownership is separately migrated.

## 5. Overlay and layout assets

### C08 — PopoverSurface, disclosure, filter and menu

Sources: [PredictiveDisclosure](../src/features/shared/predictive-disclosure.tsx), [positioning helper](../src/features/shared/filter-panel-position.ts), [ModuleSearch](../src/features/shared/module-search.tsx), [FilterChoices](../src/features/shared/record-filters.tsx), [Baselines actions](../src/features/baselines/baselines.tsx).

- Share positioning behavior and eventual surface ownership while preserving different semantics: action menu, radio single selection, checkbox multiple selection and filter form are separate recipes.
- Current filter surface: preferred width 400px, padding 12px, radius 7px, 13px text. Selection surface: requested width 260–400px, padding 10px, radius 6px. Baselines action menu: padding 6px, action buttons, radius 6px.
- Positioning uses actual content height, an 8px viewport margin, 6px anchor gap, a 480px maximum height and above/below placement. Keep offscreen-anchor dismissal, resize/scroll updates and cleanup.
- Native manual top-layer popovers preserve disclosure ancestry; ModuleSearch uses a body portal. Keep both adapters and outside/Escape dismissal/focus restoration.
- Show short/long option sets, no matches, disabled choices, opening near every viewport edge and a scrolled/clipped container. A menu example must not execute destructive real-project actions.

### C09 — Dialog, Drawer and creation recipe

Sources: [Dialog](../src/features/shell/shell.tsx), [EntityCreationPanel](../src/features/shared/entity-creation-panel.tsx), [project form](../src/features/shared/project-form-fields.tsx).

- Dialog provides modal labeling, initial focus, Tab/Shift+Tab containment, Escape handling, outside dismissal and focus restoration. Dirty-draft policy belongs to the creation composition and must remain intact.
- Drawer placement is the existing creation variant, not a separate implementation copied into Extended Gantt. Standalone/Extended Add Task use exactly the same page-level panel, covering both panes/header with identical fields, font, spacing and location.
- Preserve scroll ownership: content scrolls; accessible header/footer remain available. Do not change accepted computed radius/padding because a base declaration appears simpler.
- Demonstrate clean dismiss, populated draft, dirty Stay/Discard confirmation, errors/first-invalid focus and long content against isolated state. Do not create user files or replace the native file picker.
- New Project file access remains gated by valid required values; record Create remains available to validate. A common footer must not erase this distinction.

### C10 — Card, Panel, InlineEditor and messages

Sources: [Overview](../src/features/overview/overview.tsx), [Risk context](../src/features/risks/risk-context-editor.tsx), [Risk actions composition](../src/features/risks/risks.tsx), [Decision context composition](../src/features/decisions/decisions.tsx), [EmptyState](../src/features/shell/shell.tsx).

- Preserve separate composition roles: white overview card, tinted inline editor, bounded list/section, empty-state message and alert. Common future surfaces do not imply the same spacing for every role.
- Risk context/actions retain the approved 30px compact rhythm; Decision context retains its current recipe during compatibility work. Display their differences explicitly.
- Messages record purpose, heading/body/action slots, accessible status/alert semantics and full-text access. Do not invent loading or retry behavior for a component that has none.

### C11 — DataTable and cells

Sources: [FitTable](../src/features/shared/fit-table.tsx), [sorting](../src/features/shared/sorting.ts), [Tasks](../src/features/tasks/tasks.tsx), [resources](../src/features/resources/resources.tsx), [Baselines](../src/features/baselines/baselines.tsx), [Dependencies](../src/features/dependencies/dependencies.tsx).

- Retain native table relationships, continuous desktop heading backgrounds, column alignment, all fields/actions, full-value titles and existing editable/read-only row recipes.
- Selection headers and row checkboxes share horizontal centers; preserve select-all/individual/indeterminate/bulk semantics. Entity-name cells preserve the ID band and shared control centerline.
- Column headings retain one font/weight/background at every width. Sorting retains click/keyboard activation, visible direction, aria-sort and actual natural/date/numeric/missing-value semantics.
- FitTable currently traverses direct `thead`/`tr`/`th` React children to apply wrappers/titles and derives responsive field labels. New component boundaries must preserve that traversal contract or replace it explicitly with equivalent coverage.
- Read-only rows and editable rows remain intentional variants. Pills may grow rows; long names must not delete columns or hide actions. Extended Tasks retains every column without horizontal scrolling at the existing desktop acceptance widths.

### C12 — PageToolbar and timeline footer

Sources: [PageToolbar](../src/features/shared/page-toolbar.tsx), [ModuleSearch](../src/features/shared/module-search.tsx), [TimelineNavigation](../src/features/shared/timeline-navigation.tsx), [viewport rules](../src/app/viewport.css).

- Module Search is independently centered against content at its standard width. Preserve title/actions and the current narrow second-row fallback; wrapped toolbar height is measured for sticky offsets.
- Footer height must not inherit a wrapped toolbar height. Both timelines share the compact 56px desktop minimum, matching typography/action geometry and the full visible bottom boundary. Narrow defensive layouts may wrap rather than clip controls.
- Keep all legend entries, visible date range, outside-window/connection counts and Gantt Zoom. Gantt retains one-column date offsets; Tube Map retains four-week offsets. Neither a shared footer nor a demonstration may change model increments.
- Footer ranges remain DD/MM/YYYY; date-formatted axis labels retain DD/MM and Tube Map's Week Number mode remains available. Native date editors and stored ISO values are separate responsibilities.

## 6. Semantic indicators and chart assets

### C13 — Badge, scope pill and legend

Sources: [Status](../src/features/shell/shell.tsx), [ScopePill](../src/features/shared/scope-pill.tsx), [timeline palettes/legend](../src/features/shared/timeline-status.tsx), [Risk severity](../src/features/risks/risks.tsx).

- Share shape/text ownership only through explicit variants. Keep task status, milestone status, risk severity, save state and scope category mappings separate; status must not be communicated through color alone.
- Preserve six task status colors, four milestone colors and matrix-matching Risk severity. Scope assignment remains a stable hash of the scope name across its seven foreground/background pairs.
- Task legend rectangles and milestone diamonds are meaningful shape variants. Preserve the single-line desktop legends and existing caption/full-title access.
- Render every semantic mapping, long label, supported unavailable/deleted state and the matching chart reference. A grey or selected catalogue sample must not rename persisted statuses.

### C14 — Today, baseline and dependency references

Sources: [TodayMarker](../src/features/shared/today-marker.tsx), [DependencyConnectors](../src/features/shared/dependency-connectors.tsx), [useDependencyFocus](../src/features/shared/use-dependency-focus.ts), [Gantt rendering](../src/features/gantt/gantt.tsx), [Tube Map rendering](../src/features/tube-map/tube-map.tsx), [Tube baseline strip](../src/features/baselines/tube-baseline.tsx).

- Preserve Today red/dotted placement, noticeable grey historical baselines and red delayed-finish segments. Current status colors and immutable snapshot comparisons remain separate from reference styling.
- Dependencies are dotted `1 5`, grey `#a7aeb8` at rest and blue `#155bc1` when active; line widths are 1.6/2.5px, arrowheads 7px and invisible pointer stroke 12px. Screen-space rendering preserves arrow proportions.
- Exactly one active relationship is displayed. Pointer/keyboard preview temporarily takes precedence over the one pinned key. Click or Enter/Space toggles/replaces the pin; Escape clears. Leaving a preview restores the pin when present.
- Active endpoints retain their status colors; unrelated entities use greyscale/opacity .35 and unrelated lines opacity .18. Disabled-control opacity .45 is a different semantic state.
- Hide dependencies synchronizes with the existing Dependencies checkbox and clears focus; Clear all restores display. Hover, pinning, filtering and catalogue interaction do not dirty the project or create history.
- Show forward/backward/crossing/same-lane curves, hover, pin replacement, keyboard, clear/hide/reset, all chart states and resize behavior. Chart models remain responsible for visible entities and finish/start coordinates.

## 7. Catalogue entry checklist

Every entry must record:

- [ ] Stable catalogue ID, purpose, actual source/export and known consumers.
- [ ] Current compatibility variant and whether the example is the real component or an explicitly labeled composition/mock.
- [ ] Parts, controlled values/callbacks and ownership of local vs project state.
- [ ] Computed typography, line/inset, height, padding, border/radius, palette and focus treatment in each supported context.
- [ ] Applicable default, hover, focus-visible, active, selected/checked, disabled, invalid, empty/no-results, unavailable/deleted, loading and long-content states; unsupported states marked not applicable.
- [ ] Keyboard commands, label/error association, focus restoration and pointer hit area.
- [ ] Content constraints: long names/IDs, accented text, dates, multiline text, wrapping pills and full-value access.
- [ ] Approved desktop widths plus relevant defensive narrow cases; no clipped actions, hidden required fields or new horizontal overflow.
- [ ] Native/browser limitations and any intentional visual exception.
- [ ] Evidence source, viewport/browser, screenshot provenance and relevant existing test coverage.
- [ ] No real file access, data mutation, Undo/audit entry, production navigation or new runtime dependency.
- [ ] Review status and the separate decision needed before any visible normalization.

## 8. Governance and native limitations

New consumers choose documented variants rather than a page-named selector that changes internal fonts, padding or control heights. A new need first receives a purpose, owner, behavior/state contract, catalogue example and review status. Existing exceptions remain explicit until accepted replacements prove both appearance and behavior. Remove old rules only after all consumers are mapped and affected checks pass.

Native date calendars, checkbox/radio painting, file pickers and browser title tooltips cannot be fully represented or themed by Linux Chromium screenshots. Preserve their real semantics and distinguish browser evidence from physical Mac/Windows acceptance. Screen captures alone do not establish focus behavior, contrast adequacy or accessibility conformance.

No new component library, runtime package, service, domain enum, persisted preference or PMP schema is required by these contracts. A catalogue demonstrates current reusable pieces; it does not approve typography rounding, two-density reduction, border/radius normalization, copy changes or a redesigned accepted creation panel.
