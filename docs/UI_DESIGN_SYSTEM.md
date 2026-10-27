# v1.3.0 — UI design system

> **Current standardization work:** This document records the historical v1.3/v1.4 design-system baseline. Later approved requirements take precedence. The documentation-only [Stage 1 proposal](UI_STANDARD_PROPOSAL.md), [current-state audit](UI_STANDARD_AUDIT.md) and [migration plan](UI_STANDARD_MIGRATION_PLAN.md) distinguish preserved behavior from unapproved normalization candidates. They do not change the running UI.

## ARGOS PM v1.4.0 design-system update

The v1.3 design-system baseline is retained below as historical context. v1.4 standardises compact page headings, buttons, control alignment, row heights and muted Scope pills, and updates sidebar icons and ordering. The People page control/pill height is the reference for other pages. Risk severity pills match the 3×3 matrix; deleted People use a distinct light-orange state. Gantt and Tube Map preserve their horizontal navigation, sticky headers and quick-edit interactions. See `V1.4_APPROVED_ENHANCEMENTS.md` for the approved v1.4 scope.


This experiment is based on main, separate from the HeroUI experiment. It adds no dependencies or external fonts and preserves local .pmp persistence and inline editing.

`src/app/design-system.css` owns the shared palette, six text sizes, 4px spacing scale, control sizing and shell layout. `globals.css` retains module-specific planning geometry. Core palette values use shared tokens. Superseded toolbar masks and fixed sticky offsets have been removed rather than layered with new masks.

The shell uses a content-sized header (56px minimum) and a Grid remainder for the workspace. A ResizeObserver measures the current module toolbar and sets the session-only `--module-toolbar-height` on the workspace. Table headers and the Tube Map axis share this offset, including when toolbar controls wrap. Operational modules use available width; Overview remains bounded.

Controls use 36px minimum height. Module heading, body and metadata sizes are 20px, 14px and 12px respectively. Buttons have hover, active, focus and disabled states; save status remains visible at narrow widths. All sidebar items have visible compact glyphs and accessible names. Dialog titles use unique IDs and Tab from initial container focus enters the focus loop. Milestone IDs and duplicate warnings remain in normal cell flow.

This is one comfortable baseline, not a new density setting. No data schema or project-file changes are made. Open Project and Close remain directly available in the header during this first iteration.

## Validation

Run npm run typecheck, npm run lint, npm test, npm run build and npm run test:lifecycle. Browser checks must include 1440px and 1080px desktops, toolbar wrapping, long titles, sticky tables and Tube Map labels after scrolling, open selectors and dialog Tab/Shift+Tab/Escape. Smaller viewport checks are defensive regressions; mobile support remains outside the product scope.

Do not claim full WCAG conformance from token colours alone. Native OS file pickers and Windows/macOS launcher verification require their target platforms.

The acceptance harness also runs `e2e/ui-design-system.mjs`: it asserts measured toolbar/table offsets and sticky Tube Map axis geometry at 1440, 1080, 768 and 375px, visible save feedback/navigation and dialog Tab/Shift+Tab containment. Set `UI_SCREENSHOT_PATH` to capture the desktop Overview for visual review.

## Recorded validation

- TypeScript and ESLint passed.
- All 27 unit-test files / 140 tests passed, including creation/save/Save As version metadata coverage.
- Production build passed.
- Full browser lifecycle passed: 30 additional records created through each of six module forms, with all 60 records per module verified after reopen.
- Regression browser run passed the new four-viewport geometry and dialog keyboard checks with no browser runtime errors.

The first pass leaves Open Project and Close directly visible. It does not replace all module CSS, introduce HeroUI, redesign inline editing or certify WCAG compliance.

Visual review also identified the legacy `.collapse` sidebar button class conflicting with Tailwind’s visibility utility. It is renamed `.sidebar-toggle`, with a browser visibility assertion.

## Release versioning

Package and lockfile version: 1.3.0. Launcher, File Information and project-file writer metadata use the same package-derived APP_VERSION. Schema version remains 2; the existing project minimumAppVersion is retained as the file compatibility floor, so this presentation release does not require a schema migration.
