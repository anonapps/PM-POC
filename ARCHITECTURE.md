# Project Management POC — Architecture

**Status:** Implementation architecture supporting `docs/PROJECT_REQUIREMENTS.md`  
**Authority:** This document explains *how* to implement the approved requirements. If it conflicts with `PROJECT_REQUIREMENTS.md`, the requirements take precedence.

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