# Global sidebar and floating toolbar

Presentation-only change from main `ed30f02`, on `feature/global-sidebar-floating-toolbar`.

The sidebar name uses canonical project state and occupies the unused left portion of the existing brand/toggle band. The brand, toggle and all navigation retain their previous geometry; the project name has an ellipsis and full-value title. The collapsed sidebar retains only the 4px status dot. Existing sidebar overflow clipping and viewport-dependent navigation metrics are unchanged.

The shared shell no longer renders a global header row. FloatingToolbar is absolutely positioned above the workspace; its 10px activation strip covers only its intrinsic top-right width. Hidden controls use visibility, aria-hidden and inert so the trigger keeps its width without creating a layout row or keyboard/pointer targets beneath it. Alt+Shift+T opens and focuses the toolbar; Tab reaches enabled actions; Escape returns focus to the prior control. Pointer reveal/dismiss delays are 300ms. Existing visible popups and selection suppress activation. Outside pointerdown closes without cancelling the event.

Save, Undo and Redo retain their handlers and disabled states. The diskette uses the shell's existing inline SVG convention; Undo/Redo retain their curved-arrow icons. No existing global Settings/Help actions are available, so none are invented. The sidebar and toolbar share the existing runtime save state, including autosave saving/failure states. Persistence, save timing, history and PMP format are unchanged. Gantt's available-height observer now observes only the workspace because the former header no longer exists.

The supplied sidebar mockup is a placement reference. Its enlarged typography, colors, navigation icon replacements and partial navigation list are deliberately not reproduced: the explicit request retains application typography, palette and every navigation entry. The status dot is rendered at 4px for the requested smaller-dot treatment.

Validation and before/after screenshot evidence will be recorded below. Linux Chromium uses disposable in-memory browser file adapters; this does not establish native physical-machine file-picker behavior. Existing manual acceptance and CI gates remain applicable.

## Final verification — 5 November 2026

| Check | Result | Elapsed |
| --- | --- | --- |
| Focused shell/runtime/persistence units | 5 files / 53 tests passed | 2.90s |
| Full units (`validate:pr` unit stage) | 61 files / 520 tests passed | 25.32s |
| Final `npm run typecheck` | Passed | 6.603s |
| Final `npm run lint` | Passed, zero warnings | 16.809s |
| Final `npm run build` | Passed, including token check and TypeScript | 31.585s |
| `node e2e/run-regression.mjs --full --skip-atlas` | All 245 checkpoints passed | 104.962s |
| All Playwright (`test:targeted -- layout e2e/layout`) | 159 passed; two test setup failures corrected and verified below | 406.21s |
| Focused shell + New Project rerun | Seven passed; save-state setup corrected and verified below | 31.6s |
| Final save-state/recovery rerun | Passed | 4.19s |

All **161 unique Playwright cases** are verified across the complete run and focused corrections. The full suite includes the existing Atlas journey exactly once, release smoke, Tasks, Gantt/Extended/analysis, Tube Map, Warnings, desktop/mobile layout matrices and existing keyboard/field/persistence assertions. The seven added shell cases cover all 14 routes, unchanged control rectangles, trigger non-overlap, hover delay/grace, outside clicks passing through, Escape, repeated keyboard opening/focus return, hidden inertness, popover/selection/drag suppression, long-name truncation/full title, save/undo/redo, saved/unsaved/saving/error/recovery, reduced motion, persisted PMP bytes and expanded/collapsed fit at 900/600/480/420px. Existing sidebar coverage additionally passes at 400px.

The initial `validate:pr` invocation stopped at an obsolete visible-project-label assumption in the custom lifecycle harness, because the approved collapsed state hides that text. The related project-name selectors now check loaded sidebar state independently of visibility. Completed unit/static stages were retained, and the corrected full lifecycle and complete Playwright stages were run separately against the owned production server. No successful comprehensive suite was repeated merely to obtain a timing.

The two full-Playwright setup failures were an old New Project header selector and a newly added mock expecting a separate access-loss classification from native Save errors. The unchanged browser adapter reports those Save exceptions as generic write failures. The test now checks the required error state and recovery through the actual adapter; the existing file-access-lost label/unit coverage and red presentation remain unchanged. No persistence/error-handling change was made to satisfy a test.

Final captures: [before/after gallery index](media/global-shell/README.md). All use Tasks, the same 180-record fixture and a 1440px width; 900px and 600px heights show both sidebar states and both overlay states. The final project label/value retain the prior 12px/14px tokens. Navigation rows, gaps, collapse control and sidebar widths retain their previous geometry. Exact page-control rectangles match before and after overlay opening on every route.

Detailed logs remain under ignored `work/validation-*`, `work/final-lifecycle.log`, `work/final-typecheck.log`, `work/final-lint.log` and `work/after-build.log`. Native operating-system file dialogs/physical-machine acceptance and owner visual approval remain manual. CI results are separate evidence. No merge, tag, release or deployment was performed.
