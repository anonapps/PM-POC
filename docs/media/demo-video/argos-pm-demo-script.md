# ARGOS PM — revised continuous-action product demo

60 seconds · 1920 × 1080 · 30 FPS · H.264 MP4 · no audio

## Requested revisions

- Progress indicators are hidden using the actual project preference (`showProgress: false`), including Overview and Gantt; progress data is retained.
- Cursor travel uses shorter eased movements. The 10-second opening hold and every timed scene hold are removed.
- Action begins at the first frame. All scenes run continuously through real movement, clicks, scrolling and inspection.
- Risk Log is populated with six credible data-center risks, ratings, context and mitigation actions.

## Final timings

| Seconds | Recorded action | Two-line marketing copy |
|---|---|---|
| 0.00–3.00 | Overview; move immediately across delivery and risk KPIs. | Complex projects. One clear view. / Manage every workstream from one place. |
| 3.00–14.67 | Open Milestones; inspect Network Backbone Operational and scroll; open Tube Map, show baseline stations and switch saved baselines. | Every milestone. Fully visible. / Track delivery across teams and workstreams. |
| 14.67–32.32 | Compare both saved baselines in the table and Gantt; choose Month zoom, search Compute, enable baseline and variance displays, trace delayed activities. | Plans change. Stay in control. / Compare baselines and spot schedule deviations. |
| 32.32–45.47 | Clear chart search; enable Critical Path, Extended mode and analysis; select backbone cabling, core switches and carrier uplinks, revealing each critical bar. | Know what drives your deadline. / Identify critical tasks and focus on delivery. |
| 45.47–54.72 | Show six fictional risks and the 3×3 matrix; inspect high-risk cells, expand mitigation actions and inspect/cancel risk context without saving changes. | See risk. Act early. / Connect risks, mitigation actions and delivery. |
| 54.72–60.00 | Return to Overview and continue moving among delivery and risk KPIs until the final frame. | ARGOS PM / Clarity. Control. Delivery. |

## Authenticity and production

The real local ARGOS PM 1.7.0 production build is recorded in an isolated Chromium profile. All views and comparison/analysis results belong to the application. The demo project has 5 streams, 25 tasks, 14 milestones, 37 Finish-to-Start dependencies, 6 risks and 2 saved named baselines. Approved-plan deviations are 4 days; steering-review deviations are 2 days; early work stays on schedule. The canonical engine reports 21 critical tasks, 1 maximal path, completion 14 December 2026 and no calculation diagnostics.

The reference date is 15 November 2026. The `.pmp` is opened in preflight through the existing repository-style file-picker adapter; native dialogs are outside the film. Capture-only pointer and click rings follow actual pointer events. Two-line text sits above the application, with short fades and restrained camera drift. No product source, style or existing project file is changed.

Captured action timestamps are proportionally mapped to the 60-second delivery timeline; no static holds are inserted. Source capture: 42.141 seconds; timeline factor 1.4238. Chapter and click timings are saved in `technical-validation.json`.

## Reproduction and validation

Run `production/run.sh` against the ARGOS repository and a running local production build. The canonical codec validates and round-trips the project. Browser assertions verify absent progress UI, 14 milestone rows, real critical bars, ready analysis, all 6 risk rows, visible risk matrix, zero page errors and visible cursor. FFprobe checks H.264, 1920×1080, 30 FPS, 1,800 decoded frames, 60 seconds and no audio. FFmpeg decodes the complete output. Sampled rendered frames are reviewed for readable overlays and valid UI. No PR, merge, release or deployment is performed.
