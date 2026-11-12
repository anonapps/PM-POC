# Gantt warning before the name — 9 November 2026

Actual application at 1440×900 using the unchanged `regression-180.pmp` fixture. Before: `a4bf623`. After: warning-placement follow-up on the same feature branch. Each capture scrolls the first warning into view.

| Mode / disclosure | Before | After |
| --- | --- | --- |
| Simple / closed | [Before](before-simple-closed.png) | [After](after-simple-closed.png) |
| Simple / open | [Before](before-simple-open.png) | [After](after-simple-open.png) |
| Extended / closed | [Before](before-extended-closed.png) | [After](after-extended-closed.png) |
| Extended / open | [Before](before-extended-open.png) | [After](after-extended-open.png) |

The triangle now occupies the existing indentation gutter immediately before the name, with no extra visible disclosure arrow or numeric count. The existing count is retained in its accessible description and title. The existing warning messages and popup behavior remain available through the triangle.

[Measured name geometry](metrics.json) is identical before and after: x=271px, width=240.015625px, height=20.296875px, font `14px / 20.3px Arial, Helvetica, sans-serif`. The offset below the row's top remains 5px in Simple and 4px in Extended. The former separate warning line is removed, allowing the warned row to use the normal name/date arrangement. The captures can have different scroll offsets because the warning anchor has moved onto the name line.

See [validation](../../GANTT_WARNING_PLACEMENT.md). No merge, release or deployment.
