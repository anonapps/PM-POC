# UI standardization — Stage 1 proposal

**Status:** Proposed; not an approved replacement visual specification.  
**Date:** 27 October 2026 (Europe/Madrid).  
**Authority:** [PROJECT_REQUIREMENTS.md](PROJECT_REQUIREMENTS.md) remains authoritative.  
**Inputs:** [Current-state audit](UI_STANDARD_AUDIT.md) · [Migration plan](UI_STANDARD_MIGRATION_PLAN.md).

## 1. Goal and current authorization

Create a reusable UI foundation so that new pages choose documented pieces and variants instead of acquiring page-specific font, spacing and alignment fixes.

The owner authorized proceeding after a read-only audit and a recommendation to perform Stage 1 first. This delivery is documentation only: audit capture, proposed token ownership, component contracts, decision records and a sequenced migration plan. No runtime components, CSS, configuration, data, schema, dependency versions or fixtures change in this stage. Later stages are described for review, not treated as already authorized implementation.

The current repository provides the accepted visual/behavioral reference. Structural extraction should preserve that appearance first. Deliberate visual normalization is a separate, identifiable change following review of this proposal and the component catalogue.

## 2. Requirements that take precedence

- Preserve regular/creation/embedded control heights and the shared internal 20px text band / 8px inset. Initial context sizes are 36 / 34 / 30px; they are internal variants, not a new user density preference.
- Standalone and Extended Add Task use exactly the same approved full-height creation panel. An extraction must preserve its measured geometry, fonts, field distribution and whitespace, even when declarations disagree with computed styles.
- Retain 340px centered module Search, with the existing narrow-window second-row fallback. Preserve actions and sidebar labels/order/icons; the sidebar must not scroll.
- Preserve every Extended Tasks column and continuous desktop table alignment, viewport fitting and no horizontal overflow. Font normalization is not permission to drop columns, hide actions or substitute desktop cards.
- Keep compact Risk editors, native field/disclosure affordances, wrapping pills and multiline editing.
- Preserve shared 56px desktop timeline footers, navigation increments, legends, visible counts, Gantt Zoom and the complete bottom boundary. Narrow defensive layouts may wrap; do not clip controls to force 56px.
- Keep dotted grey dependencies, one pinned relationship, pointer/keyboard preview, endpoint-only colors, hide/reset controls and transient state semantics.
- Preserve canonical commands, human-text normalization, validation, sorting/filtering, history, draft dismissal, focus behavior, offline operation and PMP compatibility. No data migration or runtime service is part of UI standardization.

The historical [UI_DESIGN_SYSTEM.md](UI_DESIGN_SYSTEM.md) remains useful history, but its earlier 20px module heading / comfortable-only baseline does not override subsequent approved requirements.

## 3. Token architecture and ownership

Use one authoritative token namespace with three levels. The exact source-file/generation choice will be selected in catalogue preparation, using existing tooling and no new runtime dependency. CSS and chart TypeScript must consume the same source rather than duplicate literal palettes.

| Level | Responsibility | Candidate names |
| --- | --- | --- |
| Primitive | Raw scale values | `font.size.12`, `space.4`, `neutral.100`, `radius.6` |
| Semantic | Meaning without a page name | `text.primary`, `surface.context`, `border.control`, `action.primary`, `focus.ring`, `status.task.inProgress` |
| Component | A component part / variant | `field.regular.height`, `field.creation.height`, `field.embedded.height`, `popover.filter.padding`, `timelineFooter.height` |

The dotted names express a proposed naming model, not implemented CSS syntax. Existing CSS variable names initially become compatibility aliases; removing an alias requires zero remaining consumers plus successful scoped verification. Avoid a big-bang rename and avoid changing literal values while changing ownership.

Pages own composition, data and approved variant selection. Components own text metrics, padding, border/radius, states and focus presentation. Chart models own coordinates/calculations; shared chart assets own rendering. Presentation tokens must not enter domain/PMP data.

## 4. Current → proposed decision matrix

All entries below are recommendations for review. “Preserve first” is the safe initial migration choice, not adoption of every candidate value.

| ID / area | Current | Proposed first migration | Optional normalization / impact |
| --- | --- | --- | --- |
| D01 Typography | Two text token families and context inheritance | One role namespace with compatibility aliases, retaining current rendered values | Review control 12.8→13px, body 14/14.4→14px and caption 11.52→12px separately. Requires layout/overflow review; not automatic. |
| D02 Density | Regular 36, creation 34, embedded/Risk 30px | Name all three variants; preserve text band/inset | A future 36/30-only model changes approved creation geometry and needs explicit acceptance. Default recommendation: retain 34px creation in the first migration. |
| D03 Actions | Main 30px, filter 28px, creation 32px, general 36–38px | Named context/size variants reproducing accepted controls | Review consolidating secondary sizes through catalogue examples; keep timeline 30px actions and panel compatibility until accepted. |
| D04 Spacing | Shared 4px scale plus dense 2/6/10/14px rules | Separate layout spacing from calculated control padding; name necessary compatibility values | Candidate layout scale 2/4/8/12/16/24/32. Do not round derived 7px field padding or chart coordinates. |
| D05 Radius / borders / effects | Related controls use different values; modal rules affect drawers | Explicit field/action/card/dialog/drawer/pill contracts preserving computed values | Catalogue may compare fewer border/radius/shadow choices. Changes to the accepted creation panel remain separately reviewed. |
| D06 Colors | Core CSS tokens, TS chart palettes and literals | Central semantic maps with exact current colors and foreground/background pairs | Review aliases among close neutrals/blues, without merging unrelated status/severity/category meanings. |
| D07 Responsive behavior | Some fields/actions shrink to 9–10px; header fonts are locked | Record current breakpoint behavior as compatibility variants; preserve fit and columns | Prefer reflow/explicit density to shrinking fonts. Proposed alternatives must satisfy no-horizontal-overflow and field visibility before adoption. |
| D08 Component implementation | Native inputs, custom disclosures and HeroUI shell controls | Shared application facades over current implementations; reuse behavior kernels | Do not replace the component library or custom controls merely to unify appearance. No new dependency is proposed. |
| D09 Textarea / validation | Several initial heights/error-slot sizes | Explicit multiline sizing and error-slot variants; preserve resizing and existing behavior | Review inconsistent single-line-sized multiline boxes and reserved whitespace using populated/error catalogue states. |
| D10 Content / icons | Mixed casing, date presentations, SVG/Unicode/native assets | Inventory role-based date/copy/icon assets; preserve current labels and stored values | Standardize new copy/icons first. Renaming accepted labels or replacing native widgets needs its own review. |

## 5. Component catalogue contracts

Existing exports are reuse starting points, not a mandate to rename everything. Proposed public names identify responsibilities; implementation can keep compatible adapters while migration progresses.

| Family | Existing assets | Contract / intentional variants |
| --- | --- | --- |
| Text and Icon | Current typography tokens, inline SVG/Unicode/CSS shapes | Role-based font/weight/line-height; named icons with size/stroke/accessibility. Preserve module wordmarks and meaningful chart shapes. |
| Button / IconButton | Native actions; HeroUI shell Button | Filled, outline, destructive, quiet, icon; explicit size/context; label visibility, disabled and focus states. Sorting/disclosure actions retain their semantics. |
| FormField | Creation field helpers, ProjectFormFields, CreationField | Label, required indicator, hint, associated error, reserved error space, layout slot. Business validation remains in existing commands/helpers. |
| Field frame / Input / Date / Number / Textarea | Native elements; HumanTextInput/HumanTextArea | Internal text alignment and density; native date/number semantics; explicit multiline sizing. Capitalization stays a behavior adapter and must not affect search/technical values. |
| SingleSelect | PredictiveSelect / SearchableOwnerSelect / BaselineSelector | Trigger frame, current/unavailable value, filtering, radio choice, close/refocus. Owner and Baseline are domain-option adapters. |
| MultiSelect | RelationshipPicker; scope/predecessor renderers | Checkbox choice, selected count/pills, search and disabled/deleted options; preserve feature-specific validation and exclusivity. |
| Checkbox / Radio / ChoiceRow | Native inputs within current lists | Consistent visual and hit-area contract, clickable label, checked/disabled/focus state; retain native keyboard behavior. |
| PopoverSurface / Menu / FilterPanel | Positioning helper; PredictiveDisclosure; ModuleSearch | Shared visual surface and measured positioner; native top-layer and portal adapters remain supported. Actions, single selection and multi-selection keep distinct semantics. |
| Badge / ScopePill / Legend | Status Chip, severity/save spans, ScopePill, TimelineStatusLegend | Common shape/text metrics; separate status, severity, save and category color maps. Preserve task vs milestone meaning and scope name-based assignment. |
| Card / Panel / InlineEditor | Overview cards, Risk/Decision editors | Named surface and density variants; sections/actions may have different composition while reusing fields. Risk compact and accepted Decision behavior remain explicit during migration. |
| Dialog / Drawer | Dialog and EntityCreationPanel | Modal semantics, focus trap/restore, Escape/outside/dirty dismissal, header/content/footer ownership. Placement is explicit; standalone/Extended creation uses the same instance recipe. |
| DataTable and cells | FitTable, sort utilities, existing cell renderers | Column heading/selection/entity/date/status/action cells; editable vs read-only row recipes; stable column alignment, full-value access and wrapped pills. |
| PageToolbar / TimelineFooter | PageToolbar, ModuleSearch, TimelineNavigation | Title/search/actions placement; responsive wrapping; compact chart footer content and viewport boundary. |
| Tooltip / StatusMessage / EmptyState | Native title, anchored warnings, CSS tooltip, alerts, EmptyState | Full-value/help/error/empty semantics and accessible presentation. Native OS/browser affordances are documented exceptions, not claimed fully themeable. |
| Chart primitives | TodayMarker, DependencyConnectors/useDependencyFocus, baseline rendering | Shared styling/interaction with chart-specific coordinates and shapes. Keep status colors, single-relationship emphasis and safe pointer targets. |

## 6. Required states and examples

Each catalogue entry records: owner/source, parts, allowed variants, tokens, content constraints, controlled-value interface, state ownership, keyboard behavior, focus return, error semantics and verification owner.

Render applicable default, hover, focus-visible, active, selected/checked, disabled, invalid, empty/no-results, unavailable/deleted, loading and long-content states. State “not applicable” explicitly rather than invent loading/selection behavior for every asset.

Examples must include native selects and custom selectors, long labels/IDs, multiple pills, unavailable owners, multiline content, creation error slots, compact editors, sorting/selection cells, all status palettes, open overlays near viewport edges, and line preview/pin/hide/reset behavior. Include standalone and Extended Add Task side by side.

Use current desktop acceptance widths plus narrow defensive checks from the existing suites. Do not infer physical Mac/Windows file picker, calendar or font behavior from Linux Chromium screenshots.

## 7. Catalogue and governance proposal

The next stage should build a development-only/internal catalogue with disposable in-memory examples, no production navigation entry or project writes. It must be excluded from the distributed production surface; choose the simplest existing-tooling approach before implementation. No Storybook installation or new runtime package is required by this proposal.

Every approved asset gets a record containing its purpose, variants, tokens, states, screenshots and behavior checks. New pages compose approved assets. A genuinely new visual need becomes a reviewed variant with an owner and evidence; avoid a new `.module-name ... input` override. Keep only justified chart geometry, native rendering and layout composition outside component ownership.

CSS cleanup follows extraction: identify all consumers, move ownership with equivalent computed styles, run affected checks, then remove the superseded declaration. Do not remove declarations based solely on duplicate text or raw color counts. Keep a regression/rollback boundary for every migration wave.

## 8. Review outcome needed

Review the D01–D10 choices with catalogue preparation. The recommended first implementation direction is compatibility-preserving ownership and aliases, three existing context densities, and unchanged semantic palettes. Typography rounding, density reduction, border/radius normalization and copy changes remain candidates, not implicit approval.

After review, record accepted choices explicitly in the authoritative requirements, replacing only conflicts actually accepted by the owner. Then proceed to the catalogue, review its examples, and migrate in small waves using the linked plan. No merge, release or deployment authorization is created by this document.

## Implementation progress — 28 October 2026

The owner directed incremental implementation after this proposal. A separate internal catalogue and the first compatibility-preserving field/footer/status token source are now implemented; see [current migration evidence](UI_STANDARD_MIGRATION_PLAN.md) and [token maintenance](../src/ui/README.md). Candidate rounding/density/palette changes in D01–D10 remain proposals. The original Stage1 scope text above describes that documentation delivery, not the current implementation status.
