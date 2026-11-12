# Search result navigation

> Implementation/evidence record. The consolidated content is now integrated through [PR #34](https://github.com/anonapps/PM-POC/pull/34) (`9266a02`, 12 November 2026). Use the [v1.7 manual](V1.7_UI_REFERENCE.md) and [current UI guide](ARGOS_PM_UI_REFERENCE.md) for final labels and behavior, including the historical-marker fix. Branch instructions and measurements below retain their original scope/date; this is not a release/deployment record.

Branch `feature/search-result-navigation`, based on `main` at `ed30f02`.

Result titles are native buttons with hover and keyboard focus styles matching
Warnings. The separate Open details action is removed; deleted records retain
their existing Restore action. Result ordering remains entity type, stored ID,
then label, with the original six types followed by Baselines and Dependencies.

| Result | Existing destination and reveal |
| --- | --- |
| Person | People record row |
| Task | Tasks record row |
| Stream | Streams record row |
| Milestone | Milestones record row |
| Risk | Risk Log record row |
| Decision | Decision Log record row |
| Baseline | Matching entry in Manage baselines, without selecting a different comparison baseline |
| Dependency | Dependencies relationship row |

Nested Risk action text continues to match its owning Risk. There is no separate
Risk action page or invented baseline/dependency human-ID sequence.

Search and Warnings share a reveal hook on the shell's existing navigation
target. Owning pages temporarily include a filtered or deleted target, preserving
their query, filters and sorting. The hook focuses the record container rather
than an editable field, then scrolls vertical content scrollers only when needed,
accounting for sticky headings. Baseline management is revealed in its existing
dialog. Pointer interaction elsewhere, Escape or subsequent navigation clears
the temporary highlight; interaction within the target remains usable.

A transient, per-open-project context preserves Search query, entity/deleted
filters, activated-result focus and content scroll across return journeys.
Destination preferences, including Risk action disclosure, survive Search
journeys. Ordinary navigation between other modules keeps its established
resets. Embedded and standalone record preferences have separate scopes. Closing
or reopening a project starts a fresh context. None of these preferences is
written to `.pmp`, local storage or the filesystem.

No domain calculations, project dates, canonical commands, persistence schema,
dependencies or runtime services change. The application remains offline-capable.

## Changed files

- Search UI/index: `src/features/search/search-panel.tsx`, `search.ts`,
  `search.test.ts`; Search-only styles in `src/app/viewport-layout.css`.
- Shared targeting and session state:
  `src/features/shared/navigation-session.tsx`, `navigation-reveal.ts`,
  `use-navigation-reveal.ts`, `navigation-reveal.test.ts`, `record-filters.tsx`;
  integration in `src/features/shell/shell.tsx` and
  `src/app/project-manager.tsx`.
- Owning rows: `src/features/resources/resources.tsx` (People and Streams),
  `src/features/tasks/tasks.tsx`, `src/features/milestones/milestones.tsx`,
  `src/features/risks/risks.tsx`, `src/features/decisions/decisions.tsx`,
  `src/features/dependencies/dependencies.tsx`,
  `src/features/baselines/baselines.tsx`.
- Browser/legacy acceptance: `e2e/layout/search-navigation.spec.ts`,
  `e2e/acceptance.mjs`.
- Documentation: this note, `docs/PROJECT_REQUIREMENTS.md` and `docs/ARCHITECTURE.md`.

## Regression checks

Run focused checks after building:

```sh
npm run test:targeted -- unit src/features/search/search.test.ts src/features/shared/navigation-reveal.test.ts src/features/shell/shell.test.ts
npm run build
CHROME_PATH=/usr/bin/chromium npm run test:targeted -- layout e2e/layout/search-navigation.spec.ts --workers=1
```

Omit `CHROME_PATH` when using Playwright's installed browser. The browser fixture
opens a real serialized project with eight result types, a deleted record and a
legacy lowercase name. It covers Enter/Tab/focus indicators, exact row reveal,
return query/filter/order/scroll/focus, temporary hidden-record inclusion,
baseline selection preservation, Warnings reuse, normal navigation resets and
new-project session reset. Save/Undo remain disabled during navigation.

### Local results — 2 November 2026

Linux/Chromium, unchanged dependency lockfile:

| Check | Result | Elapsed |
| --- | --- | --- |
| Targeted Search/reveal/shell unit checks | 33 passed | 2.08s |
| Targeted Search browser checks, final CSS | 4 passed | 12.67s |
| `validate:pr` unit | 524 passed, 62 files | 30.72s |
| Typecheck / lint / build | All passed | 2.91s / 11.08s / 23.19s |
| Full lifecycle | 245 assertions passed, zero failures | 134.67s |
| Full browser suite | 158 passed | 450.74s |

Final gate logs: `work/validation-2026-11-02T14-38-44.258Z/`.
An earlier gate was stopped after review found a Search title CSS specificity
issue; the corrected code passed the focused browser checks and the complete
gate above. No native macOS UAT or actual GitHub PR check result is claimed for
this change. Ready for PR review, with native visual acceptance still pending.

Run `npm run validate:pr` for the existing complete PR gate. This includes all
unit tests, static checks, production build, full lifecycle and browser suites.
Local logs belong under ignored `work/`; local success does not establish actual
GitHub PR checks or native macOS manual acceptance.

For visual retesting, search each entity's ID/name, activate its title by mouse
and keyboard, and verify the exact highlighted record is visible. Return through
the Search sidebar item and verify the previous results and focus. Repeat with
destination query/status/deleted filters hiding the target and with the Baselines
manager initially closed; confirm preferences and comparison selection survive.
