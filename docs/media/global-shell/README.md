# Global shell screenshots

Actual application at 1440px width, using the unchanged deterministic `regression-180.pmp` fixture and disposable browser file adapters. The before pair is main `ed30f02`; after captures show the feature branch. All screenshots use Tasks, with identical project data.

| Sidebar / height | Before | After, hidden toolbar | After, visible toolbar |
| --- | --- | --- | --- |
| Expanded / 900 | [Before](before-expanded.png) | [Hidden](after-900-expanded-hidden.png) | [Visible](after-900-expanded-visible.png) |
| Collapsed / 900 | [Before](before-collapsed.png) | [Hidden](after-900-collapsed-hidden.png) | [Visible](after-900-collapsed-visible.png) |
| Expanded / 600 | — | [Hidden](after-600-expanded-hidden.png) | [Visible](after-600-expanded-visible.png) |
| Collapsed / 600 | — | [Hidden](after-600-collapsed-hidden.png) | [Visible](after-600-collapsed-visible.png) |

Comparison with the supplied approved sidebar reference: project label/value below the brand; small green dot to the value's left; collapsed text hidden with the dot retained. Existing application fonts, colors, brand, icons, sidebar width, navigation order and collapse position are retained as explicitly requested. All 14 navigation entries remain visible. The global header's 56px is reclaimed; the toolbar overlays the top-right actions instead of reserving a new row. Hidden/visible pairs retain identical page-control positions.

These captures establish Linux Chromium layout behavior, not native Windows/macOS file-picker acceptance. No merge, release or deployment accompanies this evidence. See [validation record](../../GLOBAL_SHELL_VALIDATION.md).
