# Tube Map single 24px header

Actual application captures at 1440×900, using the same disposable `regression-180.pmp` fixture and fixed date. Before: `2183a08`; after: the single-header follow-up on the same feature branch.

| Before — 42px | After — 24px |
| --- | --- |
| [Before screenshot](before.png) | [After screenshot](after.png) |

The Stream/week-number line is one 24px band, matching one Gantt date/year band. It does not use the combined 48px Gantt header height. The 1px divider is included in the 24px total, leaving 23px child cells with unchanged 12.8px / 20px typography, vertically centered.

[Exact measurements](metrics.json) confirm unchanged header font declarations, column x positions/widths, and all stream-lane heights/fonts. Existing week/date display modes, text truncation, sorting, chart lanes, markers, connectors and footer remain. [Validation](../../TUBE_MAP_SINGLE_HEADER.md).
