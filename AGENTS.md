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
