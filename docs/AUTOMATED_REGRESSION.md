# Automated regression suite v2

`npm test` runs the existing tests plus the deterministic regression tests.
`npm run test:regression` generates a temporary .pmp fixture, runs existing browser acceptance, then opens and exercises the large fixture.
`npm run test:lifecycle` additionally creates 30 records per module through the actual creation forms (180 additional records). The nightly/manual GitHub workflow runs this mode; normal validation runs extended regression.

The fixture contains 30 streams, people, tasks, milestones, risks and decisions (180 records). It uses fixed dates, stable IDs and supported domain values. Risk probability/impact covers all nine matrix cells. Explicit coverage assertions cover lifecycle status/assigned owner, milestone status/owner and risk status/owner. Other targeted scenarios include optional dates, out-of-range dates, project/multiple stream scope, four-level task nesting, progress boundaries, dependency chains, cross-stream dependencies, empty/multiple risk actions, overdue/open versus completed actions, optional decision rationale and decision-to-risk links. Decisions have no status in the current product model.

Domain regression verifies complete .pmp equality after reopen, deterministic serialization, search for every ID, Gantt/Tube Map projections, duplication, deletion/restoration, undo/redo, dirty baselines, risk rating edits and decision relationships. Browser regression verifies all six crowded tables, Gantt, Tube Map, search and save/close/reopen. Existing acceptance retains the layout, validation, keyboard, dependency and file lifecycle checks.

Performance timings for opening and module navigation are diagnostic only; they are not hardware-dependent pass/fail thresholds. This is targeted scenario coverage, not an exhaustive pairwise covering array across every field. The full form loop verifies creation volume; varied combinations are supplied by the validated fixture.

Every browser run uses its own disposable profile and in-memory picker adapter. Fixture bytes are produced by the real .pmp codec in an OS temporary directory and removed by the runner. No user project files are accessed. Chrome must be installed; set CHROME_PATH when it is not on PATH. E2E_BASE_URL explicitly opts into using an existing local test server.
