# v1.5 task-status and shared layout evidence

Actual Linux/Chromium production-build captures from the status/layout batch on 24 October 2026. These are current captures, not before/after pairs. The fictional project derives from the frozen v1.4 fixture, with all six Task statuses, four Milestone statuses and a scheduling warning. The automated assertions check geometry, colour equality, filters, focus and persistence rather than comparing screenshots alone.

- [Gantt status bars, complete legend and top-layer warning](1440-Gantt-status-warning.png), 1440×900. The open warning overlays neighbouring content while remaining attached and readable.
- [Tube Map diamonds, complete legend and compact footer](1440-Tube-status-footer.png), 1440×900, after scrolling to the bottom. The empty area below this short chart is the remaining page viewport, not a fixed scrollable footer spacer. Existing collision/truncation rules for dense same-date labels remain unchanged.
- [Compact full-field Task creation panel](1440-creation-compact.png), 1440×800, after keyboard/picker checks; header/footer remain available while fields scroll.

Tests also ran at 1024 and 1920 widths. Existing 900/1024/1280/1440/1920 search-centre and Gantt navigation cases remain included. These images do not replace Windows/macOS visual/native-file acceptance. No new video was produced.
