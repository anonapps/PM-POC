# UI token inventory — compatibility v1

Date: 28 October 2026. Authority: [project requirements](PROJECT_REQUIREMENTS.md). This inventory records existing values and ownership; it does not approve visual normalization. Full `validate:pr` passed for this wave: 489 unit cases, 245 lifecycle checkpoints and 131 production browser cases, plus typecheck, lint and build. All 19 isolated catalogue cases also passed. The [migration plan](UI_STANDARD_MIGRATION_PLAN.md) records logs and before/after evidence. Native physical-machine visual acceptance remains manual.

“Baseline” typography and radii below mean the existing foundation/design-system scale, not schedule snapshots or the Baselines page.

## Completed source boundary

[tokens.json](../src/ui/tokens.json) owns the finite families below. The [generator](../scripts/generate-ui-tokens.mjs) emits [ui-tokens.generated.css](../src/app/ui-tokens.generated.css); edit the JSON and regenerate rather than editing output. Existing aliases remain at their original cascade positions. The [application layout](../src/app/layout.tsx) and [isolated catalogue layout](../tools/ui-catalogue/app/layout.tsx) load generated values before compatibility CSS.

| Family | Canonical values | Existing aliases and consumer ownership |
| --- | --- | --- |
| Core colors | Canvas `#f4f6f8`; surface `#ffffff`; subtle surface `#edf1f5`; text `#0f172a`; muted text `#526174`; border `#dce2e9`; control border `#8293a8`; primary `#164a91`, hover `#123e7a`, active `#0e3263`; sidebar `#17243a`; focus `#1b65c9`. | `--ui-color-*` feeds the twelve existing aliases in [design-system.css](../src/app/design-system.css). Theme and component overrides continue to apply. |
| Application typography | Display `2rem`, KPI `1.65rem`, section `1rem`, body `.9rem`, control `.8rem`, caption `.72rem`. | `--ui-type-*` feeds `--type-*` in [globals.css](../src/app/globals.css). `--type-page-title` remains an alias of `--type-caption`. |
| Baseline typography | XS `.75rem`, small `.8125rem`, base `.875rem`, section `1rem`, page `1.25rem`, display `1.75rem`. | `--ui-text-*` feeds `--text-*` in [design-system.css](../src/app/design-system.css). This separate scale retains its original units and values. |
| Spacing scale | Keys `1,2,3,4,6,8,12,16` map to `4,8,12,16,24,32,48,64px`. | `--ui-space-*` feeds the existing `--space-*` design-system aliases. Matching local literals are not automatically consumers. |
| Baseline radii | Control `6px`, card `8px`, dialog `12px`. | `--ui-radius-*` feeds the corresponding `--radius-*` aliases in design-system.css. Applied theme radii may differ. |
| Action metrics | Height `30px`, radius `6px`, block/inline insets `2px/10px`, weight `600`, unitless line height `1.1`, font `var(--type-control)`. | `--ui-action-*` feeds the existing action aliases and the unified action declaration in [globals.css](../src/app/globals.css). [ActionButton](../src/features/shared/action-button.tsx) preserves native markup and contextual styling. |
| Editable fields | Regular `36px`, creation base `34px`, embedded/compact `30px`; the owner-corrected record drawer uses the compact variant. Internal text line `20px`, horizontal inset `8px`. | `--ui-field-*` feeds the field aliases and contexts in [field-surfaces.css](../src/features/shared/field-surfaces.css). Derived padding and multiline exceptions remain explicit. |
| Timeline footer | Minimum `56px`. | `--ui-timeline-footer-min-height` belongs to [timeline-surfaces.css](../src/features/shared/timeline-surfaces.css). Narrow wrapping can increase height. An unrelated header with the same number is a different role. |
| Task status palette | Tentative `#9d8ab8`; Not Started `#a0adbd`; In Progress `#6b97c4`; On Hold `#c4a36c`; Completed `#7ca58a`; Cancelled `#bb8585`. | Generated status variables and the unchanged public exports in [timeline-status.tsx](../src/features/shared/timeline-status.tsx) share the JSON source. |
| Milestone status palette | Tentative `#93c5fd`; Planned `#7c3aed`; Delayed `#fca5a5`; Complete `#16a34a`. | Separate milestone roles and exports remain in timeline-status.tsx. Identical status names across domains do not imply identical colors. |

## Intentional exceptions

| Context | Preserved distinction and owner |
| --- | --- |
| Theme surfaces | [heroui-experiment.css](../src/app/heroui-experiment.css) retains its navigation, header, card and dialog treatment, including card radius `16px` and dialog radius `18px`. Baseline radii are not a directive to replace these. |
| Density and multiline fields | Regular/creation/embedded heights remain separate. [Risk editor surfaces](../src/features/risks/risk-editor-surfaces.css) retain compact editor spacing; the same Risk stylesheet retains the multiline `50px` field override. Generic multiline fields retain their own minimum and content behavior. [Creation surfaces](../src/features/shared/creation-surfaces.css) retain the original560px footprint and compact structural space, reusing30px embedded controls without new font sizes or tokens. Creation messages use a12px minimum with natural expansion. |
| Headings and chart labels | [table-headings.css](../src/features/shared/table-headings.css) owns shared column typography and its `20px` label band. Row/heading geometry, module title tracking and fluid chart labels remain in their existing layout/theme rules; no font rounding or scale merging occurred. |
| Color meaning | Scope palettes in [scope-pill.tsx](../src/features/shared/scope-pill.tsx), severity treatments, navigation colors, baseline variance and dependency focus colors retain independent meanings. Core primary/focus colors are not replacements for those palettes. |
| Native controls | Browser/OS calendars, select menus, native title tooltips and platform focus details retain native behavior. Linux browser evidence does not establish physical Mac/Windows appearance. |
| Native action semantics | Sorting, disclosure, segmented controls, KPI/navigation cards and chart icons remain separate recipes. Ordinary action reuse does not add a default button type or change existing commands. |

## Deferred selector ownership

| Remaining area | Current source and rule for future work |
| --- | --- |
| Legacy foundation/theme overlap | [globals.css](../src/app/globals.css), [design-system.css](../src/app/design-system.css), [heroui-experiment.css](../src/app/heroui-experiment.css). Map the winning selector and consumer before moving or deleting a declaration. |
| Responsive page and chart layout | [viewport-layout.css](../src/app/viewport-layout.css) and [viewport-panels.css](../src/app/viewport-panels.css). Preserve media/container conditions, scrolling boundaries, chart anchoring and Extended Tasks behavior. |
| Field, search and planning recipes | [field-surfaces.css](../src/features/shared/field-surfaces.css), [search-input.css](../src/features/shared/search-input.css), [planning-controls.css](../src/features/shared/planning-controls.css). These own extracted slices of the cascade, not every earlier rule affecting those components. |
| Table body, messages and remaining compositions | Existing page/shared components and earlier layout rules retain ownership. Conditional error nodes, reserved error slots and table select-all/indeterminate cells are distinct contracts. |
| Overlay surfaces | Existing disclosure, portal and dialog adapters retain positioning, native top-layer behavior, dismissal and focus return. Shared appearance does not justify changing their behavior adapters. |

The [ordered compatibility entry](../src/app/viewport.css) is the single import path for extracted styles. Keep imports unlayered and in their recorded order. See [style ownership](UI_STYLE_OWNERSHIP.md), [component contracts](UI_COMPONENT_CONTRACTS.md) and the [catalogue](../tools/ui-catalogue/README.md) before adding a consumer.

## Stopping criterion and future changes

This v1 stops at canonicalizing the listed root families and established field/footer/status families. It does not claim every literal, selector or rendered asset is tokenized. No bulk replacement of matching numbers/colors, density reduction, palette merging or visual normalization is included.

Keep the inventory frozen when generation is fresh, aliases retain their original positions, computed values remain compatible and the required validation gate succeeds. Record other values as intentional exceptions or deferred owners. A later change starts with a concrete consumer and contract, then compares rendering and behavior before expanding the source or removing an override. Run `npm run ui:tokens:check` and the smallest relevant checks for that change; retain the full PR gate before readiness.


## Follow-up queue

The automatic compatibility queue for this inventory comprises source generation, unchanged aliases, catalogue coverage, before/after comparison, full PR validation, documentation and a reviewable PR update. Those activities run without per-task owner confirmation. Their final evidence is recorded in the migration plan.

Optional consumer work remains recorded rather than implied complete: conditional-message/table-body recipes, overlay appearance ownership and consumer-proven retirement of legacy selectors. Each can reuse the established contracts when a concrete consumer needs work; none changes this inventory's root-token boundary.

Decisions that change visible defaults—merging typography scales, font rounding, density reduction, changing theme radii, palette consolidation or whitespace normalization—require a concrete side-by-side proposal and owner acceptance. They are not inferred from compatibility work. Native physical-machine acceptance remains manual; automated Linux checks do not establish real Windows/macOS control appearance. Validation never authorizes merge, release or deployment.

Warnings corrective actions and timeline quick-editor actions now reuse ActionButton; timeline checkbox rows reuse ChoiceRow. Navigation-content, sort/disclosure/segmented controls and table selection remain distinct. See the migration evidence for scoped validation.
