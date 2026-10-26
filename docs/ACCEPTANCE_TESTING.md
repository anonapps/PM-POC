# Acceptance Testing

## v1.4.0 acceptance status

The final ARGOS PM v1.4.0 feature-branch head `32093a9` passed both GitHub Actions validation workflows, including extended browser regression and the People Name blur-commit Undo/Redo scenario. Manual visual acceptance at varied viewport sizes, `.pmp` roundtrips for optional People fields/progress preferences, and 5,000-event audit viewer performance remain documented in `V1.4_ACCEPTANCE_REVIEW.md`. Do not confuse successful automated CI with completion of all manual acceptance criteria.


## Purpose

The automated acceptance harness protects the completed Blocks 0–20 baseline without adding a browser-testing dependency to the application. It uses Node.js plus Chrome/Chromium's DevTools Protocol and runs entirely against the local application.

Run:

```bash
npm ci
npm run test:regression
```

The harness starts the Next.js development server unless `E2E_BASE_URL` is supplied, launches an isolated headless Chrome profile, and exits non-zero on the first failed acceptance assertion. Set `CHROME_PATH` if Chrome is installed in a non-standard location. `E2E_DEBUG_PORT` can override the default DevTools port 9222.

`npm run test:e2e` shares the fixture-backed regression entry point. For the independent core smoke flow, run `node e2e/run-regression.mjs --scenario=core`. See [testing optimisation](TESTING_OPTIMISATION.md) for the four validation levels. `npm run test:lifecycle` adds 180 form-created records to the 180-record fixture. See [Automated regression suite v2](AUTOMATED_REGRESSION.md) for the coverage matrix and CI schedule. Browser commands require Node.js 22 or newer because the harness uses the built-in WebSocket client.

## Automated coverage

The suite verifies:

- launcher rendering and New Project flow;
- local `.pmp` creation through a deterministic in-memory File System Access API test double;
- navigation/rendering of all 12 modules;
- People and Streams creation plus stream ownership;
- stream-scoped Task creation;
- Milestone, Risk and Decision creation;
- Overview, Gantt and Tube Map reflection of created data;
- Gantt year-band geometry and alignment after paging forward;
- Tube Map 12-week label completeness, Monday-date axis, scroll retention and pagination;
- Search -> Quick View -> owning-module navigation and entity focus;
- derived Project Warning creation and contextual navigation;
- Undo and Redo;
- Save Now;
- Close -> Open Project persistence round trip;
- soft deletion and restoration;
- semantic project navigation / `aria-current`;
- uncaught browser/runtime error collection;
- loading a real codec-generated 180-record `.pmp` fixture;
- 30 records in each operational table, 31 Tube Map lanes and 12 week labels;
- large-project Gantt rendering and decision search;
- record counts in all six modules after save/close/reopen;
- in full mode, 30 additional form creations per module (360 records total).

The visual regression assertions use DOM geometry and content rather than screenshots, so they catch missing labels and grid misalignment without introducing snapshot dependencies. They are lightweight smoke checks, not a full cross-browser or multi-viewport visual comparison.

The test data is deterministic and disposable. The regression runner copies the committed, codec-generated fixture bytes to an OS temporary directory and removes it after the run. The unit round-trip test verifies those bytes against the deterministic generator. Browser persistence uses an in-memory `.pmp` handle and an isolated temporary profile. User project files are never accessed.

## Why the file picker is mocked

Native file-picker windows are browser/OS UI, outside the page DOM and Chrome DevTools Protocol. The harness therefore tests the application's complete persistence path using a File System Access API-compatible in-memory handle while leaving native picker consent as a small manual boundary test. This preserves the product rule that Chrome owns overwrite consent and the application must not add a competing overwrite dialog.

## Manual native-boundary checks

These checks remain manual because they specifically validate Chrome/macOS or Chrome/Windows UI rather than application DOM behaviour:

1. In Chrome, choose **New Project**, enter valid project data, choose **Choose File & Create**, and confirm the native Save dialog appears with a `.pmp` filename suggestion.
2. Cancel the native Save dialog and confirm the application remains safe and does not create/open a project.
3. Create the project, edit it, use **Save Now**, and confirm the same file is updated without an application-level overwrite prompt.
4. Use **Open Project**, cancel the native Open dialog, and confirm the current project/launcher state is preserved.
5. Close and reopen the saved `.pmp` and confirm the project data is restored.

## Regression gates

Before considering a change complete, run:

```bash
npm ci
npm test
npm run typecheck
npm run lint
npm run build
npm audit --omit=dev --audit-level=moderate
npm run test:regression
```

GitHub normal validation runs extended regression on pushes and pull requests to `main`, and on manual dispatch. Full lifecycle runs nightly at 03:00 UTC, on manual dispatch and when the regression harness, fixture, package manifests or lifecycle workflow change. The full development-dependency audit remains informational in normal validation.

## Environment limitations

A runtime without Chrome/Chromium cannot execute any of the three browser commands. This is an environment limitation, not an application failure. The regular Vitest/typecheck/lint/build/audit gates remain executable in such environments.
