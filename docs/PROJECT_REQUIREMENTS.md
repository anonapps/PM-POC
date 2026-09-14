# Project Management POC — Authoritative Requirements

**Document status:** Approved baseline for implementation  
**Repository:** `anonapps/project-management-poc`  
**Purpose:** Authoritative product, behavioural, data-model and implementation requirements for the local-first Project Management POC.  
**Precedence:** If any other repository document conflicts with this file, this file takes precedence unless the user explicitly approves a change.

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
