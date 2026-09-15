# Project Management POC

A local-first project management proof of concept built with TypeScript, React, Next.js, and Tailwind CSS. The product specification is maintained in [`docs/PROJECT_REQUIREMENTS.md`](docs/PROJECT_REQUIREMENTS.md).

## Prerequisites

- Node.js 20.9 or newer
- npm 10 or newer

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in Chrome Desktop.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Source layout

- `src/app` — Next.js entry points and global presentation styles.
- `src/features` — feature-oriented React UI.
- `src/application` — framework-independent use cases and state orchestration.
- `src/domain` — framework- and platform-independent business rules.
- `src/persistence` — project-file codecs and adapters.
- `src/shared` — small cross-cutting constants and utilities.

The `.pmp` project file will be the sole source of truth for project data. Persistence will remain behind the Project File Service abstraction; Block 0 does not implement project or persistence functionality.
