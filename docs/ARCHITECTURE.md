# ARGOS PM — Architecture (v1.4.0)

## v1.5 architecture guidance (approved scope)

- Reuse the application command boundary for text edits: normalise the first character of human-readable fields on blur as part of the same logical edit, so Undo and audit history contain no separate formatting mutation. Preserve IDs, emails, URLs, file paths and technical identifiers.
- Use shared presentation primitives for outlined inputs, searchable dynamic-list selectors, Search/Filter toolbars and creation states. Search/filter state is transient and resets on navigation. Predictive selection state must be independent of the currently typed search query.
- Implement shared Today-marker rendering and visual tokens across Gantt and Tube Map, while each chart computes its own date-axis coordinates. Hide Empty Streams is independent per chart and exposed once in its shared filter panel (24 October manual acceptance correction).
- Persist optional last-save timezone metadata in the existing .pmp manifest without silently migrating compatible v1.4 files. Preserve UTC instant, original saving-device local display time, IANA timezone name where available and UTC offset. Update metadata only after successful file writes; display “Timezone unavailable” for legacy files until saved.
- Keep browser file-picker operations behind the Project File Service. Save/Discard/Cancel and navigation-draft warnings must not discard data without the user's chosen action.
- Continue using Vitest and the existing Chrome DevTools Protocol harness. The 24 October user instruction additionally requests Playwright layout assertions; its dev-only dependency does not affect the offline runtime. Maintain the established offline/local-only architecture.


**Status:** Implementation architecture supporting `docs/PROJECT_REQUIREMENTS.md`  
**Authority:** This document explains *how* to implement the approved requirements. If it conflicts with `PROJECT_REQUIREMENTS.md`, the requirements take precedence.

## v1.4 architectural additions

- All quick edits in Gantt and Tube Map dispatch canonical application commands; visual components do not own separate project data.
- Cross-module selection and navigation use stable entity IDs. Stream expansion, column sort direction and temporary quick-editor state are UI concerns.
- The project preference controlling progress visibility affects rendering only; existing progress values and calculations remain intact in the canonical project state and `.pmp` file.
- Person Role and Notes are optional persistent fields; compatibility with older `.pmp` files is required.
- Optional audit history is stored in the `.pmp` project state, independent of Undo/Redo stacks. Record committed changes, not individual keystrokes; retain the most recent 5,000 events, expose up to 50 in the viewer, and permit searching/exporting all retained events. Disabling tracking preserves recorded history. CSV output must escape spreadsheet formula injection.
- The local-first/offline and Project File Service boundaries remain unchanged.

## 1. Architectural Goals

The POC is a zero-install, local-first desktop-browser application. It must work offline, keep project data in one portable `.pmp` file, avoid cloud infrastructure, and preserve a migration path to a future installed desktop shell without coupling the domain model to that shell.

Primary architectural qualities:

- local-first and offline;
- portable self-contained project files;
- deterministic domain behaviour;
- explicit persistence boundaries;
- modular feature architecture;
- testable domain logic independent of UI and browser APIs;
- safe file handling and schema migration;
- incremental implementation suitable for Codex tasks.

## 2. Logical Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│ React / Next.js UI, modules, panels, Gantt, Tube Map       │
└───────────────────────────┬─────────────────────────────────┘
                            │ commands / queries
┌───────────────────────────▼─────────────────────────────────┐
│                    Application Layer                        │
│ App state, commands, undo/redo, navigation, derived views  │
└───────────────────────────┬─────────────────────────────────┘
                            │ domain operations
┌───────────────────────────▼─────────────────────────────────┐
│                       Domain Layer                          │
│ Project, Streams, People, Tasks, Milestones, Risks,        │
│ Decisions, relationships, validation, calculations         │
└───────────────────────────┬─────────────────────────────────┘
                            │ persistence DTOs
┌───────────────────────────▼─────────────────────────────────┐
│                    Persistence Layer                        │
│ PMP codec, schema validation/migration, ProjectFileService │
└───────────────────────────┬─────────────────────────────────┘
                            │ adapter
┌───────────────────────────▼─────────────────────────────────┐
│                     Platform Layer                          │
│ Browser file APIs / local runtime; future desktop adapter  │
└─────────────────────────────────────────────────────────────┘
```

Dependencies point inward. The Domain Layer MUST NOT depend on React, Next.js, browser APIs, filesystem APIs, or a future desktop shell.

## 3. Technology Baseline

Use TypeScript throughout. React/Next.js and Tailwind are the preferred presentation stack. The exact local launcher/runtime implementation is intentionally implementation-defined and should be selected for simplicity, cross-platform operation on Windows/macOS, and minimal resource use.

No Supabase, Vercel runtime dependency, authentication service, external database, telemetry, analytics, or Internet service belongs in the POC runtime.

## 4. Repository Structure

A target structure is:

```text
src/
  domain/
    entities/
    relationships/
    rules/
    validation/
    calculations/
  application/
    commands/
    state/
    history/
    navigation/
    search/
    warnings/
  persistence/
    pmp/
    schema/
    migrations/
    project-file-service/
  platform/
    browser/
    launcher/
  features/
    overview/
    streams/
    people/
    tasks/
    milestones/
    gantt/
    tube-map/
    risks/
    decisions/
    warnings/
    settings/
  components/
  app/
tests/
docs/
```

Codex may adjust physical folders when justified, but the logical separation must remain.

## 5. Domain Model

`Project` is the aggregate root for the project file. Project membership is established by project ownership/storage, not by redundant generic relationships.

Core entities:

- Project
- Stream
- Person
- Task
- Milestone
- Risk
- RiskAction
- Decision
- Relationship
- Dependency

Every main entity has a stable internal identifier and a project-local human-readable sequential identifier. Deleted IDs are never reused.

Generic relationships connect compatible entities. Dependencies are a specialised relationship with prerequisite/dependent semantics and cycle prevention.

Soft deletion is domain state, not physical removal. Deleted entities remain serialised so they can be restored and historical relationships retained.

## 6. Application State and Commands

User mutations should flow through an application command boundary rather than arbitrary component state mutation. Commands provide a consistent place for:

- domain validation;
- derived recalculation;
- warnings refresh;
- undo/redo history;
- dirty-state calculation;
- autosave scheduling.

A command should be deterministic given current project state and input. Duplication and soft-delete/restore operations that are defined as atomic must create one history entry.

Undo/redo is session-only and must not be serialised into `.pmp`.

## 7. Persisted State vs Session State

Persist project content, configuration and project-relevant display/settings required to recreate the project as specified.

Do not persist ephemeral session state such as:

- undo/redo stacks;
- current modal/panel;
- temporary form drafts;
- module filters/sorts that are explicitly session-only;
- transient `Saving…` state;
- derived Project Warnings.

Dirty/saved status is determined by comparison to the last successfully persisted project snapshot, not merely by whether a command has occurred.

## 8. `.pmp` Container

The `.pmp` file is the sole project source of truth. It should be a compressed structured container with identifiable entries, conceptually:

```text
project.pmp
  manifest.json
  project.json
  config.json
  runtime/          # when required by the self-contained distribution design
```

The exact internal layout may evolve, but the manifest must allow safe identification of:

- `.pmp` format version;
- project/schema version;
- application/runtime version;
- required compatibility metadata.

The codec must validate container structure and payloads before creating trusted domain objects. Do not deserialize arbitrary executable objects or trust paths from the archive.

No absolute filesystem paths may be stored in project data. Archive extraction must reject path traversal, unexpected unsafe entries, malformed payloads and unsupported versions.

## 9. Schema and Migration

Schema versioning is explicit. Opening follows this decision path:

```text
Read container
  → validate manifest/container
  → check compatibility
      → compatible: validate project payload → open
      → older supported schema: offer migration
      → requires newer runtime: block with explanation
      → malformed/unsafe: reject safely
```

Migration is never silently applied. A migration produces a new `.pmp` file and leaves the original untouched.

Migration code should be explicit version-to-version transforms and independently testable.

## 10. Project File Service

All project file operations go through an abstraction similar to:

```ts
interface ProjectFileService {
  create(...): Promise<ProjectFileHandle>;
  open(...): Promise<ProjectFileHandle>;
  save(...): Promise<SaveResult>;
  saveAs(...): Promise<ProjectFileHandle>;
  reload(...): Promise<LoadedProject>;
  inspect(...): Promise<FileInformation>;
}
```

This is conceptual, not a required exact signature.

The browser implementation owns file-picker/file-handle behaviour. A future desktop adapter may use native filesystem APIs without changing domain/application behaviour.

Components and domain code must not directly read/write project files.

## 11. Persistence Lifecycle

Autosave interval: 60 seconds when changes exist.

Relevant changes mark the project dirty. A successful save establishes a new persisted baseline. Autosave must not alter undo/redo history. Undo after save may make the project dirty again.

Save state machine should distinguish at minimum:

```text
saved → dirty → saving → saved
                  └────→ save-failed → retry/save-as
```

`Saving…` is only surfaced when the save exceeds approximately 500 ms.

Repeated autosave failures offer Save As. A successful Save As changes the active project file and establishes a new persisted baseline while preserving session undo/redo history.

If file access is lost, never claim success. Keep a persistent critical warning and provide Retry and Save As.

## 12. External Modification and Concurrency

No full filesystem lock is required. If the active `.pmp` changes externally, detect it where platform capabilities allow and offer:

- Keep Current;
- Reload from File.

Reload with unsaved in-app changes requires explicit destructive confirmation. Keep Current makes the in-app state authoritative; a subsequent save may overwrite the external version.

Only one project is open in an application instance. Opening the same project twice should focus the existing project. Switching to a different project follows the save/discard rules in the requirements.

## 13. Launcher Boundary

The Project Manager Launcher is a lightweight factory/navigation shell, not a project database.

It provides only:

- New Project;
- Open Project.

It maintains no recent-project registry and does not own project content. It remains running but hidden/minimised while a project is open and returns to the foreground when that project closes.

The local runtime starts from the launcher and exists only while needed by the application. There must be no unnecessary persistent background service.

## 14. Derived Data

Prefer deriving values from canonical project state instead of persisting duplicated values.

Examples:

- parent task progress/status/dates;
- stream progress;
- active-task counts;
- risk counts;
- overdue indicators;
- Project Warnings;
- Overview summaries.

Derived calculations should live in pure domain/application functions and have unit tests.

## 15. Warning Engine

Project Warnings are derived and recalculated on project load and immediately after relevant changes. They are not persisted.

The warning engine should be rule-based and extensible:

```text
ProjectState → WarningRule[] → ProjectWarning[]
```

Initial rules concern approved date inconsistencies only. Dependency temporal warnings are excluded from the POC.

Critical validation that blocks an operation is separate from non-blocking Project Warnings.

## 16. Search Architecture

Global search indexes current project entities by human ID and name/title. It must be designed so future entity types can register searchable projections without rewriting the search UI.

Deleted entities are excluded by default and included only when `Include Deleted` is enabled.

Search results navigate through the application navigation layer so module context and Quick View behaviour remain consistent.

## 17. Gantt and Tube Map

Gantt and Tube Map are views over the same canonical domain entities. They must not maintain independent copies of tasks/milestones/dependencies.

Gantt supports detailed planning and may mutate tasks, milestones, dates, progress and dependencies through normal application commands.

Tube Map is a high-level roadmap over Streams, Milestones and milestone dependencies. It contains no Tasks. Dragging or editing a milestone modifies the canonical milestone entity.

Both visual modules should isolate layout/rendering calculations from domain mutation logic.

## 18. Security Boundaries

Treat every `.pmp` file as untrusted input.

Required controls include:

- schema validation before domain hydration;
- archive path traversal prevention;
- decompression/size limits to reduce archive-bomb risk;
- allowed-entry/type validation;
- safe JSON parsing and bounded collections/strings where practical;
- no arbitrary code execution from project content;
- no external resource fetching caused by project data;
- no absolute path trust;
- safe error handling without exposing sensitive local paths unnecessarily.

The app must operate fully offline.

## 19. Error Handling

Errors must distinguish user-correctable conditions from technical failures. Never silently lose data and never state that a project was saved unless persistence succeeded.

File incompatibility, corruption, unsupported browser capability, lost file permission and save failure require explicit user-facing states with safe next actions.

## 20. Testing Strategy

Use a layered test strategy:

1. Unit tests for domain rules, calculations, validation, identifiers, duplication, deletion, warnings and migration transforms.
2. Application tests for commands, history, dirty-state transitions and navigation state.
3. Persistence tests using representative valid/invalid `.pmp` fixtures.
4. Component/integration tests for critical module flows.
5. End-to-end tests for the main project lifecycle in supported Chrome Desktop behaviour where practical.

Security tests must include malformed containers, traversal attempts, invalid schemas and unsupported versions.

The implemented regression layers are described in [AUTOMATED_REGRESSION.md](AUTOMATED_REGRESSION.md). `src/testing/regression-fixture.ts` builds deterministic canonical project state with 180 records; `regression.test.ts` checks scenario pairs, domain commands, projections and complete `.pmp` round trips. `e2e/run-regression.mjs` asks Vitest to serialize a disposable fixture, then runs the existing Chrome acceptance harness with extended checks from `e2e/regression.mjs`. Full mode additionally exercises creation forms. These are development tools, not app runtime dependencies or user project data. Browser persistence crosses the real codec and application file service using an isolated in-memory file adapter; native OS picker consent remains manual.

## 21. Accessibility and UX Engineering

Use semantic HTML and keyboard-operable controls. Modals/panels require sensible focus management and Escape behaviour. Interactive Gantt/Tube Map operations should provide accessible alternatives where practical.

Desktop responsiveness must support different desktop/laptop resolutions and aspect ratios without assuming one fixed viewport.

## 22. Performance

The POC should avoid unnecessary global rerenders and expensive recomputation. Derived selectors/calculations may be memoised when useful, but correctness and maintainability take priority over premature optimisation.

Do not introduce background polling, cloud sync or heavyweight services. File operations and visual calculations should not block the UI unnecessarily.

## 23. Future Desktop Migration

The architecture must make a future installed desktop shell an adapter change rather than a rewrite. The following remain portable:

- domain model;
- application commands/state;
- `.pmp` codec/schema/migrations;
- feature UI;
- validation/calculation rules.

Platform-specific concerns are isolated behind Project File Service and launcher/platform adapters.

## 24. Architectural Invariants

The implementation must preserve these invariants:

1. `.pmp` is the sole project source of truth.
2. Core domain code is platform/UI independent.
3. Project entities use stable internal IDs and non-reused human IDs.
4. Soft deletion retains entity and relationships.
5. Deleted entities do not affect normal derived metrics.
6. Gantt, Tube Map and Overview share canonical entities rather than copies.
7. Project Warnings are derived, not persisted.
8. Undo/redo is session-only and independent from autosave.
9. A save is acknowledged only after successful persistence.
10. Migration never overwrites the original project file.
11. Project data cannot trigger arbitrary code execution or external resource loading.
12. POC operation remains offline and cloud-independent.

## 25. Decision Precedence

When making an implementation decision:

1. Follow `PROJECT_REQUIREMENTS.md`.
2. Preserve the architectural invariants above.
3. Prefer the simplest implementation satisfying both.
4. Record material architectural decisions in documentation.
5. Ask for user clarification only when a material product/architecture ambiguity remains.

## POC v1.1 architecture

Schema 2 is the canonical write format. The PMP codec recognises schema 1 and runs the pure `migrations.ts` normaliser before structural validation and hydration. This keeps compatibility logic at the persistence boundary and avoids parallel domain schemas. Legacy Due values are preserved in `legacyDueDate` solely for lossless history and never populate Start or End scheduling fields.

Task schedule values are nullable independent fields. Dependency graph integrity remains centralised in domain relationship validation and canonical `ProjectState.dependencies`; task controls, warning derivation, and Gantt all consume that same collection. Parent recalculation derives progress and completion only.

Milestone scope is a discriminated union (`project` or `streams` with stable IDs). Soft deletion never rewrites dependency or scope relationships. The warning selector derives current inconsistencies and corrective actions dispatch ordinary project commands, so dirty state, undo/redo, autosave, and counts stay coherent.

Gantt and Tube Map models are pure projections of canonical state. Their timeline models calculate fixed twelve-column windows and proportional date positions. Repeated milestone marks carry the same entity ID and are not cloned state. Stream array order is the visual order.

Sidebar visibility belongs to the application shell and is intentionally session-only React state. Hidden mode removes the navigation column entirely and exposes a fixed restore control; no persistence adapter or project configuration is involved.

## HeroUI experiment presentation boundary

The approved `experiment/heroui-ui` branch adds bundled HeroUI v2 controls and a client provider only at the presentation boundary. Core domain, application commands, file service and `.pmp` schema remain unchanged. See [HEROUI_EXPERIMENT.md](HEROUI_EXPERIMENT.md).

## v1.3.1 presentation baseline

HeroUI v2 Button/Chip controls and provider are part of the main presentation layer. Tailwind 4 runs through @tailwindcss/postcss and loads the existing theme configuration explicitly. Entity modules read project state through useSyncExternalStore so selection lists update directly on committed changes. The compact sidebar retains its own grid column; it never overlays the project header. Domain, file-service and persistence boundaries are unchanged.

## v1.5 shared interaction implementation

- `ModuleSearch` owns one disclosure/popover for live search and filters on all eight approved pages. The shared record-filter hook stores selected stable IDs; `matchesFilters` applies AND across categories and OR within each category. Risk Matrix selection writes to the same Level category used by the popover. Module unmount resets this transient state.
- Creation uses `CreationField`, pure calendar/required-field validation and `useCreationFeedback`. Only mandatory user inputs appear in creation; optional scope, owners and dependencies remain in row/context editing. Successful commands clear all creation inputs and active filters while retaining creation mode. No UI state is written to `.pmp`.
- `PredictiveSelect`, `RelationshipPicker` and `SearchableOptionList` share query matching, arrows, Enter and Escape behaviour. Selection lives in canonical state or an explicit context draft, independently of query-filtered results. Native disclosure closing clears query state; outside clicks dismiss disclosures. Short fixed-value entity controls remain native selects.
- `matchesEntitySearch` is the shared pure projection for module/global search, including descriptive text, owner and relationship names/human IDs, dependencies and risk actions. Matching itself lives in `option-matching.ts`, without React imports. Deleted related names remain excluded, preserving the established search contract.
- Risk/Decision context drafts commit through existing commands and preserve relationships not being changed. Decision task/risk links are now explicitly editable, in addition to the existing Stream/Milestone context. Multiline context submission supports Ctrl/Cmd+Enter.

## v1.5 candidate text/manual/lifecycle preparation

`HumanTextInput` and `HumanTextArea` normalise only completed human-readable UI edits, then invoke existing blur/commit handlers. Controlled draft callbacks update local draft state before Save; Cancel remains side-effect free. Feature commands normalise only explicitly supplied text patch fields and compare the normalised patch before committing, so unrelated edits leave legacy text untouched and repeated blur produces no history/audit mutation.

The bundled manual resolver selects exact version metadata first, otherwise a clearly labelled compatible same-minor entry, and never constructs a link to an unpublished release asset. The candidate PDF is generated locally with Pandoc/XeLaTeX via `scripts/build-v15-manual.sh`; these are documentation-build tools, not application/runtime dependencies.

Dirty Open/Close actions use an explicit Save/Discard/Cancel dialog above the shell. Autosave pauses while this choice is pending. Failed Save retains the dialog and in-memory work. Forced same-file open activates the newly read saved project; cancelling the picker preserves current memory instead of silently discarding it.


Shared Search/Filter remediation: ModuleSearch owns the compact toolbar input and a body portal for the filter panel. Shared pure geometry clamps/positions panels and flips them above when space is limited. PredictiveDisclosure uses native manual popovers for table option panels, retaining DOM ancestry and keyboard/query-reset behaviour while escaping table/scroll clipping. Filter styles are scoped to the panel to prevent broad workspace input rules inflating checkbox, search or Clear controls. No persistent state/command/file format change.


PageToolbar renders one shared grid with equal outer tracks and a 340px centre search track; its narrow fallback puts search on a centred second row. The existing toolbar ResizeObserver continues measuring sticky-header height. TimelineNavigation shares Tube Map's footer styles and calendar-date formatter with Gantt; each caller owns offsets and inclusive/exclusive end conversion. Gantt navigation uses the unchanged model's 1/7/14-day increments. Gantt scrolls inside the chart, while its footer remains in normal flow below it and uses the same sticky presentation as Tube Map. No persistence/domain/application-command change.


Unified creation: EntityCreationPanel owns local draft/dirty/error state and uses the established Dialog with a right-side variant, required-field initial focus, visible-control Tab cycling, topmost-dialog handling and restoration. A shared pure prepareCreation boundary validates panel fields and returns one existing entity command; People creation accepts optional Role/Notes atomically, Risk creation can include validated initial actions. Domain/persistence/schema are unchanged. Optional selectors reuse PredictiveSelect/RelationshipPicker and native top-layer positioning. Cancel discards; outside/Escape dirty dismissal uses the same Stay/Discard dialog. Creation success resets page search/filters and unmounts the draft; there is no inline record form.

ProjectFormFields shares stable accessible error slots between New Project and Project Details. New Project uses an empty UI status sentinel accepted only by form validation, never persisted. The file operation has an independent validity/busy guard as well as a disabled button. Existing valid ProjectDraft/domain types and project file APIs remain unchanged. Task bulk selection is rendered inside the existing right toolbar region; active selections determine count and deletion. Tall table rows centre content, and wide context text/Notes stay within their available columns.


Status/layout extension: TaskStatus/TASK_STATUSES extend LifecycleStatus for Tasks only; Project/Stream retain their original five-value set. Persisted Task validation accepts only the six defined statuses. A Tentative-containing save raises an older manifest minimum-runtime value to 1.5.0-rc.1; original-status files and higher supplied minima are retained. Format/schema are unchanged, and old data is never relabelled on load. Existing duplication still resets its new copy to Not Started, preserving the source.

Chart projections receive transient status arrays (empty means unrestricted). Gantt filters Tasks before population/hierarchy projection, retains Milestones and full hierarchy depth references. Tube filters Milestones before search/lane population/stations/connections. Neither mutates canonical state. TimelineStatusLegend uses the same typed colour maps as actual bars/diamonds; the shared navigation footer hosts the compact legend above existing controls.

Positioning uses actual popup scroll height and viewport geometry. Portal/native top-layer panels are positioned before paint and observed for content changes, scroll and resize; above panels end six pixels above the field rather than leaving an estimated-height gap. PredictiveDisclosure also owns Gantt warning overlays. Risk Matrix expansion is sessionStorage-only presentation state. Context pickers use stable headings/counts, and Overview cards size independently.

Tube Map caption clearance is measured from rendered station labels rather than a fixed footer spacer. SVG connection height stays tied to lane coordinates while only the body grows for overflowing captions. Shared popup placement also dismisses a panel once its trigger leaves its visible scroll container.

Tube Map footer shielding uses a clipped paint-only shadow below the sticky footer. An absolutely positioned viewport-height pseudo-element would enlarge workspace scroll overflow and let scrolling exceed the chart containing block, pushing the sticky axis offscreen. Keep decorative painting separate from layout/scroll extents; native top-layer selectors remain above this surface.

## v1.6 schedule history and responsive workspaces

Optional ProjectState.baselines stores versioned immutable schedule snapshots with stable entity IDs and detached historical stream references. Domain capture/comparison/calendar-day variance are independent of React, persistence and audit recording. Application commands edit collection/metadata through the existing store and Undo/Redo. Loaded snapshots are structurally validated then frozen; historical references are checked against the snapshot rather than current entities. Baseline-containing saves raise the minimum reader to 1.6.0 without changing project schema 2 or container format 1. Files without baselines retain the existing optional-field/compatibility contract. Archive writing appends large entry bytes incrementally rather than passing them as a function's argument list.

Baseline selection lives in a project-keyed React provider and resets on close. Gantt, Tube Map and comparison share the same calculations. Historical Tube Map markers use separate aligned lanes to preserve live station geometry and label targets. Dependency editing preserves canonical record IDs/types; pure shared validation and warnings do not schedule or persist derived warnings. Existing chart connector support is retained.

FitTable preserves native cells, refs, controls and sorting; a workspace container query wraps all record fields into labelled groups when the table cannot fit. No columns are removed. Gantt and Tube Map use date navigation, with vertical-only scrolling and reserved footer space. Existing top-layer popup measurement remains authoritative. Extended Mode was implemented only after the owner approved the revised mockup with exact standalone Tasks panel equivalence.


Extended Gantt is a layout-only wrapper around the same GanttView and TasksModule, sharing one ProjectStore and baseline-selection provider. Tasks mounts on first use and remains hidden in Simple to preserve transient filters without adding a second module to an untouched Simple view. Pointer capture and keyboard controls adjust the split within minimum pane heights; ResizeObserver measures controls and each pane's toolbar. Compact styles are scoped to the split surfaces.

Shared Dialog renders through a body portal, keeping all modal panels above both panes and out of compact styles or scroll containers. The task creation component and its styling are unchanged. Browser equality checks compare every panel/field/control rectangle and computed typography/spacing between standalone and Extended Tasks; local verification additionally compares the pre-change standalone reference at three desktop widths. Global draft detection, focus return, modal focus trap and dirty-dismiss behavior remain shared.

## Compatibility UI token source — 28 October 2026

The initial presentation-token migration uses [src/ui/tokens.json](../src/ui/tokens.json) for existing field metrics, timeline footer minimum and separate task/milestone palettes. A dependency-free development script generates committed CSS; the production build checks freshness. Existing CSS variable names and TypeScript palette exports remain compatibility interfaces. See [ownership and maintenance](../src/ui/README.md). Tokens stay outside domain/PMP data; this introduces no service, persistence or runtime dependency. Remaining visual roles and component ownership migrate incrementally with equivalent computed-style evidence.

Shared timeline styles now live beside the rendering assets in `src/features/shared/timeline-surfaces.css`. The existing viewport stylesheet is an ordered, unlayered import entry with its original layout prefix first. Both app and catalogue consume the same cascade. The [ownership map](UI_STYLE_OWNERSHIP.md) documents remaining legacy boundaries; extraction does not approve changing visual values.

Field surfaces, planning control presentation and dropdown-search input styling now have separate shared owners behind the same ordered viewport entry. Late panel/context overrides remain explicit after those assets. Obsolete toolbar-only Zoom selectors were removed because the control lives in the footer; live footer/general-field rules and all accepted values remain unchanged. See the ownership map for the complete import order.
