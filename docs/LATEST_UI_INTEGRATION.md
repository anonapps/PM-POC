# Combined UI testing branch

`test/latest-ui-fixes` combines the current v1.7 main baseline with:

- `fix/milestone-scope-single-line`: fixed one-line milestone scope summaries and clickable +N overflow.
- `feature/global-icon-buttons`: shared accessible icon actions, wider milestone Scope column and same-map/below-map baseline choice.
- `feature/ux-improvement-batch`: Search result title navigation with preserved destination preferences, Tube Map names/tooltips and warning navigation to stable dependency IDs. This includes the changes also published independently on `feature/search-result-navigation` and `feature/tube-map-display`.
- `feature/global-sidebar-floating-toolbar`: sidebar project/save status, floating global controls, compact Gantt section/date bands, inline warning triangles the single-band Tube Map header, and PR #30 at `a87e616` including the Today-focused window with four historical weeks.

## Reconciled overlapping changes

The newest single-line Scope request supersedes the older wrapping behavior; the wider Scope column and compact action icons remain. Both scope layout and overflow interaction tests are retained.

Tube Map uses one comparison selector with the newer “In the same map” / “Below the map” labels. Same-map historical markers use the newer grouped projection, baseline-only lanes and unchanged live coordinates. Below-map rendering retains the earlier optional captions. Show milestone names continues to control live captions and below-map historical captions. Current, below-map and grouped same-map historical markers share the hoverable, keyboard-accessible Tube Map tooltip, including historical status and variance details. The older display tests use the current selector and geometry contract; the dedicated comparison tests retain coincident grouping, historical-only lanes and live-coordinate invariance checks.

Search uses clickable result titles rather than a separate Open details icon; deleted-result Restore remains an icon action. The floating toolbar retains the shared icon Undo/Redo and their accessible tooltips.

This branch is for combined local testing. It does not merge into main, publish a release or deploy the application.
