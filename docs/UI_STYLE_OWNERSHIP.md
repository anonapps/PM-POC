# UI style ownership

This is a maintenance map, not approval to change appearance. [Project requirements](PROJECT_REQUIREMENTS.md) remain authoritative; [architecture](ARCHITECTURE.md), [component contracts](UI_COMPONENT_CONTRACTS.md) and the [migration plan](UI_STANDARD_MIGRATION_PLAN.md) explain boundaries and verification.

## Where an edit belongs

| Concern | Current owner and reuse path | Boundary |
| --- | --- | --- |
| Migrated metrics and status palettes | [Token source](../src/ui/tokens.json), [maintenance instructions](../src/ui/README.md), [generator](../scripts/generate-ui-tokens.mjs), [generated CSS](../src/app/ui-tokens.generated.css) | Edit the source, regenerate and check freshness. Preserve compatibility aliases. Task and milestone palettes remain separate. |
| Typography, surface roles and general actions | [Design-system CSS](../src/app/design-system.css), [global CSS](../src/app/globals.css), [HeroUI adapter CSS](../src/app/heroui-experiment.css), final compatibility rules in [viewport layout CSS](../src/app/viewport-layout.css) | These roles are only partially tokenized. Inspect the winning computed rule before changing a declaration; an earlier declaration may be intentionally superseded. |
| Native action composition | [ActionButton](../src/features/shared/action-button.tsx) | Primary/secondary/danger preserve the native button, props/ref and default type. Context still owns dimensions. Sort buttons, disclosure summaries and HeroUI controls are separate recipes. |
| Labels, required markers and error slots | [FormField / FieldMessage](../src/features/shared/form-field.tsx), [project fields](../src/features/shared/project-form-fields.tsx), [record creation](../src/features/shared/entity-creation-panel.tsx) | Control IDs, describedby, invalid state, normalization and validation remain caller-owned. Error announcement opt-outs and reserved slots are intentional. |
| Human-readable text behavior | [HumanTextInput / HumanTextArea](../src/features/shared/human-text.tsx), [normalization](../src/features/shared/text-normalisation.ts) | Reuse human-text handling for human content; preserve technical identifiers, dates, URLs and command boundaries. |
| Field geometry | Token source plus aliases/selectors in viewport layout CSS | Existing regular/creation/embedded variants and text metrics remain unchanged. Multiline, scope-pill and native-date exceptions are not single-line fields to normalize. |
| Tables, heading cells and sort behavior | [FitTable](../src/features/shared/fit-table.tsx), [sorting](../src/features/shared/sorting.ts), viewport layout CSS | Preserve native table markup and direct heading traversal. Module renderers own column content, selection state and sort values; shared rules own the established heading presentation. |
| Page title/search composition | [PageToolbar](../src/features/shared/page-toolbar.tsx), [ModuleSearch](../src/features/shared/module-search.tsx), viewport layout CSS | Search centering is independent of action width. Modules supply filters/actions and control state; they do not create alternative search-panel geometry. |
| Checkbox/radio option rows | [ChoiceRow](../src/features/shared/choice-row.tsx), [FilterChoices](../src/features/shared/record-filters.tsx) | Native semantics and existing context styles remain. This is not the table select-all/indeterminate recipe. |
| Searchable selectors | [PredictiveSelect](../src/features/shared/predictive-select.tsx), [owner adapter](../src/features/shared/searchable-owner-select.tsx), [RelationshipPicker](../src/features/shared/relationship-picker.tsx), [SearchableOptionList](../src/features/shared/searchable-option-list.tsx) | Reuse the existing single/multiple selection behavior; keep option IDs, radio grouping, deleted choices, accessible labels and close/refocus policy with the adapter. |
| Anchored overlays and menus | [PredictiveDisclosure](../src/features/shared/predictive-disclosure.tsx), [positioning](../src/features/shared/filter-panel-position.ts), [ModuleSearch](../src/features/shared/module-search.tsx) | Preserve measured placement, top-layer/portal behavior and keyboard dismissal. Menus, filters and option lists retain their distinct accepted surface recipes. |
| Modal/drawer placement | [Dialog](../src/features/shell/shell.tsx), record creation composition, existing global/design-system/viewport layout rules | Reuse focus trap/restore and dirty-dismiss policy. Do not add wrappers or compact-container rules that constrain the page-level creation panel. |
| Scope/category indicators | [ScopePill](../src/features/shared/scope-pill.tsx), existing CSS | Stable name-based colors remain distinct from task/milestone status, Risk severity, save state and choice state. |
| Chart references and footer surface | [Timeline surface CSS](../src/features/shared/timeline-surfaces.css), [TimelineNavigation](../src/features/shared/timeline-navigation.tsx), [legends/palette exports](../src/features/shared/timeline-status.tsx), [TodayMarker](../src/features/shared/today-marker.tsx), [DependencyConnectors](../src/features/shared/dependency-connectors.tsx), [focus state](../src/features/shared/use-dependency-focus.ts) | Shared rendering owns relationship emphasis and footer rhythm. Gantt/Tube Map models still own dates, coordinates, visible windows and navigation increments. |

## Cascade ownership landing in this wave

[viewport.css](../src/app/viewport.css) becomes an ordered import entry: viewport layout CSS first, timeline surface CSS second. The layout file retains the original prefix. The timeline file receives the suffix beginning with the “Shared relationship treatment” comment, including the compact footer and later dotted/focus overrides. Selector order, specificity and media/container conditions stay intact. Only the earlier line stroke/color declarations proven to be unconditionally superseded by the later identical selector were removed; the earlier global footer-gap rule was likewise superseded by the final footer rule. Before/after computed values verify that the winning declarations are unchanged.

This is a first ownership boundary, not a complete CSS cleanup. Earlier chart rules remain in global CSS and the layout prefix; the later timeline rules still override them. Do not delete earlier selectors or move rules across the import boundary merely because their names appear related. The production and isolated catalogue must both continue loading generated tokens before the existing compatibility styles.

## How to add a consumer

1. Find the closest real example in the [internal catalogue](../tools/ui-catalogue/README.md) and the contract above. Reuse the component and its existing context variant rather than copying markup or adding a page-specific field rule.
2. Put state, validation, domain commands and file access at their established boundaries. A native facade adds no state, wrapper, default type, size or new CSS role.
3. Identify the rule currently winning for each affected part. Compare computed appearance and behavior before and after, including long labels, error/deleted/disabled states and narrower layouts.
4. Add a token only when its semantic owner is clear and the change is authorized. Matching literals do not prove duplicate roles: a header minimum is not a timeline footer, a blue focus ring is not a milestone, and a compact action is not an embedded field.
5. Keep evidence scoped to affected consumers. Run freshness/type/unit checks as applicable; serialize browser verification and retain creation parity, keyboard behavior and persistence boundaries.

## Remaining migration checklist

- [ ] Map remaining typography, spacing, border, radius and surface roles before expanding the token source. Font rounding, density reduction and palette consolidation remain unapproved candidates.
- [ ] Expand native ActionButton adoption incrementally; retain sort/disclosure/icon/segmented roles and native default-submit behavior where already present.
- [ ] Map remaining inline label/error and native option-row compositions. Preserve validation announcements and table-specific selection semantics rather than replacing them mechanically.
- [ ] Establish explicit table-cell/heading ownership without hiding direct headings behind component boundaries that FitTable cannot traverse.
- [ ] Move additional field, search, overlay and table selectors only with consumer coverage and equivalent computed-style evidence; remove stale overrides after that proof, not during a file split.
- [ ] Separate remaining legacy chart rules from page layout when their cascade relationships have been mapped. Keep all chart models and command behavior unchanged.
- [ ] Maintain catalogue coverage for every adopted variant and real production consumer. Native browser/OS widgets still require accurate platform evidence.

## Required exceptions

The approved unified creation/layout correction keeps real validation, stable errors and native keyboard behavior. The Extended Mode clarification and Create Task alignment correction require the same page-level creation panel for standalone/Extended Tasks; compact module styles must not alter it. The Extended Tasks table correction retains every column and prohibits horizontal scrolling at narrow desktop widths.

The shared editable-field correction preserves distinct existing control heights and common internal text metrics, including multiline/pill exceptions. The compact editors/shared headings correction retains compressed Risk editors and one column-heading presentation across widths. Baselines/Dependencies corrections preserve their complete values, sorting and docked results/footer behavior.

The timeline footer/focus corrections retain the compact footer minimum with defensive narrow wrapping, complete bottom-region sizing, chart-specific legends/navigation, dotted grey relationships, one active relationship, endpoint focus and synchronized Hide dependencies controls. These requirements describe intentional differences as well as shared assets; this map creates no new approved values or normalization permission.
