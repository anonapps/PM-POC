# Tube Map today-focused window

Actual application at 1440×900 with the unchanged deterministic 180-record project and fixed date 9 November 2026 (Monday). The before image reuses the verified `764ccaa` single-header capture; the after image shows the today-window follow-up on the same feature branch.

| Before | After |
| --- | --- |
| [Current week at the start](before.png) | [Four historical weeks before today](after.png) |

After: W42–W53, visible range 12/10/2026–03/01/2027, with the actual Today 09/11/2026 marker at approximately 33.33% of the timeline body width. W42–W45 are the four complete historical weeks; W46–W53 are the current and seven following weeks. [Measured window and marker](metrics.json).

The 24px single header, typography and layout rules are retained. On other weekdays, Today remains at its true day position inside the fifth weekly column. The new default and Jump to today use the same window. [Validation](../../TUBE_MAP_TODAY_WINDOW.md).
