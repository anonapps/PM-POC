# Tube Map single header band

> Implementation/evidence record. The consolidated content is now integrated through [PR #34](https://github.com/anonapps/PM-POC/pull/34) (`9266a02`, 12 November 2026). Use the [v1.7 manual](V1.7_UI_REFERENCE.md) and [current UI guide](ARGOS_PM_UI_REFERENCE.md) for final labels and behavior, including the historical-marker fix. Branch instructions and measurements below retain their original scope/date; this is not a release/deployment record.

Approved follow-up on `feature/global-sidebar-floating-toolbar`, starting from clean `2183a08`, in draft PR #30.

A scoped CSS rule in `src/features/shared/planning-controls.css` reduces only the Tube Map Stream/week-number header from 42px to 24px. It matches a single Gantt calendar band, not the combined 48px year/date stack. Child cells are 23px plus the header's existing 1px divider. Header fonts and horizontal geometry remain unchanged. The Stream sort button and week/date text are vertically centered; date/week text retains block ellipsis behavior at narrow widths.

No stream-lane row height, station, connector, model/calculation, chart control, footer, sidebar, persistence or PMP change is included. The Gantt header is unchanged.

## Verification

| Check | Result | Elapsed |
| --- | --- | --- |
| Focused Tube Map header and existing sticky/footer cases | 11 passed | 15.38s |
| Final lint | Passed, zero warnings | 16.883s |
| Final build, token check and TypeScript | Passed | 26.976s |

Three new cases compare the rendered Tube Map band directly with Gantt's date band at 375/900/1440px, require 24px rather than 48px, validate all 13 cells, unchanged 12.8px font/20px line height and vertical text centering, week/date labels, Stream keyboard sorting, stable lane heights and sticky alignment. Eight existing short/long-stream sticky/footer cases pass at 375/768/1080/1440px. The new Axis selector was corrected to match its existing accessible name; no application control change was needed.

Direct before/after fixture measurements verify 42px -> 24px and identical header fonts, column positions/widths, lane heights and lane fonts. [Screenshots and measurements](media/tube-map-single-header/README.md). Logs remain under ignored `work/tube-header-*.log` and `work/validation-2026-11-09T08-38-43.412Z`.

This CSS-only change uses focused layout coverage; no unrelated comprehensive suite is repeated. Browser adapters and Linux Chromium captures do not establish native OS/physical-machine acceptance. Owner visual acceptance and CI remain separate evidence. No merge, tag, release or deployment.
