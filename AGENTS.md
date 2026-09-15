# Codex Instructions

## Authoritative Project Specification

Before making any architectural, functional, data-model, persistence, or UX change to this repository, read `docs/PROJECT_REQUIREMENTS.md` and treat it as authoritative. Preserve the documented architecture and do not introduce cloud services, external databases, authentication, analytics, telemetry, or external runtime dependencies unless explicitly required.

## Development Approach

Implement incrementally in logical blocks. Inspect existing implementation first, implement only intended scope, validate, fix regressions, keep documentation aligned, and commit completed work.

## Branch Policy

`main` is the only development and publication branch for this POC. Do not create, switch to, publish, or require feature, work, recovery, or PR branches. Commit completed work directly to `main`. Never force-push or rewrite published `main` history. A temporary checkout branch supplied by an execution environment is an implementation detail and must never be published.
