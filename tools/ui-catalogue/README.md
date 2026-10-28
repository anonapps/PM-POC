# Internal UI catalogue

Run from the repository root:

```sh
npm run ui:catalogue
```

Open http://127.0.0.1:3100. This is a **separate local Next application**, outside production `src/app` and `public`. It reuses installed dependencies, production CSS in its existing order, Providers and real component exports. No new package, production route, navigation entry, project-file service or autosave runtime is added. The command binds to loopback. Stop it with Ctrl+C.

Examples hold local React state or a disposable deterministic application store. Refresh resets example records and local React state. Creating an example task affects memory only. Do not import `ProjectManager`, browser file services or runtime/autosave into this app. Native file access and project persistence stay unused. The real Risk Matrix disclosure uses session storage on this isolated catalogue origin; Reset restores example records/history and leaves that existing session preference intact.

## Current coverage

| Example | Existing asset / evidence |
| --- | --- |
| Actions | Real ActionButton primary/secondary/destructive/disabled facade in generic36–38px context; compact30px Search/footer contexts separately; inspect real hover/focus/press |
| Fields | HumanTextInput/Area; native text/date/number/select; regular36/creation34/embedded30 contexts; invalid/disabled/multiline |
| Choices | Real ChoiceRow native checkbox/radio composition; owner single-select, unavailable/deleted owner, relationship multi-select with selected deleted option and filter rows |
| Search | ModuleSearch portalled filter surface, clear/reset, local query and hide-dependency state |
| Indicators | ScopePill and complete task/milestone TimelineStatusLegend palettes |
| Relationships | DependencyConnectors + useDependencyFocus, single pin/preview/Escape and endpoint-only color example |
| Containers and creation | Actual Dialog and all six EntityCreationPanel kinds, identical Task entry points, real validation/dirty dismissal and successful creation in disposable stores |
| References | Actual Status, EmptyState, TodayMarker and anchored warning disclosure; native full-value title tooltip |
| Tables and editors | Real Tasks, Risk Log, Decision Log and Baselines modules; selection/indeterminate/sort, deleted values, context/actions, nine comparison columns and baseline manager/menu |
| Footers | Actual TimelineNavigation for both legends, real chart model ranges/increments, disabled Today, Gantt Zoom |
| Tokens | Canonical field/footer/status JSON, generated CSS and existing palette exports; other catalogue-only semantic alias prototypes |
| Full timelines | Actual Gantt Simple/Extended workspace and Tube Map with baselines, dependencies, filters, quick editors and disposable Reset |

This Stage2 catalogue now includes representative table/editor/menu compositions and every record creation kind. It is **not a production page migration or exhaustive verification of every possible state**. The real page examples expose inline validation/error slots, empty search results, deleted/restore behavior and populated menus for manual inspection. Full chart examples now provide context comparisons; native physical-platform appearance and any proposed visual normalization remain for review. Existing production acceptance suites remain the reference for those behaviors. No candidate font rounding, density reduction, palette merging or CSS cleanup has been applied.

The first field/footer/status token wave now uses [one shared source](../../src/ui/README.md), with generated CSS and unchanged TypeScript palette exports. Other aliases in `app/catalogue.css` remain an isolated naming prototype. Production compatibility styles still own unmigrated values; later extraction maps each consumer before changing ownership. The catalogue stylesheet owns sample layout only; do not use it to make a production asset look correct.

## Verification

```sh
CHROME_PATH=/usr/bin/chromium npx playwright test --config=tools/ui-catalogue/playwright.config.ts
npm run typecheck
npm run lint
npm run build
```

Catalogue Playwright uses a separate local server/profile and one worker. Geometry checks cover900/1440/1920, three field heights, equal footer heights and no document overflow. Interaction checks cover filtering/no-results, keyboard dismissal/focus return, human-text blur, exclusive relationship pin/hide/reset, creation validation/dirty dismissal and modal focus return. Added checks cover successful creation/reset for all six kinds, real table selection/indeterminate/sorting/edit reset, Risk/Decision contexts, Baselines management/all nine sortable headers, and warning disclosure/native-title attributes. File picker calls are trapped and counted; local/session storage stays empty in the selector scenario. These checks do not establish native physical Mac/Windows rendering or full application lifecycle coverage.

After the root production build, inspect `.next/server/app-paths-manifest.json`: there must be no catalogue route. Root source must not import `tools/ui-catalogue`. Existing successful application behavior suites do not need repeating solely for catalogue/docs changes; run relevant suites when production consumers migrate. Full `validate:pr` remains mandatory before making the draft PR ready.

See [component contracts](../../docs/UI_COMPONENT_CONTRACTS.md), [proposal](../../docs/UI_STANDARD_PROPOSAL.md) and [migration plan](../../docs/UI_STANDARD_MIGRATION_PLAN.md).

## Review before migration

Compare Fields, Creation, Records and Footers at supported desktop widths. In Records, switch among Tasks, Risk Log, Decision Log and Baselines; open Context/Actions and baseline management. Reset restores deterministic records, identifier sequences and memory history. These are existing assets, so observed differences are evidence for the standard, not silently corrected variants.

The compatibility-preserving path needs no new visual decisions. Reducing36/34/30 to two sizes, rounding fonts or merging palettes still requires an explicit choice after visual comparison. Native OS tooltip/calendar styling and physical Mac/Windows acceptance remain manual.

Timeline fixtures cover late October/early November2026. Full charts retain the real browser clock; automated cases fix the browser clock for reproducible visible relationships. Cross-page navigation requests are shown locally rather than opening production routes.

The first shared composition adopters are now real production consumers: `ActionButton` in Search/timeline controls and `FormField`/`FieldMessage` in project/record forms. Catalogue action examples use the facade; creation specimens use the shared field composition. See [usage guidance](../../src/ui/README.md).

Full timeline previews mount on the client to keep browser measurements and fixed test clocks independent of the server date. Production chart rendering is unchanged. The timeline case asserts that no browser page errors occurred, including hydration errors.
