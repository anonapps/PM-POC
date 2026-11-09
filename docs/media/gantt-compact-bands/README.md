# Compact Gantt stream and calendar bands — 9 November 2026

Actual application captures at 1440×900 using the same disposable `regression-180.pmp` fixture. Before: `e20f6b9`; after: the compact-band follow-up on the same feature branch.

| Mode / streams | Before | After |
| --- | --- | --- |
| Simple / expanded | [Before](before-simple-expanded.png) | [After](after-simple-expanded.png) |
| Simple / collapsed | [Before](before-simple-collapsed.png) | [After](after-simple-collapsed.png) |
| Extended / expanded | [Before](before-extended-expanded.png) | [After](after-extended-expanded.png) |
| Extended / collapsed | [Before](before-extended-collapsed.png) | [After](after-extended-collapsed.png) |

Stream title cells now measure 24px in every state (previously 45px in Simple and 32px in Extended). Each year/date band measures 24px including its divider; the two-line Item header measures 48px. Previously, each calendar label band measured 36px, with an extra 1px year divider. The year labels occupy the 23px content area inside the new 24px band.

[Measured heights and fonts](metrics.json) confirm identical font declarations before and after in all four captures: stream labels stay 14px and calendar labels stay 12.8px. Only vertical band/control padding and height change. Task/milestone row styles, chart bars, colors, data, expansion controls and footer behavior are preserved. Narrow date cells stay on one line and retain their existing full-range titles.

See [focused validation](../../GANTT_COMPACT_BANDS.md). No merge, release or deployment.
