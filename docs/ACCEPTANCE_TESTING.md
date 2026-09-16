# Acceptance Testing

## Purpose

The automated acceptance harness protects the completed Blocks 0–20 baseline without adding a browser-testing dependency to the application. It uses Node.js plus Chrome/Chromium's DevTools Protocol and runs entirely against the local application.

Run:

```bash
npm ci
npm run test:e2e
```

The harness starts the Next.js development server unless `E2E_BASE_URL` is supplied, launches an isolated headless Chrome profile, and exits non-zero on the first failed acceptance assertion. Set `CHROME_PATH` if Chrome is installed in a non-standard location. `E2E_DEBUG_PORT` can override the default DevTools port 9222.

## Automated coverage

The suite verifies:

- launcher rendering and New Project flow;
- local `.pmp` creation through a deterministic in-memory File System Access API test double;
- navigation/rendering of all 12 modules;
- People and Streams creation plus stream ownership;
- stream-scoped Task creation;
- Milestone, Risk and Decision creation;
- Overview, Gantt and Tube Map reflection of created data;
- Search -> Quick View -> owning-module navigation and entity focus;
- derived Project Warning creation and contextual navigation;
- Undo and Redo;
- Save Now;
- Close -> Open Project persistence round trip;
- soft deletion and restoration;
- semantic project navigation / `aria-current`;
- uncaught browser/runtime error collection.

The test data is intentionally deterministic and disposable. The test browser uses a temporary profile and an in-memory `.pmp` handle; it does not write a project file to the user's filesystem.

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
npm audit
npm run test:e2e
```

The established Blocks 0–20 baseline before introducing this harness was 21 test files / 91 tests, zero lint warnings, successful production build, zero audit vulnerabilities, clean `git diff --check`, and no prohibited local-storage/cloud/runtime-network patterns.

## Environment limitations

A runtime without Chrome/Chromium cannot execute `npm run test:e2e`. This is an environment limitation, not an application failure. The regular Vitest/typecheck/lint/build/audit gates remain executable in such environments.
