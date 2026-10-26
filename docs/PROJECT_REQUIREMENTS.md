# ARGOS PM — Authoritative Requirements

**Document status:** v1.6 approved scope; stable v1.5 requirements retained
**Repository:** `anonapps/PM-POC`
**Purpose:** Authoritative product, behavioural, data-model and implementation requirements for the local-first Project Management POC.  
**Precedence:** If any other repository document conflicts with this file, this file takes precedence unless the user explicitly approves a change.

---

## v1.6.0 approved scope — 26 October 2026

The user supplied the original planning conversation requirements and consolidated implementation instructions. These additions supersede conflicting earlier exclusions only within this scope. Full acceptance and phase gates: [V1.6_IMPLEMENTATION.md](V1.6_IMPLEMENTATION.md).

- **REQ-001:** Fit all content and controls inside the desktop viewport with no horizontal scrolling or hidden offscreen content. Adapt tables, columns, toolbars and filters; permit vertical scrolling. Preserve sidebar behavior. Gantt and Tube Map navigate time using Previous, Next and Jump to today.
- Verify existing persistent Gantt footer, shared Search/Filter toolbars, measured dropdown positioning/alignment, sticky controls, compact visual consistency, quick edits, sorting, filters and both charts' navigation. Do not invent additional behavior.
- Multiple named baselines: unique stable IDs, names/descriptions, timestamps, immutable versioned schedule snapshots with stable task/milestone IDs and historical stream references. Create/list/select/rename/delete with confirmation; shared comparison calculations for start/finish variance, additions/removals and undated items. Store in .pmp independently of audit recording; preserve legacy files.
- Reuse existing dependency records and supported relationship types; enhance cross-stream identification/filtering/sorting/inspection/editing, self/cycle/missing-reference validation and informational schedule warnings. Never schedule automatically or duplicate links.
- Optional Gantt baseline overlays/variance, Tube Map baseline milestone indicators/dependency visibility and a sortable/filterable comparison table must share calculations and preserve existing interactions and station layout.
- **Extended Mode clarification (26 October):** Search remains centered horizontally on the page content at the same position across pages, independent of action widths; retain existing status colors. Add Task must reuse the full-height, page-level right creation panel used by standalone Tasks, overlaying both panes and the project header, never constrained to the bottom pane. The revised mockup was explicitly approved, conditional on preserving the standalone Tasks creation panel’s exact sizes, location, field distribution, whitespace and fonts. Reuse the same panel unchanged; compact styles apply only to the split module surfaces.
- **REQ-002 / mandatory approval gate:** Before implementing Extended Mode, produce a detailed populated mockup of Simple/Extended Gantt, compact upper chart and lower Tasks panel, toggle immediately before Expand All, split resizing/scroll behavior, baseline/dependency controls. Stop for explicit mockup approval. Only Extended Mode receives compact spacing; standalone Tasks and Simple Gantt retain their behavior/layout except approved viewport fitting and new controls.
- One consolidated v1.6 release; feature branch only. Preserve local/offline architecture, .pmp compatibility, Audit History and Undo/Redo. Exclude critical path, float, what-if, milestone trend visualizations, financial/resource management, attachments, cloud collaboration and automatic scheduling.
- Extend seeded unit/integration/browser regression tests and document actual results, compatibility, screenshots and limitations. Prepare a draft PR; never merge, release or deploy without explicit approval.

---

## v1.5.0 approved requirements (supersedes earlier behaviour where inconsistent)

**Status:** Requirements frozen following 19 clarification batches (57 decisions). This section is authoritative for v1.5; the detailed acceptance checklist is in [V1.5_APPROVED_ENHANCEMENTS.md](V1.5_APPROVED_ENHANCEMENTS.md).

## Approved enhancements

| ID | Scope |
| --- | --- |
| 001 | Remove global Open Project and Close; right-align Saved, Save Now, Undo, Redo. Move Open Project, Close, Save As to File Information. |
| 002 | Compact New Project and Project Details forms; mark mandatory fields with an asterisk and explanatory note. |
| 003 | Capitalise the first letter of human-readable text on blur, not technical identifiers; one edit and one Undo/audit event. |
| 004 | Rename audit section to “Audit Log (experimental)”. |
| 005 | Store Last Saved local date/time, saving device timezone and UTC offset in .pmp only after successful writes; legacy files show “Timezone unavailable” until saved. |
| 006 | Replace People and Tasks sidebar letters with the approved icons. |
| 007 | Shared live Search/Filter bar, search/filter icon and popover; Show Deleted before Add Task. |
| 008 | Shared centred toolbar for all specified pages; full-field right-side creation panels for Streams, People, Tasks, Milestones, Risks and Decisions; no legacy inline creation route. |
| 009 | Hide Decision Log Context display column while retaining editable relationships and underlying context. |
| 010 | Consistent outlined inputs and textareas. |
| 011 | Searchable dynamic-list dropdowns with search row and case-insensitive contains matching, including multi-select. |
| 012 | Responsive Project-wide scope pill becomes ALL when narrow, with hover/focus tooltip. |
| 013 | File Information links to version-matched UI Reference Manual; source in repository, PDF in GitHub Release; clearly labelled compatible same-minor fallback if exact manual unavailable. |
| 014 | Sidebar collapse/expand preserves navigation vertical positions; sidebar fixed while content scrolls. |
| 015 | Gantt milestone labels padded and hierarchical indentation consistent. |
| 016 | Dotted red Today line spans timeline body in Gantt. |
| 017 | Tube Map uses same shared Today marker component and design tokens. |
| 018 | Independent Hide Empty Streams state for Gantt and Tube Map, synchronised between each chart's controls and its filter popover. |

## Approved interaction and filtering rules

- Search is immediate on each keystroke, case-insensitive contains matching, across all relevant fields including non-displayed fields.
- Filters combine with AND across categories and OR within a category; update immediately, without Apply.
- Reset search, filters and Show Deleted on navigation; after successful creation, clear active search/filters.
- Inline creation shows mandatory fields only; optional fields remain available through existing inline editing. Inline validation appears beneath the invalid field.
- On successful creation show a brief non-blocking notification, stay in creation mode, clear the form, and focus the first mandatory field.
- Cancel discards the draft immediately. Navigation away from a populated draft warns first. Search icon remains disabled while creating.
- Predictive multi-select preserves selections even when filtered out by search; clear search when dropdown closes.
- Dynamic-list predictive search applies to People, Streams, Tasks, Milestones and dependencies; fixed short dropdowns retain normal behaviour.
- Keyboard: Tab navigation, Enter submits valid single-line forms or selects dropdown results, arrow keys navigate results, Escape closes dropdowns, Ctrl/Cmd+Enter submits multiline forms.
- Undo restores the original value in one operation, including automatic capitalisation. No separate formatting audit entry.
- Unsaved Open Project presents Save / Discard / Cancel; Close returns to welcome and warns only if unsaved.
- Last Saved displays original saving device's local timestamp and timezone, without conversion to viewer timezone.
- Gantt counts any non-deleted task (including a parent with deleted children) or milestone as populating a stream; Tube Map counts milestones only. Each assigned stream counts for multi-stream milestones; undated/out-of-window records count. Deleted records do not.
- Hide Empty Streams defaults off and is independent between charts.
- Today marker starts below date headers and extends to the bottom of all timeline rows, using a shared component and tokens.
- Sidebar icon tooltips and abbreviated ALL pill tooltips work on hover and keyboard focus.
- UI manual is version-specific; maintain repository source and publish PDF release asset.
- .pmp files from v1.4 must open safely without data loss. Preserve migration and security boundaries documented in PROJECT_REQUIREMENTS.md and ARCHITECTURE.md.



**Compatibility constraint:** A v1.4 `.pmp` must open without data loss. Do not silently migrate a file that requires a technical schema migration; preserve the existing migration rules and keep the original file intact. New optional save-time metadata must be backward compatible.

---

## v1.4.0 approved product additions

The ARGOS PM v1.4.0 release extends the baseline requirements without changing the local-first, offline `.pmp` principle:

- Gantt: compact task quick editor (name, start and end dates), stream navigation, sorting, expand/collapse per stream and globally, expanded by default, today marker and compact date labels.
- Tube Map: milestone quick editor (name and date), stream navigation, Monday date axis, today marker, consistent lane/diamond/label positioning, and persistent navigation footer.
- UI: house/search navigation icons, reordered planning modules, consistent compact headings and controls, sortable columns, muted consistent Scope pills, and risk severity colours matching the 3×3 matrix.
- People: optional editable Role and Notes columns and differentiated deleted-state pills.
- Project preferences: show/hide progress information without deleting underlying values; persist the preference in `.pmp`.
- Audit history: opt-in recording; 5,000 latest events retained per project, default viewer hidden, at most 50 rows visible, searchable records and CSV export, with Undo/Redo events. Commit text edits on completion rather than every keystroke. Existing audit data remains available when recording is disabled.
- Version and branding: product name ARGOS PM, release 1.4.0. Earlier implementation details remain historical where superseded by these approved additions.

For acceptance evidence and outstanding visual checks, see `V1.4_ACCEPTANCE_REVIEW.md`.

---

## 1. Product Intent

The application is a **local-first project-management POC** for managing a connected project system rather than a simple task list.

The product must support:

1. Project definition.
2. Streams.
3. People.
4. Tasks.
5. Milestones.
6. Dependencies and generic relationships.
7. Risks and risk actions.
8. Decisions.
9. Gantt planning.
10. Tube Map roadmap visualisation.
11. Project warnings.
12. Global search.
13. Local persistence in a portable `.pmp` project file.

The project must remain intentionally lightweight. The POC is not Jira, MS Project, a collaboration platform, a document-management system, a cloud application, or a resource-planning platform.

---

## 2. POC Scope and Non-Goals

### 2.1 POC scope

The POC MUST:

- run locally;
- work fully offline;
- support one project open at a time;
- store each project in a single self-contained `.pmp` file;
- support Windows and macOS desktop/laptop environments;
- use Chrome Desktop as the officially supported browser;
- remain Chromium-compatible where practical;
- provide a zero-install browser experience for the POC;
- provide a one-click local launcher plus a direct browser entry point for development/testing;
- use a persistent left navigation and adaptive full-screen desktop UI;
- keep all POC project data inside the `.pmp` project file.

### 2.2 Explicit non-goals

The POC MUST NOT include:

- Internet dependency;
- cloud hosting as a runtime requirement;
- Supabase or any external database;
- authentication or user accounts;
- multi-user collaboration;
- online synchronisation;
- external integrations;
- notifications or reminders;
- attachments;
- external file references;
- comments or a separate notes subsystem;
- import/export workflows;
- printing or PDF export;
- application-managed backups;
- application-managed recovery copies;
- mobile/tablet support;
- project deletion from inside the application;
- resource-capacity planning;
- budget management;
- automated scheduling based on dependencies;
- dependency temporal warnings in the POC.

---

## 3. Architecture Principles

### 3.1 Local-first architecture

The project file is the authoritative source of truth.

All project functionality must work offline once the local runtime is available.

The application MUST NOT require cloud services or network connectivity for normal operation.

### 3.2 Separation of domain and UI/runtime concerns

The core domain model MUST be independent from:

- React;
- Next.js;
- browser APIs;
- filesystem implementation details;
- any future desktop shell such as Tauri.

Domain logic should be implemented as framework-agnostic TypeScript where practical.

### 3.3 Project File Service abstraction

A `Project File Service` abstraction MUST exist from the beginning.

Its purpose is to isolate project-file operations from the rest of the application so the POC can use browser-compatible file APIs and a future desktop shell can provide a native filesystem adapter without changing the domain model or `.pmp` format.

The abstraction should cover at least:

- create project file;
- open project file;
- read project file;
- save project file;
- Save As;
- detect accessibility failures;
- detect external file modification where technically practical;
- expose file metadata required by File Information.

### 3.4 Future desktop shell

The POC MUST NOT require a desktop shell.

The architecture SHOULD remain suitable for a later installed desktop application, potentially using a Tauri-style shell.

The future desktop application may provide native file association and native filesystem access while preserving `.pmp` compatibility.

---

## 4. Technology Direction

Preferred implementation stack for the POC:

- TypeScript;
- React;
- Next.js;
- Tailwind CSS;
- modular domain architecture.

The local runtime technology behind the launcher is implementation-defined. Do not lock the product architecture to Node.js, Python, or another specific runtime unless needed by the implementation.

The repository must not introduce Vercel, Supabase, authentication, telemetry, analytics, or cloud infrastructure as POC dependencies.

---

## 5. `.pmp` Project File

### 5.1 Core concept

Each project is represented by a single self-contained `.pmp` file.

Copying the `.pmp` file to another compatible computer and opening it must reproduce the project state, including project data, configuration/module data and relevant project/UI settings required to recreate the project.

### 5.2 Container format

The `.pmp` file should be a compressed structured container, conceptually ZIP-like.

It should contain identifiable components such as:

- project data;
- schema/project-format version;
- application/runtime compatibility version;
- configuration;
- any self-contained runtime content required by the chosen packaging approach.

Runtime duplication between files is accepted for the POC if required by the chosen architecture, but should be compressed and kept reasonably efficient.

### 5.3 Version metadata

Every `.pmp` MUST embed at least:

- project/schema version;
- app/runtime compatibility version.

### 5.4 Compatibility behaviour

When opening a file:

- compatible file → open normally;
- older schema/project version requiring migration → explicitly offer migration;
- file requiring a newer runtime → block opening and clearly explain the incompatibility.

Migration MUST NOT happen silently.

A migration must create a **new migrated `.pmp` file** and leave the original file untouched.

Migration refers to technical schema/data-format migration, not business-process upgrades.

### 5.5 Paths and references

Project data MUST NOT store absolute filesystem paths.

References inside the project must use stable IDs, relative/logical references, or other portable identifiers.

External file references are excluded from the POC.

### 5.6 Security validation

Opening a `.pmp` file MUST treat file contents as untrusted input.

Implementation must validate at least:

- container structure;
- expected file types/entries;
- schema shape;
- version metadata;
- duplicate or invalid IDs;
- invalid relationship references;
- malformed content;
- decompression limits and archive safety;
- path traversal attempts;
- unexpected executable/script content where applicable.

The parser MUST fail safely and provide a clear compatibility/invalid-file message rather than executing or trusting arbitrary content.

---

## 6. Launcher and Runtime Lifecycle

### 6.1 Project Manager Launcher

A separate local **Project Manager Launcher** acts as the project factory and entry point.

Its UI contains only:

- `New Project`;
- `Open Project`.

It MUST NOT maintain:

- a recent-project list;
- a project library;
- project registry data;
- automatic reopen state.

### 6.2 Runtime behaviour

The launcher starts the local runtime and opens the application in Chrome automatically.

A direct browser entry point must also be available for development/testing.

The local runtime:

- starts automatically from the launcher;
- runs only while the application is active;
- stops when the application closes;
- is not a persistent background service.

A transient helper process is allowed if technically necessary.

### 6.3 Launcher while project is open

While a project is open, the launcher should remain running but hidden/minimised.

When the project closes, the launcher returns to the foreground.

The launcher remains separate from project data and does not become the source of truth for project state.

### 6.4 One project at a time

Only one project may be open at a time.

If the same `.pmp` is opened twice, focus/return to the already-open project rather than opening a second instance.

If a different project is requested:

- current project has no unsaved changes → open the new project immediately;
- current project has changes → attempt immediate save;
- save succeeds → open new project immediately;
- save fails → warn and offer `Continue` / `Cancel`;
- `Continue` must explicitly state that unsaved changes will be discarded, then open the new project.

### 6.5 Close project

Closing a project returns the user to the Project Manager Launcher.

The project runtime then stops completely.

---

## 7. Project Creation

Creating a project requires:

Mandatory:

- Project Name;
- Start Date;
- Status.

Optional:

- Description;
- End Date.

The user chooses filename and storage location before creation.

The application provides a sensible default filename derived from Project Name.

Filename sanitisation must be conservative and cross-platform safe.

The `.pmp` filename is not required to match Project Name.

After creation, the project opens immediately.

---

## 8. Persistence, Autosave and Save As

### 8.1 Autosave

Autosave interval: **60 seconds**.

Any change that affects `.pmp` data, project configuration, or relevant project/UI settings counts as an unsaved change.

Autosave MUST NOT alter Undo/Redo history.

### 8.2 Save state indicator

Header shows compact state:

`Saved · HH:MM`

Show `Saving…` only if a save operation takes more than approximately 500 ms.

Do not alter the browser/window title to indicate unsaved state.

More technical save/file details belong in File Information.

### 8.3 Save Now

Keyboard shortcut:

- Windows: `Ctrl+S`;
- macOS: `Cmd+S`.

### 8.4 Save on close/switch

If changes exist since the last successful save, closing or switching projects must attempt an immediate save.

If save success cannot be confirmed, warn the user and never claim the project was saved.

### 8.5 Save failures

A save failure must produce a persistent warning with actions such as:

- `Save Now`;
- `Retry`.

After repeated autosave failures, offer `Save As`.

### 8.6 Save As

Save As behaviour:

- default filename = current Project Name converted to a valid `.pmp` filename;
- user may change name/location;
- if target exists, show application confirmation: `Overwrite` / `Choose Another` / `Cancel`;
- successful Save As makes the new file the active project file;
- future autosaves target the new file;
- successful Save As preserves Undo/Redo history;
- successful Save As establishes a new persisted baseline.

### 8.7 File inaccessible during editing

If the active project file becomes inaccessible:

- show persistent critical warning;
- do not claim save success;
- offer `Retry` and `Save As`.

### 8.8 External modification

If the project file is externally modified while open, where detection is technically possible, warn and offer:

- `Keep Current`;
- `Reload from File`.

If unsaved changes exist and the user selects reload, require explicit confirmation:

`Reload and discard my unsaved changes?`

`Keep Current` means the in-app state remains authoritative and the next successful save may overwrite the externally modified file.

No full file-locking mechanism is required.

### 8.9 Crash recovery

There is no app-managed recovery copy.

After a crash, reopening restores only the last successfully saved state.

---

## 9. Undo and Redo

Undo/Redo is a core POC capability.

Shortcuts:

- Undo: `Ctrl/Cmd+Z`;
- Redo: `Ctrl/Cmd+Y` or `Ctrl/Cmd+Shift+Z`.

Requirements:

- global across modules;
- session-only;
- not persisted in `.pmp`;
- cleared when project closes;
- autosave does not affect history;
- undo after save marks project unsaved;
- Project Progress changes participate;
- create/edit/delete/restore operations participate;
- duplication is one atomic Undo/Redo operation;
- soft-delete Undo atomically restores entity and relationships;
- Save As preserves history.

---

## 10. UI and Navigation

### 10.1 General layout

The UI must be:

- desktop/laptop focused;
- adaptive across normal desktop resolutions/aspect ratios;
- full-browser-screen;
- modern and professional;
- information-dense in operational views;
- more spacious/visual in Overview and Tube Map;
- built from reusable, consistent components.

### 10.2 Navigation

Use a persistent left sidebar.

Project Overview/Dashboard is the landing view.

Modules appear in the sidebar.

The architecture must allow future modules to be added without restructuring the whole shell.

### 10.3 Editing pattern

Use a hybrid interaction model:

- modal/side-panel forms for creation and full editing;
- inline editing for common simple fields such as name, status, dates, progress and priority where appropriate;
- edit data in context when practical.

### 10.4 Closing edited panels

Closing an edited modal/panel applies the changes, equivalent to `Done`.

No additional confirmation is required for normal close/apply behaviour.

### 10.5 Keyboard shortcuts

Required shortcuts:

- `Ctrl/Cmd+Z` Undo;
- `Ctrl/Cmd+Y` or `Ctrl/Cmd+Shift+Z` Redo;
- `Ctrl/Cmd+S` Save Now;
- `Esc` close modal/panel;
- `Ctrl/Cmd+K` global search.

### 10.6 Empty states

Each module must have a contextual empty state with a relevant action where appropriate.

### 10.7 Help/About

Provide lightweight Help/About containing:

- Getting Started;
- guide by module;
- Keyboard Shortcuts;
- app version.

Technical project-file metadata remains under File Information.

---

## 11. Project Settings, Project Details and File Information

### 11.1 Project Details

From Overview, `Edit Project` opens a modal/panel.

Editable fields:

- Project Name;
- Description;
- Start Date;
- End Date;
- Status.

There is no `Save` button.

`Done` applies changes and closes.

`Discard` behaviour:

- if no changes → close without confirmation;
- if changes → confirmation `Discard changes?` with `Keep Editing` / `Discard`.

Critical validation blocks `Done`.

Warnings do not block `Done`.

### 11.2 Project Settings

Project Settings is for user-facing project configuration.

POC display configuration:

- week starts Monday;
- display date format `DD/MM/YYYY`;
- comfortable density only;
- all POC modules visible.

The underlying architecture may support alternative week start, date display, compact density and module visibility for future use, but these are hidden in the POC.

### 11.3 File Information

File Information is read-only and contains technical information such as:

- `.pmp` format version;
- app/runtime version;
- schema version;
- relevant file metadata;
- technical save information.

---

## 12. Validation Philosophy

Only critical validation blocks an operation.

Non-critical inconsistencies produce warnings.

Mandatory fields validate when the user attempts to complete/create the operation. Missing mandatory fields remain visible and highlighted; the form stays open.

Project Start Date after Project End Date is a critical validation error.

Most other date inconsistencies are warnings, including dates outside parent/project ranges.

---

## 13. Project Entity

### 13.1 Fields

Mandatory:

- Name;
- Start Date;
- Status.

Optional:

- Description;
- End Date.

Additional:

- Project Progress: manual integer 0–100.

### 13.2 Status

Fixed lifecycle statuses:

- Not Started;
- In Progress;
- On Hold;
- Completed;
- Cancelled.

Status is manual.

### 13.3 Project Progress

Project Progress:

- manual;
- integer 0–100;
- independent from Project Status;
- editable inline in Overview;
- shown as percentage plus horizontal bar;
- participates in Undo/Redo;
- no automatic status/progress linkage.

---

## 14. Entity Identity and Relationships

### 14.1 Stable IDs

Every entity has:

- stable internal ID;
- human-readable sequential ID.

Examples:

- `STREAM-001`;
- `TASK-001`;
- `MILESTONE-001`;
- `RISK-001`;
- `PERSON-001`;
- `DECISION-001`.

Deleted IDs are never reused.

When creating or duplicating, use next highest issued number + 1, not the lowest gap.

### 14.2 Project membership

`project_id` establishes project membership.

Generic relationships must not duplicate basic membership.

A relationship to Project means the entity specifically applies to the project as a whole.

### 14.3 Generic relationships

The data model should support generic cross-module relationships between compatible entities.

Dependencies are a specific relationship type, not the only relationship capability.

The model should remain extensible for future relationship types.

---

## 15. Streams

### 15.1 Fields

- Name — mandatory;
- Description — optional;
- Owner — optional Person;
- Status — lifecycle status;
- Start Date — optional;
- End Date — optional;
- Priority — optional.

### 15.2 Status

Use project lifecycle statuses:

- Not Started;
- In Progress;
- On Hold;
- Completed;
- Cancelled.

Status is manual.

### 15.3 Progress

If a stream has no tasks, progress is `N/A`.

If tasks exist, stream progress is calculated from leaf/flat tasks only.

Rules:

- equal weighting;
- parent tasks do not contribute separately;
- flat task counts as leaf;
- integer 0–100, rounded to nearest integer.

Example: `100 + 50 + 25` across three leaves = `58%`.

### 15.4 Dates in Overview timeline

- stream with no dates → not shown in timeline, but remains in Stream Status Summary;
- only Start Date + Project End Date exists → display Start → Project End;
- only Start Date and no Project End → use dynamic timeline logic;
- only End Date + Project Start exists → display Project Start → Stream End;
- stream outside Project date range → display normally and generate warning.

### 15.5 Overview KPI

`Streams` KPI counts active streams only, excluding Completed and Cancelled.

Clicking the KPI opens Streams module showing all streams with active streams highlighted.

Clicking a stream in Stream Status Summary opens the stream detail.

---

## 16. People

### 16.1 Scope

People are project data, not accounts or login identities.

### 16.2 Fields

Initially only Name is required.

People receive internal IDs and human ID `PERSON-###`.

### 16.3 Ownership

Owner is the only people relationship required in the POC.

An entity has zero or one Owner.

A Person may own multiple entities.

Owner display uses person name by default; ID may appear on hover/details.

### 16.4 People module

Provide a lightweight module for:

- list;
- add;
- edit;
- delete.

Do not implement resource planning or capacity management.

### 16.5 Deleting a Person

Deleting a Person triggers a reassignment flow showing owned entities.

The user may reassign each/all ownerships.

If an owned entity is not reassigned, it may retain the deleted Person as owner with a deleted/inactive indicator.

Deleted People cannot be selected as new owners.

IDs are never reused.

---

## 17. Tasks

### 17.1 Fields

- Name — mandatory;
- Description — optional;
- Scope — exactly one Stream OR explicitly Project-wide;
- Status — lifecycle status;
- Start Date — optional for leaf/flat;
- End Date — optional for leaf/flat;
- Owner — optional;
- Priority — Low / Medium / High;
- Progress — manual for leaf/flat, integer 0–100;
- Milestone — optional association;
- Dependencies — optional;
- Parent Task — optional;
- Actual Completion Date — derived on completion.

Estimated Effort may exist as future-compatible data but must not appear in the POC UI or calculations.

### 17.2 Hierarchy

Task hierarchy is optional.

Requirements:

- flat tasks allowed;
- nested tasks allowed;
- maximum depth = 4 levels;
- mixed flat and hierarchical task structures allowed.

### 17.3 Parent task calculations

Parent Progress = equal-weighted average of immediate children.

Parent Status = derived from children.

Parent Start = earliest child Start.

Parent End = latest child End.

Parent Actual Completion Date = latest child Actual Completion Date when all children are complete.

Parent dates are calculated and not directly editable.

### 17.4 Leaf/flat task dates

Valid states:

- no dates;
- Start only;
- Start + End.

Unscheduled tasks remain visible in normal task lists and are clearly distinguishable in Gantt.

### 17.5 Status and completion

Leaf/flat task status is manual.

When a leaf/flat task becomes Completed:

- set Actual Completion Date to current date.

When reopened:

- clear Actual Completion Date.

When completed again:

- set a new Actual Completion Date.

For a parent:

- all children complete → parent Completed;
- parent Actual Completion Date = latest child completion;
- adding or reopening a child may move the parent out of Completed and recalculate values.

### 17.6 Overdue task

A task is overdue when:

- End Date has passed;
- status is not Completed.

Overdue is an indicator only; it must not automatically alter status.

### 17.7 Dependencies

Tasks can depend on compatible tasks/milestones across streams and hierarchy.

Requirements:

- prevent circular dependency chains;
- dependency direction = prerequisite → dependent;
- no automatic rescheduling;
- no dependency temporal warnings in POC;
- keep model extensible for future FS/SS/FF/SF dependency types.

### 17.8 Overview Active Tasks

Active Tasks = leaf/flat tasks with status:

- Not Started;
- In Progress;
- On Hold.

Exclude:

- Completed;
- Cancelled;
- parent tasks.

Include Project-wide tasks.

Clicking Active Tasks opens Task Management filtered to active tasks, preserving the filter for the session.

---

## 18. Milestones

### 18.1 Concept

Milestones are distinct entities, not zero-duration tasks.

### 18.2 Fields

- Name — mandatory;
- Description — optional;
- Date — mandatory;
- Status — Tentative / Planned / Delayed / Complete;
- Owner — optional;
- Priority — optional;
- Related Streams — zero, one or multiple OR explicitly Project-wide;
- Related Tasks — zero or multiple;
- Dependencies — optional;
- Actual Completion Date — derived.

### 18.3 Completion

When status becomes Complete:

- set Actual Completion Date to current date;
- preserve planned milestone Date.

When reopened:

- clear Actual Completion Date.

When completed again:

- set a new Actual Completion Date.

Status remains manual.

A past milestone date creates a warning/attention state where applicable but does not automatically change status.

### 18.4 Project-wide and multi-stream milestones

A milestone is Project-wide only when explicitly marked.

A multi-stream milestone represents one shared milestone, not duplicate milestones.

In Tube Map it appears as a shared/intersecting station.

A Project-wide milestone crosses all stream lines in Tube Map.

### 18.5 Overview behaviour

Upcoming Milestones:

- next 5 by date ascending;
- include Tentative, Planned, Delayed;
- exclude Complete.

Delayed Milestones KPI appears only when at least one milestone is Delayed.

Clicking it opens Milestones filtered to Delayed.

Clicking a milestone list item opens its detail/edit view.

Clicking a milestone marker in Overview timeline opens Tube Map centered/highlighted on that milestone.

Project-wide milestones appear as independent project-level markers above streams in Overview timeline.

---

## 19. Gantt

### 19.1 Purpose

Gantt is the detailed planning/execution view.

### 19.2 Visualisation

Show:

- Streams;
- Tasks;
- Milestones;
- Dependencies;
- Dates;
- Duration;
- Status;
- Progress.

Hierarchy:

`Project → Stream → Tasks`

Milestones remain independent entities at project/project-wide level while retaining their associations.

### 19.3 Interaction

Gantt must support:

- create/edit tasks;
- create/edit milestones;
- change dates/duration where editable;
- move tasks where valid;
- change task progress;
- create/manage dependencies;
- detailed panel for full fields.

### 19.4 Timeline

Zoom levels:

- Day;
- Week;
- Month;
- Quarter.

Default = Week.

Dependencies render as arrows from prerequisite to dependent and may cross streams.

Unscheduled tasks remain visible in a distinct unscheduled treatment.

Project-wide tasks appear in a dedicated collapsible section.

Project-wide milestones appear at project level.

---

## 20. Tube Map

### 20.1 Purpose

Tube Map is a high-level roadmap/narrative view.

It shows only:

- Streams as lines;
- Milestones as stations;
- milestone dependencies as visual connections.

It MUST NOT show Tasks.

### 20.2 Time axis

Time is shown as Week 1 → Week N.

User may display either:

- calendar week labels such as `W38`, `W39`;
- first Monday date for each week.

Week starts Monday.

Milestones are proportionally positioned using their exact date within the week and are not snapped to the week boundary.

Default visible range:

- Monday of Project Start week;
- through Monday of Project End week.

### 20.3 Interaction

Tube Map must support:

- create milestones;
- edit milestone details;
- drag milestone date;
- move milestone between streams where valid;
- create/manage milestone dependencies;
- click station to open details/edit.

Multi-stream milestone = one shared station.

Project-wide milestone crosses all stream lines.

Milestone dependencies display as direct arrows/connections between stations and may cross streams.

---

## 21. Overview / Dashboard

### 21.1 General

Overview is the project landing page and must be entirely data-driven from the shared project model.

It updates immediately while the project is open after relevant changes in other modules.

### 21.2 Header

Show:

- Project Name;
- Project Status;
- Start Date;
- overall timeline context;
- Edit Project;
- global Project Warnings indicator.

### 21.3 KPI / summary areas

Provide:

- Streams;
- Active Tasks;
- Upcoming Milestones;
- Open Risks;
- High Risks;
- Delayed Milestones when applicable;
- Overdue Items.

Definitions:

**Streams** = active streams excluding Completed/Cancelled.

**Active Tasks** = active leaf/flat tasks defined in Task requirements.

**Open Risks** = Open + Mitigated + Accepted, excluding Closed.

**High Risks** = Risk Level High and active status.

**Overdue Items** = overdue Tasks + overdue Milestones where applicable + overdue Risk Actions.

### 21.4 KPI navigation

- Streams → Streams module, all streams visible, active highlighted;
- Active Tasks → Task Management with active filter;
- Open Risks → Risk Log filtered active/open definition;
- High Risks → Risk Log filtered High + active;
- Delayed Milestones → Milestones filtered Delayed;
- Overdue Items → combined contextual panel/list with direct navigation.

Module filters opened this way persist for the session.

### 21.5 Overview visuals

Show:

- high-level timeline;
- upcoming milestones;
- risk summary/matrix;
- stream status summary.

### 21.6 Overview timeline

The Overview timeline includes:

- Project range;
- Streams;
- Milestones.

It does NOT include Tasks.

Streams render as bars.

Milestones render as markers with name/date/status.

Prioritise future milestones and delayed/past milestones requiring attention. Completed historical milestones should not be prominent.

Project-wide milestones render independently above stream rows.

If Project End Date is absent:

- dynamic end = farthest dated relevant Stream/Task/Milestone;
- if only Project Start exists and there are no other dated elements, show an empty-state timeline rather than inventing an end date.

Empty timeline state should explain what is missing and offer relevant creation actions for Stream/Task/Milestone.

Streams without dates do not appear on timeline but remain visible in Stream Status Summary.

Entities outside project dates still render and generate warnings.

Project-wide tasks do not receive special Overview timeline treatment.

### 21.7 Project info and editing

Project Name, Status, dates and Description are shown on Overview.

Name/status/dates are not edited inline from Overview; clicking/editing opens Project Details.

Description shows first lines and supports expand/collapse; edit only through Project Details.

Project Progress is the exception and is editable inline.

### 21.8 New-project onboarding checklist

A new project opens to an empty Overview with an optional adaptive checklist.

Exactly four checklist steps:

1. Project — Project Details valid;
2. Streams — at least one Stream;
3. People — at least one Person;
4. Milestones — at least one Milestone.

Do not include Tasks, Dependencies, Risks or Decisions in onboarding.

The checklist is data-driven and disappears automatically when all four conditions are complete.

### 21.9 Quick Actions

Quick Actions are adaptive.

During onboarding, prioritise actions that complete the onboarding checklist.

After onboarding, show only a small set of contextually useful actions.

`Add Task` is available from Overview only when at least one Stream exists.

Do not duplicate every module administration action in Overview.

---

## 22. Risk Log

### 22.1 Risk fields

- Risk ID;
- Title — mandatory;
- Description — optional;
- Status — Open / Mitigated / Closed / Accepted;
- Probability — Low / Medium / High;
- Impact — Low / Medium / High;
- Risk Level — calculated;
- Owner — optional;
- Actions — zero or multiple;
- Due Date — optional, generic user-defined meaning;
- Related Streams — zero/one/multiple/all;
- related Tasks/Milestones/future compatible entities — optional;
- Project-wide scope — allowed.

Risk may combine project-wide, stream and entity relationships where meaningful.

### 22.2 Risk matrix

Use a configurable 3×3 matrix, not arithmetic multiplication.

Required POC mapping:

| Probability | Impact Low | Impact Medium | Impact High |
|---|---|---|---|
| Low | Low | Low | Medium |
| Medium | Low | Medium | High |
| High | Medium | High | High |

### 22.3 Risk UI

Provide:

- primary table/list;
- risk matrix alongside/as secondary visual;
- sorting;
- filtering;
- interactive matrix.

Clicking a matrix cell filters/highlights matching risks.

Selecting a risk highlights its matrix cell.

Changing Probability/Impact immediately updates Risk Level and matrix placement.

### 22.4 Risk filters

At least:

- Status;
- Probability;
- Impact;
- Risk Level;
- Owner;
- Related Stream;
- Related Milestone;
- Related Task;
- Due date / overdue.

### 22.5 Risk actions

A risk may have multiple actions.

Action fields:

- Description — mandatory;
- Status — Open / Complete;
- Due Date — optional.

An action is overdue when Due Date passed and status Open.

Overdue is indicator only.

Completing all actions MUST NOT automatically close the risk.

### 22.6 Risk status

Risk status is manual.

Accepted remains active/reporting.

Closed is excluded from active counts but retained historically.

Closed risk may reopen.

On reopen, previously completed actions remain Complete; mitigation history is retained and new actions can be added.

### 22.7 Risk deletion

Soft-deleting a risk retains its actions and relationships.

Restoring the risk restores the full risk, actions and retained relationships.

### 22.8 Overview risk behaviour

Overview shows risk counters and 3×3 matrix.

Clicking a counter opens Risk Log with corresponding filter.

Clicking matrix cell opens a contextual filtered list/panel.

---

## 23. Decision Log

Decision Log is lightweight.

Fields:

- Decision ID;
- Title — mandatory;
- Description — optional;
- Date — mandatory;
- Owner — optional;
- Related Streams — zero/multiple;
- Related Tasks — zero/multiple;
- Related Milestones — zero/multiple;
- Related Risks — zero/multiple;
- Project-wide — allowed.

No Decision Status in the POC.

No separate Rationale field in the POC.

Full editing occurs in Decision Log.

Simple fields such as Title/Date/Owner may support inline editing where displayed.

Decision deletion uses soft-delete.

Issue Log is not a POC UI module, but the model may remain future-capable.

---

## 24. Project Warnings

### 24.1 General behaviour

Warnings are derived, not persisted in `.pmp`.

Recalculate:

- immediately after relevant changes;
- when project loads/opens.

Warnings persist while the underlying condition exists.

Opening the warnings panel does not clear them.

All warnings use the same severity in the POC.

The warning engine should remain extensible.

### 24.2 UI

Show:

- global Project Warnings indicator in Overview header;
- indicators on affected entities where appropriate;
- full Project Warnings panel when global indicator clicked.

Warnings are displayed as a flat list, sortable/filterable, not grouped.

Each warning includes:

- Type;
- affected entity;
- description;
- related date where relevant;
- direct navigation/access.

Filters:

- warning type;
- entity type.

Default order = related date ascending where a date exists.

Direct navigation should open:

- editable entity detail for entity warnings;
- relevant visual view with highlight when visual context is more useful.

### 24.3 Initial warning rules

Initial engine scope = date consistency only.

#### Project rules

- Project Start > Project End = critical validation block, not merely warning;
- Stream outside Project dates = warning;
- Task outside Project dates = warning;
- Milestone outside Project dates = warning;
- missing Project Start/End alone = no warning.

#### Stream rules

- Stream Start > Stream End = warning/validation condition consistent with general rules;
- Stream outside Project = warning;
- Task before Stream Start = warning;
- Task after Stream End = warning;
- absent Stream dates = no warning;
- no milestone-vs-stream-specific warning beyond the dedicated multi-stream milestone rule below.

#### Task rules

- Task Start > Task End = warning/validation condition;
- Task outside Project = warning;
- Task outside Stream = warning;
- absent task dates = no warning;
- no task-vs-milestone warning.

Warnings caused by child dates should attach to the actual offending child, not merely the calculated parent.

#### Milestone rules

- milestone outside Project = warning;
- multi-stream milestone warns only when outside the date period of **all** related streams;
- Project-wide milestone does not receive stream-range warning.

#### Dependency rules

No dependency temporal warnings in the POC.

---

## 25. Soft Deletion

### 25.1 Entities

Soft-delete applies to:

- Streams;
- Tasks;
- Milestones;
- People;
- Risks;
- Decisions.

### 25.2 Behaviour

Deleted entities:

- are hidden from normal views;
- remain in project data;
- retain IDs permanently;
- retain relationships, but those relationships become inactive/not normally navigable;
- are excluded from normal KPIs, counts, charts, summaries and derived calculations.

Each relevant module provides `Show Deleted`.

Restore is per entity, not bulk.

Restore fully restores entity and retained relationships.

### 25.3 Delete confirmation

If deleting an entity affects dependencies or generic relationships:

- allow soft-delete;
- show confirmation listing relationships/dependencies that will become inactive.

If no relationships are affected, delete immediately without additional confirmation.

This rule also applies from detail panels.

### 25.4 Bulk delete

Bulk selection/deletion is initially supported only for:

- Tasks;
- Risks;
- Decisions.

Bulk deletion confirmation is shown only if relationships/dependencies are affected.

Bulk restore is not supported.

### 25.5 References to deleted entities

An active entity may display a retained relationship/owner reference to a deleted entity with a `Deleted`/inactive indicator.

Normal navigation/selection of the deleted entity is disabled unless `Show Deleted` or equivalent deleted context is enabled.

### 25.6 Search and deleted entities

Global search excludes deleted entities by default.

`Include Deleted` toggle adds them.

Deleted search results show a Deleted indicator and support:

- Quick View;
- Restore.

---

## 26. Duplication

Duplication is supported for:

- Tasks;
- Milestones;
- Risks;
- Decisions.

General rules:

- new name/title receives `(Copy)`;
- new entity receives next sequential human-readable ID;
- duplicate is one atomic Undo/Redo action;
- duplicate marks project unsaved;
- normal autosave rules apply;
- relationships to deleted entities are not copied;
- dependencies are not copied.

### 26.1 Task duplicate

Copy:

- descriptive fields;
- priority;
- owner if active;
- dates if present;
- Stream or Project-wide context;
- same parent;
- active milestone association.

Reset:

- Status → Not Started;
- Progress → 0;
- Actual Completion Date → none.

Do not copy:

- dependencies;
- child tasks.

### 26.2 Milestone duplicate

Copy:

- descriptive fields;
- planned Date;
- active Stream associations;
- owner/priority where valid;
- active related entities where appropriate.

Reset:

- Status → Tentative;
- Actual Completion Date → none.

Do not copy dependencies.

### 26.3 Risk duplicate

Copy risk fields and active relationships.

Reset Status → Open.

Risk Actions are duplicated:

- Description copied;
- Due Date copied;
- Status reset to Open.

Deleted-entity relationships are excluded.

### 26.4 Decision duplicate

Copy descriptive fields and active relationships to Streams/Tasks/Milestones/Risks.

Reset Decision Date → current date.

Deleted-entity relationships are excluded.

---

## 27. Global Search

Global search appears in the header and opens with `Ctrl/Cmd+K`.

It searches all current and future entity types by:

- name/title;
- human-readable ID.

Results are grouped by module/entity type.

Search architecture should allow future modules to register searchable entities without rewriting the whole search feature.

Result interaction:

1. Quick View first;
2. from Quick View, navigate to full detail in owning module.

Deleted entities are excluded unless `Include Deleted` is enabled.

---

## 28. Cross-Module Navigation and Session State

When navigating from one module to an entity in another module:

- preserve the target module’s last session state where practical;
- open the entity detail within its owning module;
- closing detail returns to the prior module context.

Module filters/sorting are remembered for the current session only.

Gantt and Tube Map may remember zoom/scroll/selection state for the current session.

Reopening the project resets Overview and major visual views to default state.

---

## 29. Multi-Selection

Multi-selection should exist only where it is naturally useful.

Initial scope:

- bulk delete-like actions;
- Tasks;
- Risks;
- Decisions.

Do not implement general bulk field editing.

Do not implement bulk Restore.

---

## 30. Date and Time Conventions

POC user-facing date format:

`DD/MM/YYYY`

Underlying storage must use an unambiguous machine-readable representation.

Week starts Monday.

Date calculations must avoid timezone-induced date shifts for date-only project fields.

---

## 31. Derived Calculations and Invariants

The following are core behavioural invariants:

1. Project Progress is manual and independent from Project Status.
2. Stream Progress derives only from leaf/flat tasks.
3. Parent Task Progress derives from immediate children.
4. Parent Task dates derive from children and are not manually editable.
5. Parent completion derives from children.
6. Deleted entities do not contribute to normal calculations.
7. Soft-deleted relationships remain retained but inactive.
8. Human-readable IDs are never reused.
9. Dependencies must not form circular chains.
10. `.pmp` is the single authoritative persisted project representation.
11. Autosave never changes Undo/Redo history.
12. Saving does not clear Undo/Redo history.
13. Undo after save makes the project unsaved.
14. Warnings are derived and are not persisted.
15. Overview is derived and refreshes immediately after relevant changes.
16. No automatic dependency-driven scheduling occurs.
17. No automatic status changes occur merely because a date has passed.
18. Completing/reopening task/milestone controls Actual Completion Date as defined above.

---

## 32. New Project Default Experience

On first open after creation:

- route to Overview;
- show project header/details;
- show empty-state visuals where appropriate;
- show the four-step onboarding checklist;
- show adaptive Quick Actions;
- do not fabricate sample data.

---

## 33. File Naming

Default filename is based on Project Name and ends in `.pmp`.

Sanitisation should:

- remove/replace characters invalid on Windows/macOS;
- avoid reserved device/file names where applicable;
- trim problematic trailing spaces/dots;
- preserve a recognisable version of the project name;
- avoid silently changing the Project Name itself.

Filename and Project Name remain independent after creation.

---

## 34. Accessibility and UX Quality

The POC should meet strong desktop accessibility expectations.

At minimum:

- keyboard-accessible primary workflows;
- visible focus states;
- semantic controls;
- labels associated with inputs;
- sufficient contrast;
- status not communicated by colour alone;
- dialogs/panels with logical focus management;
- Escape behaviour where specified;
- interactive visualisations provide accessible alternative/contextual information;
- forms expose validation text clearly.

Accessibility regressions should be treated as defects, not optional polish.

---

## 35. Performance Expectations

The application should feel immediate for normal single-project POC usage.

Implementation should:

- avoid unnecessary full-project recomputation on every render;
- derive calculations predictably;
- keep autosave non-blocking for the UI where possible;
- avoid resource-heavy background loops;
- avoid long-lived file/process locks;
- lazy-load expensive visual modules where useful;
- keep runtime and `.pmp` handling reasonable for desktop use.

Do not optimise prematurely at the expense of clarity, but do not design obviously unbounded rendering or persistence loops.

---

## 36. Security and Privacy

The product is local-first and should minimise data exposure.

Requirements:

- no telemetry by default;
- no analytics by default;
- no cloud sync;
- no network calls required for project operation;
- no authentication service;
- no secrets embedded in client code;
- validate all `.pmp` inputs;
- treat rendered user text as data, not executable HTML;
- protect against script/markup injection;
- avoid unsafe archive extraction;
- avoid arbitrary filesystem access outside user-selected project operations;
- do not persist absolute local paths inside `.pmp`.

---

## 37. Implementation Sequence

Codex should implement in logical blocks rather than attempting the full system in one task.

Recommended sequence:

0. Environment / Repository Foundation
1. Domain Model Foundation
2. Application State / Command Architecture
3. `.pmp` Format
4. Project File Service
5. Launcher / Local Runtime
6. Core UI Shell
7. Project Creation / Overview
8. Streams / People
9. Tasks
10. Milestones
11. Gantt
12. Tube Map
13. Risks
14. Decisions
15. Project Warnings
16. Search / Cross-Module Navigation
17. Persistence / Recovery Hardening
18. Security Hardening
19. Accessibility / UX Polish
20. Final QA

Each block should:

- inspect existing code first;
- implement only that block’s intended scope;
- add/update tests;
- run lint/typecheck/tests/build as appropriate;
- fix regressions introduced by the block;
- update architecture documentation when significant decisions are made;
- commit validated work before continuing to the next block.

---

## 38. Testing Expectations

Testing should cover domain rules and critical user flows.

Minimum categories:

### 38.1 Unit/domain tests

- ID generation and non-reuse;
- task hierarchy depth;
- parent progress/status/date derivation;
- stream progress;
- dependency cycle prevention;
- milestone completion/reopen logic;
- task completion/reopen logic;
- risk matrix calculation;
- warning rules;
- soft delete and restore;
- duplication rules;
- derived KPI counts;
- date-only handling.

### 38.2 Persistence tests

- create/open/save/reopen `.pmp`;
- schema validation;
- version compatibility;
- migration creates new file and preserves original;
- corrupted/invalid file rejection;
- archive/path traversal defence;
- Save As baseline behaviour;
- external modification decision handling where supported.

### 38.3 UI/integration tests

- create new project;
- onboarding checklist progression;
- create/edit/delete/restore major entities;
- Undo/Redo across modules;
- Overview refresh after edits;
- navigation preserving module session state;
- global search and Quick View;
- deleted search toggle;
- risk matrix interactions;
- warnings navigation;
- keyboard shortcuts.

### 38.4 Visual modules

- Gantt hierarchy and unscheduled tasks;
- milestone rendering;
- dependency arrows;
- Tube Map shared milestones;
- Project-wide milestone crossing streams;
- exact date placement within week;
- cross-stream dependencies.

---

## 39. Acceptance Criteria — Product Level

The POC is acceptable when all of the following are true:

1. User can launch the local app without installing a traditional desktop application.
2. User can create a `.pmp` project and choose its location.
3. User can close/reopen the same `.pmp` and retain the persisted project state.
4. Project works without Internet access.
5. Project can be moved to another compatible machine without embedding absolute local paths.
6. Autosave works every 60 seconds and Save Now works manually.
7. Save failures are visible and recoverable through Retry/Save As.
8. Undo/Redo works globally across supported editing actions.
9. User can manage Streams, People, Tasks, Milestones, Risks and Decisions.
10. Task hierarchy and derived parent behaviour comply with requirements.
11. Gantt provides detailed planning interactions.
12. Tube Map provides high-level Stream/Milestone roadmap interactions.
13. Overview accurately derives KPIs, timeline and summaries from current project data.
14. Project Warnings derive from configured rules and navigate to affected entities.
15. Soft delete/restore works without ID reuse.
16. Duplication follows entity-specific reset/copy rules.
17. Global search finds active entities by name/title or human-readable ID.
18. Deleted search results are available only when explicitly included.
19. Invalid/corrupt `.pmp` input fails safely.
20. The app makes no required cloud/network call for normal project operation.

---

## 40. Final Scope Guardrails for Codex

When implementing this repository:

### MUST

- read this file before architectural/product changes;
- preserve local-first behaviour;
- preserve `.pmp` as source of truth;
- preserve domain independence from UI/runtime adapters;
- implement incrementally;
- test core behavioural rules;
- commit validated logical blocks.

### MUST NOT

- replace `.pmp` with a database;
- introduce Supabase, Firebase or another backend;
- require Vercel or another hosting service;
- introduce authentication;
- add cloud sync;
- turn the POC into a multi-user system;
- silently change approved business rules;
- silently auto-migrate project files;
- invent attachments/import/export/notifications/comments functionality;
- implement dependency auto-scheduling;
- reuse deleted human-readable IDs;
- persist derived warnings as authoritative data.

### SHOULD

- choose simple, maintainable implementations;
- make architectural seams explicit;
- keep future desktop packaging feasible;
- document meaningful implementation decisions in `docs/ARCHITECTURE.md`;
- keep implementation progress aligned with `docs/IMPLEMENTATION_PLAN.md` once that file exists.

---

## 41. Requirement Change Control

This file reflects the approved requirements baseline.

If a future user instruction explicitly changes a requirement:

1. update this document first or in the same change;
2. identify the superseded rule;
3. update implementation/tests affected by the change;
4. preserve version/history through Git commits.

Do not infer that an implementation shortcut permanently changes the product requirement.

---

## POC v1.1 implemented specification (supersedes conflicting v1.0 text)

POC v1.1 uses project schema version 2 and application compatibility version 1.1.0. Schema-1 files open through an automatic, in-memory normalisation: missing task dates become null, legacy Due is retained as non-scheduling historical data, a legacy task predecessor becomes a Finish-to-Start relationship, and implicit milestone scope becomes explicit Project-wide scope. Saving emits schema 2; the original file is not separately rewritten during open.

Tasks have independently managed optional Start Date and End Date. Both dates are required for scheduling; one missing date is valid and Unscheduled. End Date before Start Date is rejected, while a same-day task is valid. Parent progress/completion remains derived from immediate children, but dates are never derived. Deleting a parent promotes active children to its parent (or the top level); restoring does not re-parent them.

Tasks support any number of unique Finish-to-Start predecessor relationships using stable IDs. Active parent and leaf tasks are eligible. Self-references, missing/deleted new references, and direct or indirect cycles are prevented. Dependencies never schedule tasks automatically. Historical references to soft-deleted tasks remain until restored or explicitly removed.

Milestones have either explicit Project-wide scope or one or more stable Stream IDs. The choices are mutually exclusive. Deleted Stream references are preserved historically, hidden from active selection, and restored automatically when the Stream is restored. Editing scope requires a valid non-empty active selection.

Warnings are derived, never acknowledged or persisted, and cover child schedules outside a fully scheduled parent, Finish-to-Start timing violations, deleted predecessor references, deleted milestone-scope Streams, and active Tasks belonging to deleted Streams. Same-day handover is valid. Corrective relationship removal requires confirmation and is a normal dirty, persisted command.

Navigation order is Overview, Search, Streams, People, Tasks, Milestones, Gantt, Tube Map, Risk Log, Decision Log, Warnings, and File Information. From v1.3.1, the sidebar collapses to a rail showing only each section’s first letter. A small left arrow collapses it and a right arrow expands it; the control stays inside the sidebar without overlapping the project header. The state is session-only and restores on reload. Its Warnings label omits a zero count.

Gantt has exactly twelve columns: calendar days for Week, Monday-Sunday weeks for Month, and Monday-based fourteen-day periods for Quarter. Its default window has two periods before the current period and nine after it. Only fully scheduled tasks have bars or connectors; actual dates are positioned proportionally. It includes an always-visible Project-wide row and one occurrence of a multi-stream milestone in every applicable active Stream.

Tube Map is a twelve-week Monday-based roadmap with an always-visible Project-wide row, ordered active Stream rows, neutral Stream lines, and purple milestone diamonds at actual-date positions. Multi-stream visual occurrences remain one logical milestone and connections remain entity-level. Outside-window indicators are informational.

Risk Log opens at Level All. Level filters the table (including deleted risks when requested), while the 3x3 matrix always represents all active risks. The always-visible Add Risk control follows the matrix.


## Manual acceptance correction — 24 October 2026

The user's Search/Filter remediation instruction refines E007/E008/E018: use a compact live search input in the title/Add toolbar with an integrated filter icon and a compact, viewport-constrained filter panel. Gantt/Tube Map use the same shared design and expose **one** Hide Empty Streams checkbox per chart in that panel, with independent chart state. This supersedes the earlier duplicated toolbar/popover presentation; population counting is unchanged. Keep all functional filters, query semantics, creation disabling, navigation resets and canonical `.pmp` data boundaries. The user explicitly requested Playwright layout checks in addition to existing regression/lifecycle coverage for this remediation.


## Approved Gantt/footer and centred-search correction — 24 October 2026

Gantt date navigation moves from the top toolbar to a persistent footer matching Tube Map: Previous, inclusive visible DD/MM/YYYY range, Next, Jump to today. Keep Gantt's existing one-column offsets (Week 1 day, Month 7 days, Quarter 14 days), zoom reset and Today marker; Tube Map retains its four-week offset. The footer remains outside the chart scroll area, without hiding the final row or dependency information. Top controls retain title, search/filter, Expand All, Collapse All and Zoom.

All ten search pages use a shared three-region title/search/actions layout. Equal outer tracks place the fixed-width search input at the page content centre independently of title length, right actions, placeholder or filter state. Title stays left, actions right. At narrower widths use a centred second search row with controlled action wrapping. Preserve sticky positioning, existing query/filter/keyboard behaviour, data and `.pmp` compatibility. These are user-approved v1.5 corrections, not additional features.


## Approved unified creation/layout correction — 24 October 2026

This instruction supersedes the earlier mandatory-only repeat-inline-creation rules in E008. Each record Add opens the same right-side, dimmed, modal panel with all relevant required/optional fields. Preserve required semantics: Person/Stream/Task/Risk name/title, Milestone name/date, Decision title/date. Focus the first required text field; ordinary single-line Enter validates/submits, textarea Enter inserts a newline, predictive-list Enter selects. Keep Create enabled to validate, reserve associated error space, focus the first invalid required field, close/clear after success and restore Add focus. Cancel discards immediately. Dirty outside/Escape dismissal uses the established Stay/Discard confirmation; clean dismissal closes normally. No alternative inline record creation route remains. Relationships, dependencies, initial optional fields and initial Risk actions use one canonical creation command/Undo operation.

New Project Status starts blank and must be explicitly selected; Choose File & Create stays disabled until all mandatory fields and dates are valid. Invalid submissions must not invoke file access. Use stable error slots across forms. Widen Risk/Decision context text, reuse searchable selection panels, remove rectangular chrome around scope pills, centre other contents in tall rows and fit People Notes within its column. Task bulk deletion sits in the right toolbar region before Show Deleted; the selection heading has a checkbox only. Remove redundant gaps between module toolbars and data. Preserve confirmed independent search centring, Gantt footer/navigation, dates, existing domain rules and `.pmp` compatibility.


## Approved status/legend/dropdown/layout batch — 24 October 2026

- Add **Tentative to Tasks only** alongside the five existing statuses; keep default Not Started and existing task-duplication reset to Not Started. Preserve old task values and `.pmp` data. New Tentative-containing saves require a v1.5 reader and raise an older manifest minimum-runtime value to the candidate version; files using old statuses retain their original minimum. No technical schema/format conversion.
- Shared measured popup positioning: directly below the field, or directly above using its actual content height; recalculate after content/scroll/resize and use the top layer to escape tables/modals/sticky content. Apply to Gantt warnings too, without altering warning messages/calculations.
- All table controls share a vertical centreline, rows grow for pills without clipping, and Tasks Dependencies is a single-line heading with adequate date/progress/control widths. Keep creation panel keyboard/validation/dirty-dismiss/success behaviour; compact creation/Edit Project spacing and scroll only panel content with accessible header/footer.
- Gantt task bars use six muted status colours; an always-complete single-line bar legend sits above date navigation. Task Status multi-select combines with search/Hide Empty Streams and clears together, without modifying data. Hide Empty Streams counts status-filtered Tasks and existing Milestones; preserve grouping/dated and undated population rules.
- Tube Map uses existing milestone colours in a single-line diamond legend above date navigation and a multi-status filter. Status filtering precedes lane population and combines with search/Hide Empty Streams; Clear all restores unrestricted statuses. Remove extra footer scroll space, preserving the last lane, sticky axis and navigation.
- Risk Matrix is one expanded-by-default section, with accessible Risk Matrix chevron toggle and session-only remembered state. Context relationship headings and equal-height selectors align across Risk/Decision editors; Decision Streams/Milestones/Tasks/Risks share one desktop line, with existing Project-wide exclusivity. Overview Quick Actions sizes to content independently of Timeline.
- These controls are presentation/transient state except the explicitly selected Task status. Keep the confirmed search centre, timeline dates/navigation, canonical command history and local-first project-file boundaries. No merge/tag/release/deploy/publish authorised.

## Approved Create Task alignment correction — 26 October 2026

Align adjacent fields and control boxes in the Create Task panel, including predictive selectors, Scope and Predecessor tasks beside Progress. Apply the correction to the shared task creation panel in standalone Tasks and Extended Gantt equally. Preserve panel size/location, field order, existing Scope pill styling, validation/error space and editing behavior. This targeted correction supersedes exact preservation of the prior misaligned creation-control geometry.

## Approved Extended Tasks table correction — 26 October 2026

Extended Tasks must use the existing standalone Tasks header colors with continuous header backgrounds/spacing. Each task occupies one horizontal table row rather than wrapping its fields into labelled cards; all boxes/text align vertically. Retain every field/action and the approved creation panel. This supersedes the earlier multi-line Extended task-card layout; standalone Tasks remains unchanged.

Owner clarification: keep all Extended task columns visible without horizontal scrolling at narrow desktop widths; adapt column/control spacing rather than wrapping fields into multiple rows.

## Approved Gantt toolbar alignment correction — 26 October 2026

Gantt's title, Search, Simple/Extended, Expand All, Collapse All and Zoom must occupy a single vertically centered toolbar line. Extended Tasks likewise keeps its title, Search, Show Deleted and Add Task on a single vertically centered line. Follow the other pages' existing toolbar styling; retain centered Search and all actions. Adapt control/search widths as necessary at narrow desktop sizes instead of wrapping these two toolbars. Other standalone page toolbars remain unchanged. This supersedes the earlier second-search-row fallback for Gantt/embedded Tasks only.

## Approved Baselines mockup alignment — 26 October 2026

The owner approved the Baselines proposal for implementation, with later enhancement deferred. Replace responsive comparison cards with a continuous nine-column table and single-line, vertically aligned rows. Preserve the existing centered toolbar, sidebar/header, baseline selector/list and Create/Rename/Delete behavior, filtering/sorting, historical/current stream names, immutable snapshots and PMP persistence. Compact the management list and align its actions. Retain actual application labels/tokens and DD/MM/YYYY dates over incidental generated-image differences; long names remain accessible through full-text titles while fitting the viewport. No new trend/scheduling features or release actions are authorized.

## Native desktop acceptance correction — 26 October 2026

Owner Mac screenshots reject fragmented column headings and card-style rows on ordinary desktop record pages (including People, Streams and Risk Log). Restore continuous table headers aligned to body columns and vertically aligned field controls on desktop-width workspaces; reserve card fallback for genuinely narrow content only. Preserve fields/actions, existing sorting/filtering and no horizontal overflow. The left sidebar must never scroll: retain every page name/order/icon and collapse behavior, adapting navigation row spacing to viewport height so File Information remains visible. Do not hide overflowed navigation entries or remove pages to suppress a scrollbar.

## Approved compact rhythm, warnings and Dependencies correction — 26 October 2026

Reduce excess lower whitespace in record rows while retaining room above ID/name controls. Align text, fields and buttons to a common control band; allow scope-pill fields to grow naturally when pills wrap. Reduce table heading-band height. Use existing font/spacing tokens on Dependencies and compact its content without changing canonical dependency behavior or warning calculations. Replace the separate Warnings Open button with keyboard-accessible clickable warning content that navigates to the same owning module and targeted entity for correction; preserve separately confirmed corrective actions. Gantt Search must match other pages' search size and horizontal position, preserving all actions and the fixed non-scrolling sidebar.

The latest Gantt Search size/position correction uses the standard shared 340px Search and the same narrow-window second-row fallback as other pages. Ordinary desktop widths keep the single-line toolbar. This resolves the previous narrow compact Search-width exception in favor of the explicitly requested consistency.

## Approved shared field text position — 26 October 2026

All boxed editable fields must reuse shared internal text metrics across pages: consistent font family/weight, line height, horizontal text inset and vertically centered single-line text. Inputs, native selects, dates and disclosure/predictive selectors must align their text, not only their outer borders. Preserve established regular/creation/embedded control heights through shared size variables; wrapping scope pills and multiline text remain supported. Keep native disclosure affordances and all editing/popup semantics.

## Approved Gantt surface and viewport correction — 26 October 2026

Gantt mode/expand/collapse/zoom controls must use ordinary page action font/height tokens rather than special tiny desktop fonts. Keep Search centered at its shared width; if standard controls cannot fit, use additional toolbar space instead of reducing typography or clipping actions. Comparison controls use the compact shared secondary-control rhythm, vertically centered field text and aligned labels/checkboxes. Dropdown search inputs throughout the app must visibly look editable even when unfocused.

Render baseline schedules as noticeable grey comparison bars with dashed outlines, with red delayed-finish segments following the approved mockup reference, retaining status-colored current bars, variance labels, immutable snapshot calculations and toggle semantics. Maximize the chart's available viewport space and dock its legend/date footer to the bottom of the Simple workspace or upper Extended pane. Extended Tasks must occupy all remaining space to the viewport bottom, preserve scrolling/resizing and standalone behavior, fully show Add Task/focus outline, and align its heading/selection controls and table header checkbox. Preserve all prior shell/file boundaries; no merge/deploy/release.
