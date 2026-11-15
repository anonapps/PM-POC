# Revised ARGOS PM continuous-action demo

Requirements: ARGOS PM repository and its existing npm dependencies; Chromium; Python 3; FFmpeg/FFprobe with libx264/drawtext; DejaVu Sans fonts.

1. In the repository: `npm run build`, then `npm run start -- --hostname 127.0.0.1 --port 3000`.
2. From this folder: `bash run.sh /absolute/path/to/repository /absolute/path/to/output`.

Set `CHROME_PATH` or `ARGOS_URL` as needed. Use an absolute output path. No application code or existing project data is modified. Each run replaces only dedicated demo outputs. Temporary captures stay in the repository's ignored `work/argos-video/capture/` directory.

The project generator uses the canonical .pmp codec, schedule snapshots and critical-path calculation engine. Progress is hidden with the supported `showProgress: false` project preference. Six fictional risks include ratings, context and mitigation actions. No existing project is opened or overwritten.

The browser sequence has no timed scene holds. Short eased pointer movement, real clicks and smooth scrolling start immediately and continue through Overview, Milestones, Tube Map, both baseline comparisons, Gantt, critical-path analysis, the Risk Log matrix/action/context views and closing Overview. Only readiness checks and a 35 ms mouse-button hold are awaited. Capture-only cursor and click cues reuse `e2e/support/demo-recorder.ts`.

`render.py` proportionally maps the complete recorded sequence to 60 seconds; all visual updates and click/scene timestamps use the same factor. It adds two-line editorial text outside product pixels and restrained camera drift, then verifies resolution, duration, codec, frame count, frame rate, silence and complete decoding. `document.py` regenerates the storyboard with measured timings. No static holds are inserted.

After product updates, adjust selectors to actual controls and review the final video. Do not substitute fabricated UI for unavailable features. Browser assertions cover hidden progress, 14 milestones, critical bars, reliable analysis, six risks, matrix visibility, cursor and zero browser errors.
