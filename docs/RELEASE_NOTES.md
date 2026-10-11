# Release notes

## v1.3.1 — 11 October 2026

- Promote the user-tested HeroUI presentation to the main release.
- Collapse sidebar to a 64px letter rail with small left/right chevrons; keep the project header clear.
- Refresh entity lists and selection options directly from the project store, including newly created Streams in milestone scope and task selectors.
- Remove the experiment preview label.
- Update HeroUI v2 and migrate the styling toolchain to Tailwind 4 to remove the production audit advisories; production audit remains blocking.
- Preserve schema 2, existing compatibility floors, offline operation and `.pmp` file workflows.

## v1.3.0 — 11 October 2026

- Shared design tokens for colours, typography, spacing, radii and shadows.
- Content-sized application header and measured module toolbars, recovering workspace space while preserving sticky table and Tube Map headers when controls wrap.
- Operational modules use available desktop width; Overview remains bounded.
- Consistent controls, hover/active/focus feedback and visible save status at smaller widths.
- Explicit table action cells and milestone metadata/validation in normal flow.
- Visible compact navigation for every module; fixed Tailwind visibility conflict on the sidebar toggle.
- Unique dialog heading IDs and Tab/Shift+Tab containment from initial dialog focus.
- Browser regression coverage at 1440, 1080, 768 and 375px, plus sidebar-toggle and dialog keyboard checks.
- Application display and written runtime version metadata use package version 1.3.0. Project schema remains 2 and existing minimum-app compatibility values remain intact.

Validation: 140 unit tests (including application-version metadata coverage), TypeScript, ESLint, production build, full form-creation/save/reopen lifecycle and new UI browser regressions passed during implementation. Native OS picker and launcher behaviour still requires the target Windows/macOS platforms.

This release uses existing custom React/CSS components. The HeroUI branch remains a separate experiment. It adds no external fonts, runtime services, database or network dependencies.
