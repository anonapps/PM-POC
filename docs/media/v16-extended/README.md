# Implemented Extended Gantt — application evidence

These are actual Chromium screenshots from the final `e2e/layout/extended.spec.ts` run, with a 1440×1000 viewport and disposable seeded fixture data. They are separate from the approved design mockup.

- [Extended layout](extended-layout.png): existing compact Gantt and Tasks modules, centered Search, original status colors and resizable divider.
- [Full-page Add Task](extended-add-task.png): the unchanged standalone Tasks creation panel, over both panes and the project header.
- [Shared edits and baselines](extended-baselines.png): live edits, optional historical overlays and variance in Extended Mode.

The browser tests assert exact equality of panel/field/control rectangles, font properties, padding, margin, gap and display between standalone Tasks and Extended Mode at 1024, 1440 and 1920px. Local checks also compared the captured pre-implementation standalone reference. Complete equality records:

- [1024px](panel-equivalence-1024.json)
- [1440px](panel-equivalence-1440.json)
- [1920px](panel-equivalence-1920.json)

At 1440×1000, both panels have x=880, y=0, width=560, height=1000, 24px padding and the same 14px Arial root font. Each child rectangle and style is compared, not just the outer frame. The unchanged EntityCreationPanel is reused and portal placement prevents compact pane styles from reaching it.

The final focused run passed all 7 tests. Broader verification passed 68 Playwright cases, the full CDP/lifecycle/Atlas journey, 471 unit/integration tests, lint, typecheck, production build and production audit (0 vulnerabilities). See `docs/V1.6_PROGRESS.md` for exact sequencing and limits. Native Windows/macOS picker consent and physical-machine visual acceptance are not inferred from this Linux browser evidence.
