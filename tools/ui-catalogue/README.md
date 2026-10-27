# Internal UI catalogue

Run from the repository root:

```sh
npm run ui:catalogue
```

Open http://127.0.0.1:3100. This is a **separate local Next application**, outside production `src/app` and `public`. It reuses installed dependencies, production CSS in its existing order, Providers and real component exports. No new package, production route, navigation entry, project-file service or autosave runtime is added. The command binds to loopback. Stop it with Ctrl+C.

Examples hold local React state or a disposable deterministic application store. Refresh resets all values. Creating an example task affects memory only. Do not import `ProjectManager`, browser file services or runtime/autosave into this app. Browser storage and native file access must stay unused.

## Current coverage

| Example | Existing asset / evidence |
| --- | --- |
| Actions | Generic36–38px primary/secondary/destructive/icon/disabled classes; compact30px Search/footer contexts separately; inspect real hover/focus/press |
| Fields | HumanTextInput/Area; native text/date/number/select; regular36/creation34/embedded30 contexts; invalid/disabled/multiline |
| Choices | Owner single-select, unavailable/deleted owner, relationship multi-select with a selected deleted option, native checkbox/radio |
| Search | ModuleSearch portalled filter surface, clear/reset, local query and hide-dependency state |
| Indicators | ScopePill and complete task/milestone TimelineStatusLegend palettes |
| Relationships | DependencyConnectors + useDependencyFocus, single pin/preview/Escape and endpoint-only color example |
| Containers | Actual Dialog and EntityCreationPanel, identical Task entry points, real validation/dirty dismissal in a memory store |
| Tables | FitTable direct header/cell structure; full header-title wrapper retained |
| Footers | Actual TimelineNavigation for both legends, real chart model ranges/increments, disabled Today, Gantt Zoom |
| Tokens | Existing status color exports and catalogue-only semantic compatibility aliases |

This is the Stage2 foundation, **not completion of every catalogue state or a page migration**. Remaining examples: full record table sort/bulk/indeterminate recipes, populated Risk/Decision editors, Baselines action menu, every creation kind, native tooltip/error slot variants and full page context comparisons. Existing production acceptance suites remain the reference for those behaviors. No candidate font rounding, density reduction, palette merging or CSS cleanup has been applied.

The aliases in `app/catalogue.css` are an isolated naming prototype. Production CSS remains the authority for current rendered values; component migration will move aliases into a shared source only after every consumer and value is mapped. The catalogue stylesheet owns sample layout only; do not use it to make a production asset look correct.

## Verification

```sh
CHROME_PATH=/usr/bin/chromium npx playwright test --config=tools/ui-catalogue/playwright.config.ts
npm run typecheck
npm run lint
npm run build
```

Catalogue Playwright uses a separate local server/profile and one worker. Geometry checks cover900/1440/1920, three field heights, equal footer heights and no document overflow. Interaction checks cover filtering/no-results, keyboard dismissal/focus return, human-text blur, exclusive relationship pin/hide/reset, creation validation/dirty dismissal and modal focus return. File picker calls are trapped and counted; local/session storage stays empty in the selector scenario. These checks do not establish native physical Mac/Windows rendering or full application lifecycle coverage.

After the root production build, inspect `.next/server/app-paths-manifest.json`: there must be no catalogue route. Root source must not import `tools/ui-catalogue`. Existing successful application behavior suites do not need repeating solely for catalogue/docs changes; run relevant suites when production consumers migrate. Full `validate:pr` remains mandatory before making the draft PR ready.

See [component contracts](../../docs/UI_COMPONENT_CONTRACTS.md), [proposal](../../docs/UI_STANDARD_PROPOSAL.md) and [migration plan](../../docs/UI_STANDARD_MIGRATION_PLAN.md).
