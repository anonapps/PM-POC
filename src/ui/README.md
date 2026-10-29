# UI reuse and token guide

Use this guide when adding a field, action, selector, table, menu or page. [Project requirements](../../docs/PROJECT_REQUIREMENTS.md) define behavior and accepted appearance; the [component contracts](../../docs/UI_COMPONENT_CONTRACTS.md), [style ownership map](../../docs/UI_STYLE_OWNERSHIP.md), [reuse matrix](../../docs/UI_REUSE_MATRIX.md) and [catalogue](../../tools/ui-catalogue/README.md) identify the existing pieces. This is a compatibility standard, not permission to redesign working screens.

## Choose the existing piece first

1. Find the closest **real component** in the catalogue and its production consumer. Match the interaction and context, not merely the current color or pixel value.
2. Reuse its component and established variant. Keep local draft state, validation, domain commands and persistence at their existing boundaries.
3. Use the current semantic token/alias and style owner. Inspect the winning computed rule before adding CSS; earlier theme and layout rules still participate in the cascade.
4. Compare appearance and behavior in the affected contexts, including narrow layouts and errors. Retire an override only after every affected consumer is covered.

| Need | Use | Keep separate |
| --- | --- | --- |
| Ordinary primary/secondary/danger action | [ActionButton](../features/shared/action-button.tsx) | Sort headings, disclosure summaries, chart icons, KPI navigation cards, segmented controls and HeroUI controls retain their recipes. |
| Label, required marker and reserved error slot | [FormField / FieldMessage](../features/shared/form-field.tsx) | Conditional messages, inline alerts and table-selection cells need their own contracts; do not add reserved space where none existed. |
| Human-readable input/description | [HumanTextInput / HumanTextArea](../features/shared/human-text.tsx) | Search, technical identifiers, URLs, numbers and date values use their existing native inputs. |
| Native checkbox/radio with clickable label | [ChoiceRow](../features/shared/choice-row.tsx) | Table select-all/indeterminate/row selection and disclosure triggers remain distinct. |
| Searchable single choice / Owner | [PredictiveSelect](../features/shared/predictive-select.tsx), [SearchableOwnerSelect](../features/shared/searchable-owner-select.tsx) | Radio grouping, unavailable options and close/refocus policy belong to the adapter. |
| Multiple relationships | [RelationshipPicker](../features/shared/relationship-picker.tsx) | Scope exclusivity, deleted selections, parent inheritance and dependency-cycle guards stay with the consuming composition. |
| Page title, Search and filters | [PageToolbar](../features/shared/page-toolbar.tsx), [ModuleSearch](../features/shared/module-search.tsx), [FilterChoices](../features/shared/record-filters.tsx) | Independent Search centering and responsive toolbar conditions must remain intact. |
| Table and sortable headings | [FitTable](../features/shared/fit-table.tsx), [sorting](../features/shared/sorting.ts), [heading styles](../features/shared/table-headings.css) | Editable/read-only rows, selection refs, sort values and cell content remain module-owned. |
| Anchored options/menu | [PredictiveDisclosure](../features/shared/predictive-disclosure.tsx) and existing selector/menu adapter | Native top-layer disclosure and portal filters are different behavior adapters; do not replace one with a generic wrapper. |
| Modal or creation drawer | Shared Dialog in [shell](../features/shell/shell.tsx), [EntityCreationPanel](../features/shared/entity-creation-panel.tsx) | Record Create validation and New Project file-access gating remain distinct. |
| Timeline footer, legend and references | [TimelineNavigation](../features/shared/timeline-navigation.tsx), [status assets](../features/shared/timeline-status.tsx), [TodayMarker](../features/shared/today-marker.tsx), [DependencyConnectors](../features/shared/dependency-connectors.tsx) | Chart models retain dates, coordinates, visible entities and navigation increments. |

## Choose the context variant

Existing styles establish these variants. A facade does not choose a height, font or padding on its own.

| Context | Existing recipe / owner |
| --- | --- |
| Regular boxed field | 36px base height; [field surfaces](../features/shared/field-surfaces.css). |
| Creation base | 34px token remains available; it is not the current compact record-drawer height. |
| Accepted record creation drawer | Maximum 560px, two main columns, full-width descriptions, original Task field pairs; existing 30px embedded controls and unchanged fonts; [creation surfaces](../features/shared/creation-surfaces.css). Blank messages start at 12px and grow naturally. |
| Embedded controls and Risk context/actions | Existing 30px compact recipe; [Risk surfaces](../features/risks/risk-editor-surfaces.css). Decision keeps its own accepted context layout. |
| Dropdown search | Existing 34px editable search recipe; [search input styles](../features/shared/search-input.css), placeholder `Type to filter` and context-specific accessible label. |
| Single-line text band | 20px line height and 8px horizontal inset; vertical padding derives from outer height/borders. Multiline fields and wrapping scope pills remain exceptions. |
| Ordinary main action | Existing 30px height, 6px radius, 12.8px text and weight 600; context rules retain accepted secondary variants. |
| Timeline footer | Shared 56px desktop minimum, 30px actions, chart-specific legends and navigation; defensive narrow layouts may grow. |

Do not introduce a new font size, global density option, page-specific field geometry or palette consolidation to make a new consumer fit. Reflow and reuse the appropriate accepted composition. For creation, initial desktop forms and Create/Cancel must fit; narrow screens or genuinely expanded lists may scroll inside the field body, with header/footer visible. Standalone and Extended Task creation must remain identical.

## Native composition examples

Imports below are relative to a feature module one directory below `src/features`. Names and handlers are supplied by that consumer. The examples do not create a new shared form or move domain commands into presentation components.

```tsx
import { ActionButton } from '../shared/action-button';

<div className="actions">
  <ActionButton type="submit">Save</ActionButton>
  <ActionButton type="button" variant="secondary" onClick={cancel}>Cancel</ActionButton>
  <ActionButton type="button" variant="danger" onClick={confirmDelete}>Delete</ActionButton>
</div>
```

`ActionButton` forwards native props/ref and composes the existing primary/secondary/danger class. Set `type="button"` for new non-submit actions. Existing omitted types must not be silently changed during compatibility migration: the facade intentionally retains native default-submit semantics. It adds no state, wrapper DOM, size rule or disabled policy.

```tsx
import { ChoiceRow } from '../shared/choice-row';

<ChoiceRow
  labelProps={{ className: 'toggle' }}
  input={{
    type: 'checkbox',
    checked: hideDependencies,
    onChange: event => setHideDependencies(event.target.checked),
  }}
>{' '}Hide dependencies</ChoiceRow>
```

`ChoiceRow` renders the same native label/input composition. Preserve visible whitespace, label titles/classes, IDs, radio `name`/value grouping, disabled rules and every existing callback side effect. On mapped collections, keep the React `key` on the row. In the real charts, dependency toggles also clear focus and synchronize the other dependency control; retain those chart handlers rather than copying this isolated boolean example.

```tsx
import { FormField } from '../shared/form-field';
import { HumanTextInput } from '../shared/human-text';

<FormField
  label="Task name"
  required
  className="creation-field"
  errorId="task-name-error"
  error={nameError}
>
  <HumanTextInput
    id="task-name"
    required
    value={name}
    onChange={event => setName(event.target.value)}
    aria-invalid={Boolean(nameError)}
    aria-describedby="task-name-error"
  />
</FormField>
```

`FormField` renders the established label, optional marker, supplied control and reserved `FieldMessage`. It does not infer the native `required` attribute, IDs, `aria-describedby`, invalid state or validation. Those are explicit consumer responsibilities. Preserve stable unique IDs when several forms can mount. The example class is for an actual creation field, not a universal field-layout class.

`FieldMessage` reserves an empty slot without an alert; real errors use `role="alert"` by default. Preserve `announceError={false}` / `announce={false}` where an existing message is intentionally not a live announcement. Human-text adapters normalize human content at the existing edit boundary; keep command-side normalization and technical/native input semantics unchanged.

Current adoption includes ordinary actions in Search, timeline footers/quick editors, record creation, People/Streams/Tasks/Milestones, Overview, Risk/Decision, Baselines, Dependencies and Warnings correction. Choice rows cover shared selectors/filters, record Show Deleted/context/scope/predecessor options, Dependencies filters, Search Include Deleted and Gantt/Tube Map toggles. Project forms and all six record creation panels use the field composition. These lists describe compatible adopters, not a requirement to convert every native button, label or message.

## Tables and overlays: preserve behavior boundaries

`FitTable` traverses direct React `thead` / `tr` / `th` children to add heading wrappers/full titles and derive responsive cell labels. Keep those direct elements visible to it; do not hide them behind a new heading component. Share the heading presentation and pure sorting helpers while leaving module-specific cell state and content explicit. Keep `aria-sort`, keyboard activation, natural/date/numeric ordering, missing values, full-value titles, selection alignment and indeterminate refs. Read-only and editable row density are intentional variants; never drop columns or actions to simulate fitting.

`SearchableOptionList` depends on the closest native `details` ancestor for query reset and dismissal. Predictive disclosures use native top-layer behavior, while ModuleSearch uses a body portal. Keep existing positioning/measurement, offscreen-anchor dismissal, Escape/outside handling and focus return. Share the existing adapter; similar-looking surfaces do not justify replacing selection, filter and action-menu semantics with one component. Use the shared Dialog for focus trapping, restoration and page-level overlay placement; keep dirty-dismiss policy in creation.

## Canonical tokens and cascade

[tokens.json](tokens.json) is the canonical source for the bounded compatibility inventory:

- Twelve core color roles, preserving design-system aliases.
- Both existing typography scales as separate rem-valued families.
- Eight spacing roles, three foundation radii and distinct action metrics.
- Regular/creation/embedded field heights, common line/inset and timeline footer minimum.
- Separate task and milestone status palettes.

The [inventory](../../docs/UI_TOKEN_INVENTORY.md) records intentional local/theme/native exceptions. An equal literal is not proof of an equal role: a 56px header is not the footer token; an action height is not a field role; primary blue is not a status color. Scope, severity, save state, baseline variance and dependency-focus colors retain their semantic owners.

To change a token within authorized scope:

1. Edit `tokens.json`; run `npm run ui:tokens`.
2. Commit the JSON and generated [ui-tokens.generated.css](../app/ui-tokens.generated.css).
3. Run `npm run ui:tokens:check`, the relevant checks and catalogue comparison.

Build checks freshness. The generator uses Node built-ins only and is not runtime code. Do not hand-edit generated output or redeclare canonical token names in pages. Existing aliases such as `--field-height`, `--field-text-line`, `--field-text-inset`, `--canvas` and `--primary` retain their established source positions. Typography app (`--ui-type-*`) and foundation (`--ui-text-*`) scales remain separate; `--type-page-title` still references caption. Public status-color TypeScript exports retain their keys/consumers.

The app and isolated catalogue load generated values before compatibility CSS. [viewport.css](../app/viewport.css) is the single ordered, unlayered entry: viewport layout → field surfaces → creation surfaces → planning controls → dropdown search → late panels → Risk surfaces → Baselines surfaces → shared table headings → timeline surfaces. Do not import these slices again in a route/overlay or rearrange them. Earlier foundation/theme/layout rules remain live; only proven superseded declarations may be removed.

## When a new exception is needed

Record the concrete consumer, purpose, state/keyboard contract, style owner and closest existing variant. Add a real disposable catalogue example and before/after computed-style evidence at the affected widths, including errors/long content/disabled states where supported. Record why existing variants cannot satisfy it and whether the result preserves appearance or changes a visible default.

A compatibility extraction may proceed within authorized scope after evidence proves unchanged behavior/rendering. A visible-default change—new font size, rounded typography, merged palettes, density reduction, normalized radii or redesigned creation footprint—needs a concrete comparison and owner acceptance. Do not present an unreviewed candidate as the standard. Native controls keep real browser/OS semantics; Linux evidence is not physical Mac/Windows acceptance or a complete accessibility audit.

## Verification and completion

Select the smallest affected suites from [TESTING_OPTIMISATION.md](../../docs/TESTING_OPTIMISATION.md). Examples:

```sh
npm run ui:tokens:check
npm run test:targeted -- unit src/features/warnings/warnings-panel.test.ts
CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/creation-panels.spec.ts
CHROME_PATH=/usr/bin/chromium npx playwright test --config tools/ui-catalogue/playwright.config.ts
```

`CHROME_PATH` is for this Linux workspace; use the appropriate installed Playwright browser locally. Run typecheck/lint/build for source changes, and serialize browser suites against a server/profile. Preserve passing unaffected evidence; documentation-only edits do not justify rerunning runtime suites. Token freshness is already included in build.

Before marking a PR ready, run `CHROME_PATH=/usr/bin/chromium npm run validate:pr`; release verification uses `validate:release` when a release is authorized. Keep all unit/browser/lifecycle coverage and existing viewport matrices. Record source state, command, counts, timing, failures, screenshot provenance and manual acceptance separately. A successful gate does not authorize merge, tag, release or deployment.

Completion means each adopted role has an owner, documented variant, real example and relevant evidence. It does not require turning every cell/message into a facade, replacing every literal or deleting every legacy selector. Preserve explicit exceptions until a consumer-backed change proves safe.
