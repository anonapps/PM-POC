# v1.1 dependency-security maintenance

This document describes the October 2026 maintenance work on the `maintenance/v1.1-security-stability` branch.

## Production dependency remediation

- Next.js and `eslint-config-next` updated from 16.3.5 to 16.3.8.
- Transitive `sharp` updated to 0.35.5.
- Transitive `source-map-js` updated to 1.2.2.
- `brace-expansion` branches updated to 1.1.21 and 5.0.12.

The GitHub Actions validation workflow enforces `npm audit --omit=dev --audit-level=moderate` as a blocking check. The full `npm audit` is informational, not silently ignored.

## Remaining development dependency advisories

As assessed in October 2026, the remaining development-only findings involve `braces` and its dependants (`chokidar`, `micromatch`, `fast-glob`, Tailwind and Next ESLint tooling), and `postcss-selector-parser` via Tailwind/PostCSS. These concern local compilation, linting and watching of potentially malicious patterns or selectors. Do not process untrusted repositories as trusted code. Monitor upstream advisories for compatible patches.

Do not use `npm audit fix --force`, downgrade `eslint-config-next` to Next 14, force Chokidar 4 into Tailwind 3, or upgrade Tailwind to 4 without a separate compatibility assessment and CSS regression tests.

## Validation and scope

The PR is not ready to merge until the latest commit passes unit tests, typecheck, lint, build, production audit and E2E. The E2E harness uses a mocked file picker and cannot replace manual consent and local file persistence checks. No new product features are intended.
