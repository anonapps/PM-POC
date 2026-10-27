# UI standardization — current-state audit

**Status:** Captured evidence, not a new visual specification.  
**Audit date:** 27 October 2026 (Europe/Madrid).  
**Source baseline:** `854bc7835840ca7c58da057cc8ea9c0900928fe9`.  
**Related:** [Proposed standard](UI_STANDARD_PROPOSAL.md) · [Migration plan](UI_STANDARD_MIGRATION_PLAN.md).

## Scope and evidence limits

The preceding read-only audit inspected all 14 module pages at 900, 1440 and 1920 CSS-pixel viewport widths, Extended Gantt, and sampled creation panels, context editors, filters, selectors and menus. It used disposable in-memory file handles and made no application/project changes. Save remained disabled after inspection. Source files and the PR were unchanged during that audit.

Populated Baselines comparisons, uncommon failure states and unsupported native OS variations were source-reviewed where the fixture had no example. This is not physical Mac/Windows evidence or a complete accessibility certification. The numbers below distinguish measured appearance from declarations; responsive wrapping and content length can increase heights.

## Styling ownership today

Styles load in this order: [globals.css](../src/app/globals.css), [design-system.css](../src/app/design-system.css), [heroui-experiment.css](../src/app/heroui-experiment.css), [viewport.css](../src/app/viewport.css). The `heroui-experiment` body class is active; its historical filename does not mean its rules are inactive.

A static scan found 3,673 declarations, 135 distinct literal hex colors and 29 `!important` declarations in these four files. These totals include legitimate status palettes, alpha colors, responsive rules and overridden historical declarations; they are not counts of visible defects. Native controls and HeroUI styles add another source of appearance.

The principal reuse risk is ancestor-dependent styling: the same shared component can inherit different fonts, border colors or spacing inside a table, form, dialog or portal.

## Same, similar and deliberately different

| Family | Current reuse | Appearance / variation |
| --- | --- | --- |
| Font family | Same in sampled content | Arial, Helvetica, sans-serif. |
| Module headings | Same | 11.52px, 700, uppercase, `#2459a9`, `.12em` tracking. |
| Column headings | Shared typography | 12.8px/20px, 700, `#445268`, `#edf1f5`; cell padding varies. |
| Page toolbar | Shared `PageToolbar` | Nominal 56px; at 900px sampled wrapping produced 56/78/81.5/93px bands. |
| Main search | Shared `ModuleSearch` | Preferred width 340px, height 34px, 13px font, 5px radius. Narrow layout can place search on another row. |
| Actions | Similar | Main actions 30px/12.8px/600/6px radius; Clear all 28px; creation actions 32px; some other buttons 36–38px. |
| Single-line fields | Shared internal text metrics | Regular 36px; creation 34px; embedded/Risk compact 30px. Insets and line band are shared. |
| Textareas | Similar behavior, different initial sizes | Measured creation description 34px, Decision context 36px, Risk context 50px. Source defaults also include 64/70/80px. Native resizing can change these. |
| Single selection | `PredictiveSelect` reused by Owner/Baseline | Trigger appearance depends on ancestry. Searchable radio choices close after selection. |
| Multiple selection | Shared kernels, several feature renderers | Relationship, scope and predecessor selectors reuse disclosure/search behavior but differ in labels, triggers and selection summaries. |
| Filter popup | Shared | Preferred 400px width, maximum 480px height, 12px padding, 7px radius, 13px text. |
| Selection popup | Similar surface | Usually 260–400px width, 10px padding, 6px radius; typography can inherit table sizing. |
| Action menu | Distinct semantic variant | Baseline menu uses 6px padding and action buttons, rather than value-selection choices. |
| Checkbox / radio | Native inputs with contextual rules | Sampled table checkbox 13px, filter checkbox 15px, table selector radio 16px. Browser appearance is still relevant. |
| Pills / badges | Related shape, distinct meaning | Scope pills, severity, status and save state use separate plain-span/HeroUI implementations. Scope pill height is 24px. |
| Cards / sections | Several variants | Overview white cards, tinted inline editors, bordered lists and unboxed sections. |
| Dialog / creation drawer | Shared `Dialog` shell | Placement differs; inherited dialog/theme styles also affect drawer padding/radius. |
| Tables | Shared `FitTable` foundation | Headings and responsive labels shared; column widths, cells and row recipes remain page-owned. |
| Timeline references | Reused primitives | Common dependencies, Today marker, legend/footer; task bars, current milestone diamonds and historical indicators intentionally differ. |
| Timeline footers | Same | 56px desktop footer, 30px actions and matching complete bottom boundary. |
| Icons / tooltips | Mixed | SVG, Unicode, native browser affordances, CSS shapes, native titles and custom tooltips. |
| Validation / empty states | Partly shared | Shared helpers/components, but message spacing and reserved error areas vary. |

## Measured differences to resolve through explicit decisions

| Element / context | Current measurement | Interpretation |
| --- | --- | --- |
| Ordinary table field font at viewport 900 / 1440 / 1920 | 10 / 12 / 14px | Responsive rules change typography to fit columns. |
| Extended Tasks field font at the same widths | 10 / 12 / 12px | Separate compact rule path. |
| Extended table action at 900 / 1440 | 9 / 12.8px | Current small-window readability concern, not permission to remove columns. |
| Wide read-only body vs ordinary body | 14.4 vs 14px | Two body-token families. |
| Dropdown search inside table vs filter popup | 12 vs 12.8px | Same search-list component, different ancestor styles. |
| Filter option vs Owner option row | Approximately 24 vs 29px | Choice-row rhythm differs. |
| Risk context | 30px fields, `6px 8px` padding, 30px actions | Explicit approved compact treatment. |
| Decision context | 34px pickers, approximately 11px padding, 36px actions | Related editor with a different recipe. |
| Creation drawer | Computed 24px padding / 18px radius | Theme/modal rules win over a drawer declaration of 18px / square corners. Preserve the accepted panel while reviewing ownership. |
| Field / Owner / creation borders | `#b7c1ce` / `#dce2e9` / `#acb8c7` | Different emphasis for related controls. |
| Regular record row | Nominal 58px; sampled 59px | Borders and content affect actual row height; wrapping can grow it further. |

The shared text band is a useful established contract: 20px line height and 8px horizontal inset. Vertical padding is derived from control height and borders: `(36 - 20 - 2) / 2 = 7px`. Derived 7px padding is not an arbitrary spacing exception.

## Existing token families and semantic assets

| Role | First token family | Second token family |
| --- | --- | --- |
| Small text | `--text-xs`: 12px | `--type-caption`: 11.52px |
| Control | `--text-sm`: 13px | `--type-control`: 12.8px |
| Body | `--text-base`: 14px | `--type-body`: 14.4px |
| Section | `--text-section`: 16px | `--type-section`: 16px |
| Display | `--text-display`: 28px | `--type-display`: 32px |
| KPI | Sampled rendered value: 28px | `--type-kpi` declares 26.4px |

| Asset role | Existing values / behavior |
| --- | --- |
| Surfaces | Canvas `#f4f6f8`, content `#ffffff`, column background `#edf1f5`, context `#f7f9fc`. |
| Text | Main `#0f172a`, muted `#526174`, heading `#445268`, popup `#26364d`. |
| Brand / action / selection | `#164a91`, `#2459a9`, `#2563eb`; focus `#1b65c9`; active relationship `#155bc1`. |
| Borders | `#8293a8`, `#b7c1ce`, `#acb8c7`, `#dce2e9` appear in related roles. |
| Task statuses | Tentative `#9d8ab8`; Not Started `#a0adbd`; In Progress `#6b97c4`; On Hold `#c4a36c`; Completed `#7ca58a`; Cancelled `#bb8585`. |
| Milestone statuses | Tentative `#93c5fd`; Planned `#7c3aed`; Delayed `#fca5a5`; Complete `#16a34a`. |
| Risk severity | Low `#e5f3e9`; Medium `#fff1c7`; High `#fbe2df`. |
| Scope | Seven pastel foreground/background pairs; stable hash of scope name. Not a status palette. |
| Baseline / delay / Today | Historical grey comparisons, red delayed finish, signed green/gold variance; Today `#dc2626`, 2px dotted line. |
| Dependencies | Grey `#a7aeb8`, active `#155bc1`; dotted `1 5`; stroke 1.6px / 2.5px; pointer hit stroke 12px; arrows 7px. |
| Display state | Disabled opacity .45; unrelated chart entities .35 with greyscale; unrelated relationships .18. |

Shared shape does not imply shared meaning: status, severity, save state and category colors need separate semantic mappings. Entity status names and persisted values must not be renamed as a styling change.

## Content, behavior and remaining evidence

- Axis dates use DD/MM; footer ranges use DD/MM/YYYY. Some captions/messages use ISO dates. Native date entry remains browser/locale dependent.
- Human-readable edit wrappers normalize the first letter; search, technical identifiers and stored ISO dates have different responsibilities.
- Labels mix sentence/title case. Overflow information uses both native titles and custom panels.
- Shared popup positioning already accounts for content height, top/bottom placement, scrolling, viewport edges and dismissal. Filter portals and native top-layer disclosures use different rendering adapters.
- Dialogs already provide focus trapping/restoration. Predictive choices provide keyboard filtering and selection. Preserve these behavior kernels during visual extraction.
- Native calendar/checkbox/radio appearance and native tooltips cannot be treated as fully CSS-owned assets.
- Historical styles include ignored declarations such as `font-size: undefined` and superseded module rules. Their presence does not prove a current visible defect.

This audit is the baseline for decisions, not an instruction to round values, reduce densities, replace HeroUI or change accepted panel geometry. Later implementation must compare current screenshots and requirements before removing any apparently redundant rule.
