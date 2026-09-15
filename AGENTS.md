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

- `main` is the only development and publication branch for this POC.
- Do not create, switch to, publish, or require feature, work, recovery, or PR branches.
- Commit completed and validated blocks directly to `main`.
- Never force-push or rewrite published `main` history.
- Before changing files, verify the task is based on current `origin/main`; after publication verify local/remote HEAD alignment when the execution environment supports GitHub authentication.
- If the execution environment supplies a temporary checkout branch, treat it only as an execution detail: do not publish it and do not make it part of the repository workflow.
