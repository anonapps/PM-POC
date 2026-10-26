# Codex Instructions

## Authoritative Project Specification

Before making any architectural, functional, data-model, persistence, or UX change to this repository:

1. Read `docs/PROJECT_REQUIREMENTS.md`.
2. Treat `docs/PROJECT_REQUIREMENTS.md` as the authoritative product specification.
3. Do not knowingly implement behaviour that conflicts with the requirements.
4. If the existing implementation conflicts with the requirements, preserve the requirements and identify the conflict before changing behaviour.
5. Do not invent product requirements when the specification already defines the behaviour.
6. If a requirement is genuinely ambiguous and the implementation decision could materially affect the product architecture, data model, security, or user experience, ask for clarification.
7. Prefer the simplest implementation that satisfies the documented requirements.
8. Do not introduce cloud services, external databases, authentication, analytics, telemetry, or external runtime dependencies unless explicitly required.

## Architecture Principles

Keep the core domain model independent from React, Next.js, browser APIs, filesystem implementation details, and future desktop-shell technology.

Use explicit abstractions where defined by the requirements, particularly the Project File Service.

The `.pmp` file is the authoritative and self-contained project data format.

## Development Approach

Implement the application incrementally in logical blocks. Inspect first, implement only intended scope, validate, fix regressions, keep documentation aligned, and commit completed work.

Do not attempt to build the entire application in a single Codex task.

## Supporting Documentation

Also consult `docs/ARCHITECTURE.md` and `docs/IMPLEMENTATION_PLAN.md`. If supporting documentation conflicts with `docs/PROJECT_REQUIREMENTS.md`, the project requirements take precedence.

## Branch Policy

- `main` is the stable release and publication branch. Do not commit v1.5 development directly to `main`.
- ARGOS PM v1.5 development takes place on `feature/v1.5-approved-enhancements`, created from current `main`.
- Keep feature work in incremental, tested commits. Preserve existing project behaviour and the local-first `.pmp` file contract.
- Open a pull request targeting `main` when the approved enhancements, documentation, compatibility checks and automated regression suite are complete.
- Do not merge, tag, or publish v1.5 until explicit user approval after manual visual acceptance.
- Never force-push or rewrite published `main` history. Check current refs before merging.
- Subsequent release branches require explicit project-level direction; do not assume v1.5 branch policy applies permanently to all versions.

## Historical note — HeroUI promotion (11 October 2026)

HeroUI was promoted to `main` as v1.3.1. The earlier direct-to-main workflow is superseded for v1.5 by the branch policy above.


## v1.5 promotion — 25 October 2026

The owner explicitly authorised merging PR #12 and publishing v1.5.0 as GitHub latest. After promotion, main is the stable v1.5 baseline. Keep future changes behind PRs and retain every v1.5 unit, layout, regression and lifecycle check; the main/PR lifecycle gate is mandatory. Publication permission for this release does not authorise future releases or production deployments. Native physical-machine evidence must remain accurately marked, never inferred from Linux file-picker mocks.

## Testing and validation cost

- Choose the smallest relevant suite from `docs/TESTING_OPTIMISATION.md`. `validate:quick` is a smoke check, never a substitute for relevant regression coverage.
- For a local change, run `npm run test:targeted -- unit <test-path...>`, `npm run test:targeted -- layout <spec-path> [--grep <scenario>]`, or `npm run test:targeted -- volume [--full]` as appropriate. Supply selectors; targeted unit/layout commands reject an empty selection.
- Use `validate:pr` before opening a ready PR and `validate:release` for release verification. Both retain the full lifecycle gate, every unit case, and every Playwright case. Validation does not authorise merging, tagging, publishing or deploying.
- A successful suite on the current relevant code state counts: do not rerun it through overlapping aliases, or after documentation-only edits. Rerun affected checks after code changes, failures or a concrete unresolved concern. Baseline/after measurement is a justified rerun; do not loop to obtain a favourable timing.
- Never run browser suites concurrently against the same server/profile/debug port. Batch independent analysis and static checks; serialize browser validation. Prefer the production server shared by `validate:pr`/`validate:release` after their single build. Set `E2E_BASE_URL` only to intentionally reuse a known server.
- Prefer deterministic `.pmp` fixtures for setup. Keep UI creation where creation itself is under test, especially the complete 180-form lifecycle and Atlas journey. Never seed away the behavior being asserted.
- Keep assertions, viewport matrices, persistence/dependency checks and release coverage. No test deletion or assertion weakening for speed. Fixture bytes must match their generator; regenerate explicitly with `REGRESSION_PMP_PATH=<path> npm test -- src/testing/regression.test.ts` when an intended fixture update is needed.
- Retain logs under ignored `work/`; report command/scope, pass/fail, test counts, elapsed time, and relevant failures in a concise summary. Do not paste successful test lists, browser stderr or duplicate final PASS logs. Use `E2E_VERBOSE=1` and `CAPTURE_LAYOUT=1` only for investigation or requested visual evidence; failure screenshots remain automatic.
- Do not change application functionality, requirements or the `.pmp` contract as a testing optimisation. Stop and report a regression that cannot be safely fixed within the authorised scope.
