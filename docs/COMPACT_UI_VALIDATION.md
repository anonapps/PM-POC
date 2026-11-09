# Compact dialogs and baseline management

Approved scope implemented on `feature/compact-dialogs-baseline-manager` from main `ed30f02`.

## Changes and audit

- `features/shared/dialog-surfaces.css` and `app/viewport.css`: reuse existing 30px action/embedded-field tokens, compact dialog padding/gaps, responsive viewport bounds, compact popup search/buttons and square icon controls. Shared Dialog consumers include project details, file-switch confirmations, entity creation/discard, dependency editing and baseline CRUD. Existing creation drawer footprint, scrolling and focus code remain intact; chart quick editors already use compact controls and are preserved.
- `features/baselines/baselines.tsx` and `baseline-surfaces.css`: baseline manager uses 64px rows, aligned name/timestamp, description and actions columns, a sticky compact header, bounded list scrolling and footer actions. Selection remains a button with `aria-pressed`. Existing HeroUI tooltips expose full names/descriptions on hover/focus above dialogs. Rename/delete use 30px square SVG buttons retaining accessible action names and confirmations. Create/Rename use a 440px maximum form width. Comparison cells remove only the separately rendered type and its redundant tooltip suffix.
- `features/decisions/decisions.tsx`: the title cell has an explicit styling hook. Its input fills the existing column with 12px right padding; column sizing and row heights are untouched.
- `e2e/layout/v16.spec.ts`: adds three regression cases covering empty/short/long descriptions, 24 equal-height baseline rows, internal scrolling, footer visibility, hover/focus content, icon dimensions, required-name validation/cancel, Decision title width and representative Risk/Project Details/File Information workflows.
- Product requirements, architecture and implementation notes record the approved presentation changes.

The row-action audit found existing text actions (Context, Duplicate, Delete, Restore and dependency editing) already use compact page-button sizing. Those labels and commands remain intact. No comment subsystem exists in this repository. Existing navigation/header/search positioning, business commands, schedule calculations and file serialization are unchanged; no dependencies were added.

## Validation

Initial focused browser validation: `CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/v16.spec.ts --grep 'compact baseline manager|Decision title fills'`: **3 passed**, 8.6s browser / 9.23s harness. Subsequent tooltip-layer verification is included in PR validation below.

`CHROME_PATH=/usr/bin/chromium npm run validate:pr` passed:

| Stage | Result | Elapsed |
| --- | --- | --- |
| Unit | 61 files / 520 tests passed | 24.37s |
| TypeScript | Passed | 6.58s |
| Lint | Passed, zero warnings | 8.28s |
| Production build | Passed | 20.61s |
| Full lifecycle | 245 checkpoints passed, zero failed | 120.55s |
| Browser layouts/journeys | 157 tests passed, including three new cases | 365.55s |

Detailed logs and machine-readable counts: ignored `work/validation-2026-11-09T21-28-41.496Z/`. No automated checks failed. Visual inspection then identified inherited card borders/gaps and flex centering that clipped the beginning of extremely long tooltip text. The final baseline-only CSS removes card spacing, caps manager height at 520px, and uses a scrolling block for tooltip content. The production build and affected `v16.spec.ts` cases were rerun after that correction; results are recorded below. Shared application logic and controls were unchanged after the comprehensive run.

Final baseline-only correction verification:

- `npm run build`: passed (including token consistency and TypeScript).
- `CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/v16.spec.ts`: **10 passed**, 20.4s browser / 20.87s harness; includes baseline create/select/rename/delete/cancel/undo/save/reopen, dependency validation, comparison viewports, long text and the Decision/Project Details check.
- Logs: ignored `work/validation-2026-11-09T21-38-39.374Z/`, `work/compact-final-build.log`.
- Inspected 1024×600 and 1440×900 manager screenshots; fixed row heights, single-line ellipses, readable tooltips above the modal, compact actions and visible footer. No remaining automated failures.
- React review: native semantic controls and existing commands retained, focusable full descriptions, labelled icon buttons, stable list keys, no new effects or persistence state.

## Limits

Browser evidence uses Linux Chromium with deterministic `.pmp` fixtures and the repository's in-memory file picker. It does not establish native Windows/macOS file-picker or physical-disk behavior. This repository exposes project preferences in Project Details and File Information rather than a separate Settings navigation entry; those existing surfaces are checked. Manual visual acceptance remains with the reviewer. No merge, release or deployment is performed.
