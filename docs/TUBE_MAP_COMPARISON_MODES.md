# Tube Map comparison display modes

Added on `feature/global-icon-buttons` for review in PR #29. This is not a merged/released feature yet.

Select a Comparison baseline, enable **Baseline milestones**, and choose **Display**:

- **Below the map** is the existing default: historical milestones occupy the separate date-aligned strip.
- **In the same map** shows read-only hollow historical diamonds on the live chart's date axis. Solid status-coloured diamonds remain the current milestones. Current station dates, lanes, captions, click handlers and dependency/critical-path presentation are unchanged.

Both modes use the same selected immutable snapshot and shared comparison calculation. Historical diamonds expose human ID, original milestone/stream names, baseline date and current date (or removed/undated) through mouse hover and keyboard focus. New same-map details use the existing shared tooltip and DD/MM/YYYY dates. Same-date milestones in the same historical scope share one diamond with a count; all individual names/dates remain in its accessible details. The count badge does not move the diamond off its date coordinate.

A milestone applying to several historical streams appears in each corresponding stream; project-wide history stays in the project lane. Where a historical stream has no displayed live lane—including deleted streams or current filtering—the same map adds a labelled **(baseline only)** lane after the live chart. These lanes show historical data only and have no edit/navigation action. Current filters, status selection and Hide Empty Streams still control the live map exactly as before; historical coverage remains available independently, as in the existing below-map comparison. Live stream positions never move to accommodate historical markers.

The date window is shared: start inclusive, end exclusive; Previous/Next/Today update either view. Sorting/renamed streams match by stable IDs. The selector is disabled while baseline milestones are off or no baseline exists; its choice is retained when toggling visibility or selecting another baseline within the mounted Tube Map. Reopening/navigating back resets the view to the existing below-map default. No mode/derived coordinates are stored in PMP, Audit Log or Undo history, and changing display does not mark the project dirty.

No domain/persistence schema, baseline mutation, automatic scheduling or other page layout change is introduced. The default strip renderer is unchanged. The Axis dropdown now has an explicit accessible name so it remains distinct from the new display dropdown.

## Review images

Both images use the same deterministic legacy PMP fixture with captured/changed milestone dates, multi-stream scope and removed historical data at 1440 × 900:

- [Below the map](media/tube-comparison/below.png)
- [In the same map](media/tube-comparison/same-map.png)

## Focused verification

All 19 relevant browser cases have passing evidence across the focused runs; unchanged passing scopes were retained rather than repeating overlapping suites.

| Scope | Result | Time |
| --- | --- | --- |
| `test:targeted -- unit src/features/baselines/tube-baseline-overlay.test.ts src/features/tube-map/model.test.ts` | 2 files / 45 tests passed | 0.48 s |
| Final `test:targeted -- layout e2e/layout/tube-comparison.spec.ts` | All 6 comparison cases passed, 900/1280/1440/1920 px | 6.66 s |
| Existing baseline lifecycle, Tube Map dependency focus and three compact footer cases | 5 passed in initial focused browser run | 19.17 s whole initial run (other cases failed on test setup) |
| Existing Tube Map sticky bounds, short/long data at 1440/1080/768/375 px | All 8 passed after explicit Axis selectors | 130.28 s whole rerun, including four fixture hit-target timeouts |
| Production build / TypeScript / token freshness; ESLint on changed source/tests | Passed | Build total not separately timed |

The six final cases verify default/disabled states, both display modes, exact date alignment, grouped hover/keyboard details, snapshot and file immutability, baseline changes, date navigation, multi-stream/removed history, retained dependencies/Critical Path toggles, unchanged live coordinates and working live editing. Review images were regenerated from that final passing run. The full release/PR pipeline was not rerun for this draft follow-up.

Logs are retained under ignored `work/validation-2026-11-03T00-53-58.055Z/` (unit), `work/validation-2026-11-03T00-56-58.228Z/` (initial existing-scope results), `work/tube-comparison-browser-final.log` (sticky-bounds rerun), and `work/validation-2026-11-03T01-11-56.524Z/` (final comparison cases). This follow-up uses focused validation and leaves PR #29 in draft for owner review. No merge, release or deployment performed.

Initial browser setup fixes: the historical deletion fixture needed the codec's required deletion timestamps, and old Axis checks assumed there was only one combobox. Their selectors now use the explicit Axis name; no assertions were removed or weakened. An intentionally coincident live-station fixture also exposed the pre-existing overlap between live diamond click targets. This change preserves the existing live geometry; final comparison fixtures keep historical milestones coincident while current dates diverge. Redesigning live collision placement is outside this display-mode change.
