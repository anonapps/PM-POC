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
