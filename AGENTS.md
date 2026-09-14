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

Keep the core domain model independent from:

- React
- Next.js
- browser APIs
- filesystem implementation details
- future desktop-shell technology

Use explicit abstractions where defined by the requirements, particularly the Project File Service.

The `.pmp` file is the authoritative and self-contained project data format.

## Development Approach

Implement the application incrementally in logical blocks.

For each block:

1. Inspect the existing implementation first.
2. Implement only the intended scope.
3. Run relevant tests, linting, type checking, and validation.
4. Fix regressions introduced by the change.
5. Keep documentation aligned with significant architectural decisions.
6. Commit completed and validated work to GitHub.

Do not attempt to build the entire application in a single Codex task.

## Supporting Documentation

Also consult when available:

- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`

If supporting documentation conflicts with `docs/PROJECT_REQUIREMENTS.md`, the project requirements take precedence.
