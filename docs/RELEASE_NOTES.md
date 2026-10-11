# Release notes

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
