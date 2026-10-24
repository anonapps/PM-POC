# Frozen v1.4 compatibility fixture

`v1.4-rich-project.pmp` was generated with the **actual v1.4 serializer and commands** from `origin/main` at `fa4a92406e10d727ba532a01d954ee24d497f718`, using its existing 180-record regression fixture. It was not produced by the v1.5 serializer with a relabelled version.

The fictional project contains 30 each of Streams, People, Tasks, Milestones, Risks and Decisions; multi-entity relationships, dependencies, risk actions, varied dates, one soft-deleted Person, enabled audit history with a deletion event, and deliberately lowercase/whitespace-sensitive legacy notes. Runtime metadata is 1.4.0. Saved timezone metadata is absent, as in v1.4. `v1.4-rich-project.json` is the complete expected canonical project state before v1.5 edits.

SHA-256 of `.pmp`: `803e5f697758f282c547618605110ddc7bf9f1c20c135710e213a8b23133e0f9`.

The v1.4 source was extracted into a disposable directory using `git archive`; only fictional fixtures were generated. No user project or live v1.4 branch/file was modified. The fixture is frozen input: do not regenerate it with the current serializer when changing v1.5 tests.
