# ARGOS PM v1.5.0 — 25 October 2026

- Search stays centred against the page content across all ten modules, independently of title/action widths; narrow layouts use a centred second row.
- Gantt Previous/Next and Jump to today move to a shared persistent timeline footer with an inclusive date range; original zoom increments and Tube Map behaviour are preserved.

- Task-only Tentative status, six muted Gantt bar colours and status legend/filter; legacy task values remain unchanged.
- Tube Map milestone legend/status filtering and compact footer; shared measured dropdown/warning anchoring, compact forms and aligned context controls.
- Session-only collapsible Risk Matrix and content-sized Overview Quick Actions. Tentative-containing saves require the v1.5 reader; original-status files retain their prior minimum-runtime metadata.

The repository owner authorised merging PR #12 and publishing v1.5.0 as the latest GitHub release on 25 October 2026. Publication does not deploy a production service.

- Compact live search in ten page title toolbars, integrated filter icon, compact viewport-constrained panels, immediate AND/OR filters, navigation resets and shared Risk Matrix filtering. Table dropdowns clear sticky/scroll containers; charts expose one Hide Empty Streams control each.
- One full-field right-side creation panel across six record modules, with stable validation, keyboard operation, dirty-dismiss confirmation and close/reset on success; optional relationships/dependencies are created atomically.
- New Project requires explicit Status selection before file creation; shared error slots prevent layout shifts.
- Wider Risk/Decision context text and searchable selection panels, borderless scope controls, centred tall rows, wider People Notes and task bulk deletion in the centred-search toolbar.
- Predictive owner/scope/context/dependency selection by name or human ID, keyboard navigation and retained filtered selections.
- First-letter human text normalisation on blur, one committed edit/Undo/audit event, and no-op suppression without rewriting untouched legacy fields.
- Explicit Save / Discard / Cancel for dirty Open/Close, including safe same-file discard and failure recovery.
- File Information actions/save metadata, optional saving-device timezone, experimental Audit Log naming, scope/sidebar improvements and shared timeline Today markers/empty-Stream rules.
- Bundled version-matched v1.5.0 manual (Markdown and PDF); compatible same-minor fallback is explicitly labelled. The PDF and actual v1.5.0 demo accompany the GitHub release.
- Frozen genuine v1.4 `.pmp` acceptance fixture and expanded unit/browser compatibility coverage. Format/schema remain unchanged; no `.mpp` conversion.

See [the manual](V1.5_UI_REFERENCE.md), [compatibility/native checks](V1.5_COMPATIBILITY.md), [desktop checklist](V1.5_DESKTOP_ACCEPTANCE.md), [demo brief](V1.5_DEMO_PRODUCTION.md) and [readiness register](V1.5_RELEASE_READINESS.md). Physical Windows/macOS native consent and permission checks remain unverified by this Linux environment. Fresh CI and media verification are recorded separately. Existing v1.3/v1.4 videos remain historical; the README links the new v1.5 footage.

---

# Release notes

## v1.4.0 demo — 20 October 2026

- [Watch the new one-minute ARGOS PM v1.4.0 product demo](media/argos-pm-60s-demo-v1.4.0.mp4), captured from the real application with a disposable fictional project.
- Replace the initial 30-second cut with a silent 60-second version: normal-speed excerpts, separate editorial framing, and a real dependency warning/date correction/cleared-state sequence.
- Expose the existing Task owner relationship in creation and inline editing, including retained deleted-owner labels and sorting by displayed owner name with unassigned Tasks last; cover ownership through rename and save/reopen in the browser regression suite.
- Preserve the v1.3.0 recording unchanged. See [capture verification and native picker limitation](V1.4_DEMO_VERIFICATION.md).

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

- Corrected the Tube Map footer paint regression found by PR #12 CI: the opaque shield no longer adds a viewport of scroll overflow, so the sticky date axis and last lane remain visible through bottom scrolling. Existing toolbar shielding, navigation and milestone data are preserved.
