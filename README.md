# Project Management POC

Local-first, offline project-management proof of concept.

The authoritative product specification is `docs/PROJECT_REQUIREMENTS.md`. Architecture and staged implementation guidance live under `docs/`.

Development is performed directly on the single `main` branch. The application uses a layered architecture: domain, application, persistence/platform adapters, and presentation.

Current implementation baseline includes the domain model, application command/state/history architecture, and PMP v1 in-memory project container codec. Later blocks add Project File Service, launcher/runtime, UI modules, persistence lifecycle, security hardening, accessibility, and final QA.
