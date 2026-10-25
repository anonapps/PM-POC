# ARGOS PM — Implementation Plan (v1.4.0)

## v1.5 implementation sequence (approved, not yet validated)

**Development branch:** `feature/v1.5-approved-enhancements`. `main` is release-only until explicit user approval. Detailed scope and acceptance criteria: [V1.5_APPROVED_ENHANCEMENTS.md](V1.5_APPROVED_ENHANCEMENTS.md).

1. Confirm v1.4 baseline, persistence compatibility and existing CI/test results.
2. Add shared inputs, predictive selectors, keyboard/focus behaviours, search/filter controls and notification primitives.
3. Update shell/sidebar, project forms, file actions, audit naming and last-saved metadata.
4. Integrate live search, filters and mandatory-only inline creation into the eight approved modules.
5. Update Decision Log, scope pills, Gantt hierarchy, shared Today marker and chart-specific empty-stream filtering.
6. Update user/technical documentation, illustrated UI manual and release assets; assess whether product demo requires new footage.
7. Run unit/integration, Chrome regression/lifecycle, .pmp compatibility, build, lint, typecheck, audit and manual UI checks; prepare PR but do not merge until approval.

**Important:** Regression tooling is Vitest plus a custom Chrome DevTools Protocol browser harness, supplemented by user-requested Playwright layout checks for the 24 October Search/Filter remediation. Existing v1.4 manual acceptance gaps and development dependency findings remain tracked until independently validated.


**Status:** Approved implementation sequence  
**Inputs:** `PROJECT_REQUIREMENTS.md` and `ARCHITECTURE.md`  
**Method:** Incremental blocks with validation and commits after each completed block.

## v1.4.0 delivery record

The approved v1.4 phases (UI foundations, Gantt/Tube Map editing, People/progress preferences and optional audit history) were integrated via PR #9, merged as `22f68a7`. Both release-branch CI workflows passed on `32093a9`. Detailed scope: `V1.4_APPROVED_ENHANCEMENTS.md`. Evidence and remaining manual visual acceptance: `V1.4_ACCEPTANCE_REVIEW.md`. The 30-second video captured on v1.3.0 remains historical; the v1.4 recording brief is `V1.4_DEMO_PRODUCTION.md`.

The Blocks 0–20 below describe the original implementation sequence, not uncompleted v1.4 release work.

## Operating Rules for Codex

Before every implementation block, read `AGENTS.md`, `docs/PROJECT_REQUIREMENTS.md`, this plan, and the relevant parts of `docs/ARCHITECTURE.md`.

Do not attempt the entire application in one task. Work only on the requested/current block. Inspect existing code first, preserve working behaviour, and avoid unrelated refactors.

A block is complete only when its scoped implementation is coherent, relevant tests/type checks/linting pass, and documentation is updated where a material architectural decision was made.

Use conventional commit messages. Generate fixtures, temporary files, test projects and other development artefacts when useful. Do not add cloud infrastructure or services.

---

## Block 0 — Environment and Repository Foundation

### Goal
Create a clean, reproducible local development foundation.

### Scope

- Inspect repository and available environment.
- Establish TypeScript/React/Next.js/Tailwind baseline unless an existing compatible foundation already exists.
- Configure linting, type checking and tests.
- Create logical source folders consistent with architecture.
- Add scripts for development, validation and tests.
- Establish shared formatting/conventions without overengineering.
- Ensure no cloud/runtime dependency is introduced.
- Add a concise README with local development instructions.

### Exit criteria

- App can start locally.
- Minimal shell renders.
- Type check and lint pass.
- Test runner works with at least one smoke test.
- Repository has no unnecessary generated/build artefacts committed.

Suggested commit: `chore: establish project foundation`

---

## Block 1 — Domain Model Foundation

### Goal
Implement platform-independent project entities and core invariants.

### Scope

- Project, Stream, Person, Task, Milestone, Risk, RiskAction, Decision.
- Internal IDs and human-readable project-local IDs.
- Fixed enums/statuses/priority values.
- Project-wide vs entity associations.
- Task hierarchy constraints (maximum four levels).
- Generic relationship/dependency primitives.
- Soft-delete state.
- Pure validation helpers.

### Tests

- Identifier generation/non-reuse.
- Required fields.
- hierarchy depth.
- dependency cycle prevention.
- entity construction/validation.

Suggested commit: `feat: add core project domain model`

---

## Block 2 — Application State and Command Architecture

### Goal
Create the mutation/state boundary used by every module.

### Scope

- Canonical in-memory ProjectState.
- Command execution model.
- Undo/Redo global history.
- Dirty/saved baseline semantics.
- Atomic commands for duplicate/delete/restore.
- Derived selectors foundation.
- Immediate recalculation hooks for derived data/warnings.

### Exit criteria

- Mutations do not depend on React components.
- Undo/Redo behaves across entity types.
- Autosave is not yet required, but state exposes correct dirty semantics.

Suggested commit: `feat: add project state and command history`

---

## Block 3 — `.pmp` Format

### Goal
Define and validate the portable project container.

### Scope

- Manifest.
- Project/schema/config payloads.
- Version metadata.
- Compression/container codec.
- Strict schema validation.
- Security limits and unsafe-entry rejection.
- Representative valid and malicious/invalid fixtures.
- Compatibility decision logic.
- Migration interface and at least testable baseline migration plumbing.

### Exit criteria

- Project state round-trips without loss.
- Invalid/malicious fixtures are rejected safely.
- Unsupported versions produce deterministic compatibility results.

Suggested commit: `feat: implement pmp project format`

---

## Block 4 — Project File Service

### Goal
Isolate all project-file interaction behind a platform abstraction.

### Scope

- ProjectFileService interface.
- Browser adapter for supported file access.
- Create/Open/Save/Save As/Reload/Inspect.
- Save result/error model.
- Active file handle semantics.
- External modification detection where feasible.
- Unsupported capability handling.

### Tests

Use adapter mocks/fakes for deterministic application tests.

Suggested commit: `feat: add project file service`

---

## Block 5 — Launcher and Local Runtime

### Goal
Provide the zero-install POC entry experience.

### Scope

- Lightweight Project Manager Launcher.
- New Project and Open Project only.
- Local runtime lifecycle.
- Automatically open supported Chrome desktop flow where platform permits.
- Launcher hidden/minimised while project open and restored on project close.
- Direct browser development/testing entry point.
- No recent-project registry/background service.

Suggested commit: `feat: add local project launcher`

---

## Block 6 — Core UI Shell

### Goal
Build the reusable desktop application frame.

### Scope

- Persistent left sidebar.
- Header with save status and global search placeholder.
- Module routing/navigation.
- Reusable panels/modals/forms/tables/status components.
- Responsive desktop layout.
- keyboard shortcut infrastructure.
- Help/About shell.
- File Information view foundation.

Suggested commit: `feat: build application shell`

---

## Block 7 — Project Creation and Overview

### Goal
Make a newly created project usable and establish the dashboard.

### Scope

- New Project form and validation.
- Project Details modal/panel.
- Overview header and project metadata.
- Manual Project Progress.
- Data-driven onboarding checklist: Project, Streams, People, Milestones.
- Adaptive Quick Actions.
- KPI/summary foundations.
- High-level timeline foundation.
- empty states.

### Behaviour

Overview must react immediately to canonical state changes.

Suggested commit: `feat: add project creation and overview`

---

## Block 8 — Streams and People

### Goal
Implement the first operational project structure modules.

### Scope

- Stream CRUD/editing and details.
- Stream owner/status/dates/priority.
- People lightweight module.
- Ownership selection.
- Person deletion/reassignment behaviour.
- Show Deleted/restore.
- Stream progress calculation from leaf tasks (ready for Task integration).
- Overview Stream Status Summary integration.

Suggested commit: `feat: add streams and people modules`

---

## Block 9 — Tasks

### Goal
Implement detailed work management.

### Scope

- Task module/list/detail/editing.
- Stream or explicit Project-wide scope.
- Four-level hierarchy.
- Leaf progress/manual status.
- Parent derived progress/status/dates/completion.
- Actual completion behaviour.
- milestone association.
- dependencies and cycle prevention.
- overdue indicator.
- duplication rules.
- soft deletion and supported bulk deletion.
- active-task Overview KPI/filter navigation.

Suggested commit: `feat: add task management`

---

## Block 10 — Milestones

### Goal
Implement the shared milestone entity before visual roadmap modules.

### Scope

- Milestone module/detail/editing.
- Date/status/owner/priority.
- zero/one/multiple streams or explicit Project-wide scope.
- related tasks.
- milestone dependencies.
- actual completion/reopen behaviour.
- duplication/deletion/restore.
- Overview Upcoming/Delayed Milestones.
- timeline markers.

Suggested commit: `feat: add milestone management`

---

## Block 11 — Gantt

### Goal
Provide detailed planning/execution visualisation over canonical entities.

### Scope

- Project → Stream → Tasks hierarchy.
- Project-level milestones.
- Day/Week/Month/Quarter zoom; Week default.
- dated and unscheduled tasks.
- dependency arrows.
- cross-stream dependencies.
- project-wide task section.
- create/edit tasks and milestones.
- date/progress editing and movement.
- detailed panel integration.

### Constraint

Gantt must not maintain a separate project model.

Suggested commit: `feat: add interactive gantt view`

---

## Block 12 — Tube Map

### Goal
Provide high-level roadmap visualisation.

### Scope

- Streams as lines.
- Milestones as stations.
- milestone dependencies only.
- week-based axis with week-number/date display options.
- proportional exact-date placement within week.
- shared multi-stream stations.
- project-wide milestones crossing all streams.
- milestone create/edit/drag/stream association changes.
- dependency creation/management.
- detail navigation/highlighting.

### Constraint

No Tasks in Tube Map.

Suggested commit: `feat: add tube map roadmap`

---

## Block 13 — Risks

### Goal
Implement operational risk management.

### Scope

- Risk table and detail/editing.
- Status/Probability/Impact/Risk Level.
- configured 3×3 risk matrix mapping.
- ownership and flexible project/stream/entity relationships.
- multiple Risk Actions.
- action overdue indicators.
- filters/sorting.
- interactive matrix.
- duplication including open copies of actions.
- deletion/restore/bulk deletion.
- Overview Open/High Risks and matrix integration.

Suggested commit: `feat: add risk management`

---

## Block 14 — Decisions

### Goal
Implement lightweight Decision Log.

### Scope

- Decision ID/title/description/date/owner.
- relationships to Streams, Tasks, Milestones, Risks and Project-wide context.
- inline simple editing where appropriate.
- duplication with current date.
- deletion/restore/bulk deletion.

Suggested commit: `feat: add decision log`

---

## Block 15 — Project Warnings

### Goal
Implement the complete initial warning engine and UI.

### Scope

- Date-based warning rules defined by requirements.
- Immediate recalculation and load recalculation.
- Overview global indicator.
- full flat warning panel.
- type/entity filters.
- related-date ordering.
- direct contextual navigation.
- affected-entity indicators.

### Constraint

Warnings are derived and never persisted.

Suggested commit: `feat: add project warning engine`

---

## Block 16 — Search and Cross-Module Navigation

### Goal
Complete global discovery/navigation behaviour.

### Scope

- Ctrl/Cmd+K.
- search by ID and name/title.
- results grouped by entity/module.
- Quick View first.
- Include Deleted toggle.
- Restore deleted entities from appropriate result flow.
- target module session-state preservation.
- detail-panel navigation and return-to-context behaviour.

Suggested commit: `feat: add global search and contextual navigation`

---

## Block 17 — Persistence and Recovery Hardening

### Goal
Complete production-like local persistence behaviour for the POC.

### Scope

- 60-second autosave.
- immediate save on close/switch when dirty.
- `Saved · HH:MM` header state.
- delayed `Saving…` indicator.
- persistent save-failure warning.
- Retry/Save Now/Save As.
- repeated-failure Save As offer.
- overwrite confirmation.
- file-access loss handling.
- external modification Keep Current/Reload flows.
- project switching failure/discard flows.
- crash behaviour limited to last successful save.

Suggested commit: `feat: harden local project persistence`

---

## Block 18 — Security Hardening

### Goal
Audit the local trust boundary before finalisation.

### Scope

- `.pmp` malformed/untrusted input audit.
- traversal/archive bomb/resource exhaustion protections.
- schema bounds.
- external resource/code execution audit.
- dependency/package vulnerability review.
- local path/error disclosure review.
- confirm offline operation.

Do not add network security infrastructure that the offline POC does not need.

Suggested commit: `security: harden pmp file handling`

---

## Block 19 — Accessibility and UX Polish

### Goal
Bring the implemented product to a coherent final POC experience.

### Scope

- keyboard operation.
- focus management.
- semantic controls/labels.
- responsive desktop layouts.
- empty/error/loading states.
- consistent terminology/status presentation.
- contextual inline vs full-detail editing.
- Help/About and Keyboard Shortcuts content.
- visual density/consistency review.

Suggested commit: `fix: polish accessibility and user experience`

---

## Block 20 — Final QA

### Goal
Validate the complete POC against the authoritative requirements.

### Scope

- Full requirements trace-through.
- unit/integration/E2E suite.
- create/save/close/reopen project.
- Save As.
- invalid/corrupt/unsupported `.pmp` cases.
- task hierarchy and calculations.
- soft deletion/restore.
- duplication.
- Gantt/Tube Map consistency.
- Risk/Decision flows.
- warnings/search/navigation.
- autosave/failure/external-modification scenarios.
- Windows/macOS launcher/runtime checks where environments are available.
- documentation audit.

### Final output

Codex should report:

- implemented scope;
- test/validation results;
- known limitations;
- any requirements not implemented, with explicit reasons;
- commands required to run the POC;
- final repository state/commit.

Suggested commit: `test: complete poc acceptance validation`

---

## Cross-Block Acceptance Rules

Every block must preserve these rules:

- no cloud dependency;
- no alternate project database/source of truth;
- no direct component filesystem access;
- no silent destructive migration;
- no false saved state;
- no reuse of deleted human-readable IDs;
- no hard deletion where soft deletion is required;
- no duplicated Gantt/Tube Map project data;
- no persisted Project Warnings;
- no automatic scheduling from dependencies;
- no functionality explicitly excluded from the POC unless separately approved.

## Change Control

When implementation reveals a requirement that is technically impossible or materially unsafe in the selected POC environment, Codex must not silently reinterpret it. Document the constraint, identify the smallest viable alternatives, and request a product decision before changing the authoritative requirement.


## Completed follow-up — Automated Regression Suite v2 (11 October 2026)

- Added a deterministic 180-record fixture: 30 each of Streams, People, Tasks, Milestones, Risks and Decisions.
- Added asserted status/owner and dependency/status pairs, all risk rating cells, four-level hierarchy/progress checks, domain lifecycle operations and complete `.pmp` equality on reopen.
- Extended Chrome acceptance with crowded module counts, Gantt/Tube Map, search and save/reopen checks.
- Added full form creation of 30 additional records per module; runs nightly, manually and when suite/package files change.
- Preserved the original smoke command and local/offline application architecture.

The initial validation passed 27 test files / 139 tests plus TypeScript, lint, build and both GitHub browser jobs. See [AUTOMATED_REGRESSION.md](AUTOMATED_REGRESSION.md) for current commands, scope and limitations.

## HeroUI experiment — initial comparison pass

Branch `experiment/heroui-ui` is explicitly approved for a presentation-only comparison: shared shell Buttons and Chips, theme/provider, and visual refinements. Validate against the existing regression suite before publishing the branch. Wider form/table conversion and promotion to main require subsequent review. See [HEROUI_EXPERIMENT.md](HEROUI_EXPERIMENT.md).

## Completed v1.3.1 promotion

The user approved HeroUI promotion after testing the compact sidebar rail and live Stream selections. The release includes direct entity-store subscriptions, chevron collapse/expand controls, package-derived v1.3.1 metadata and the HeroUI v2 / Tailwind 4 toolchain. The production audit remains blocking and reports zero vulnerabilities. No hosted runtime or project persistence change is introduced.
