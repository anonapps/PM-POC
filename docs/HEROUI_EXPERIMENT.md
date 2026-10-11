# HeroUI UI experiment

User-approved branch: `experiment/heroui-ui` (11 October 2026).

This first comparison pass uses real HeroUI v2 Button and Chip components in the shared shell, with a root provider and Tailwind theme plugin. HeroUI 2.7.11 preserves the existing Tailwind 3.4 stack. Package assets are bundled locally; there is no CDN, remote font, account, or service requirement.

## Scope

- Navigation, header actions, save indicator and shared status badges.
- Refined dark navigation, selected state, rounded Overview cards and KPI tiles, tables, empty states and dialog surfaces.
- Animations disabled for a stable operational UI.
- Existing entity forms, dialog lifecycle, validation, keyboard handlers, timeline coordinates and persistence commands retained.
- No schema or app compatibility version change.

This is an incremental experiment, not a complete conversion of every form or table to HeroUI. Gantt and Tube Map remain custom views over canonical project data.

## Try it locally

```sh
git fetch origin
git switch experiment/heroui-ui
npm ci
npm run dev
```

Open http://localhost:3000. Use a disposable copy of a `.pmp` file for the comparison because edits still use the existing autosave behaviour.

Compare Overview, all operational modules, sidebar hide/restore, Search, Undo/Redo, File Information Save As, long names, crowded records, dialog stacking, and planning headers across scrolling/year boundaries.

## Isolation

The explicit user request supersedes the main-only branch policy for this experiment only. Do not merge into main or deploy to production without a separate instruction. Switch back to main to return to the current baseline. CI validation also runs on pushes to the experiment branch.

## Dependency audit limitation

`npm audit --omit=dev` reports seven advisories in the Tailwind 3 toolchain (braces/micromatch and postcss-selector-parser chains). HeroUI's theme peer makes this toolchain visible in the production dependency audit. The suggested automated fix upgrades Tailwind to v4, which requires a separate UI migration. For this experiment branch only the audit is informational; main retains its blocking audit policy. Resolve the toolchain migration before production promotion.

## Validation of the initial pass

- Lint and TypeScript passed.
- 27 test files / 139 unit and regression tests passed.
- Production build passed.
- Extended Chromium acceptance passed, including 180-record module counts, save/reopen, Undo/Redo, dialog and selector interactions, Tube Map sticky weeks, and Gantt year geometry.
- Native OS file-picker consent remains a manual check; the browser suite uses its existing isolated file adapter.

## Sync with v1.3.0 main

Merged the v1.3.0 baseline while retaining HeroUI Button/Chip components and the root provider. Shared design tokens load before branch-specific HeroUI styles, now isolated in `src/app/heroui-experiment.css`. Measured toolbar offsets, dialog keyboard fixes, explicit action cells, sidebar-toggle visibility and package-derived version metadata are retained. Project schema and local file workflows remain unchanged.

Validation of this sync: 27 files / 140 tests, TypeScript, ESLint, production build and full Chromium lifecycle passed. All 60 records per module survived reopen; measured sticky geometry passed at 1440, 1080, 768 and 375px, and sidebar visibility and dialog keyboard checks passed with no browser runtime errors. Desktop Overview was visually reviewed. The documented seven audit advisories remain unchanged.

## Sidebar rail refinement

The sidebar now collapses to a 64px rail containing each module’s first letter. A small unfilled chevron points left to collapse and right to expand, with accessible labels and expanded state. The rail remains in the layout grid, preventing overlap with the current project header. Narrow viewports initially use the compact rail; users can expand it. Regression checks cover rail geometry, letters, navigation and expansion at desktop and mobile widths.

## Live selection lists

Streams, People, Tasks, Milestones, Risks and Decisions subscribe directly to the current project store. Selection options refresh on committed changes, including creation, renaming, deletion, restoration and undo/redo, without relying on a shell rerender. Browser regression creates a fresh stream, then verifies it is offered by milestone scope and task stream selectors after navigation.
