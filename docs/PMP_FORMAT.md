# PMP Format v1

Block 3 defines the platform-independent project container. `.pmp` is the sole project source of truth.

## Layout

A PMP v1 file is a deterministic ZIP archive containing exactly:

- `manifest.json`
- `project.json`
- `config.json`

No runtime files, filesystem paths, session history, file handles, undo/redo history, dirty-state history, derived warnings, credentials, or executable content are persisted.

## Manifest

The manifest identifies `PM-POC/PMP`, format version `1`, project schema version `2`, project ID, created/save timestamps, runtime compatibility metadata, and the fixed project/config entry names.

## Canonical serialization

JSON object keys are recursively sorted before encoding. ZIP metadata uses fixed timestamps and deterministic entry order. The v1 codec emits DEFLATE-formatted entries using deterministic stored DEFLATE blocks, avoiding platform/filesystem dependencies.

## Validation and security

Treat every PMP file as untrusted. The codec applies archive/entry size limits, exact entry allowlisting, duplicate-entry rejection, unsafe/path-traversal name rejection, fatal UTF-8 decoding, safe JSON parsing, manifest/config/project validation, project-ID matching, and prohibited session/persistence-field detection before returning trusted state.

## Compatibility and migration

Format and schema versions are explicit. Current schema 2 opens directly. Schema 1 is automatically normalised in memory on open; legacy Due remains historical metadata rather than becoming a scheduling date. Newer versions are rejected with a structured incompatibility result. Saving an opened schema-1 project writes schema 2 through the normal save lifecycle.

## Boundary

This module operates only on in-memory bytes and canonical application state. Filesystem access, browser file handles, save lifecycle, launcher behaviour, and the Project File Service belong to later implementation blocks.

## v1.6 optional baseline schedules

`project.json` may contain `baselines`: an array of `{id,name,description?,createdAt,snapshot}`. Snapshot schemaVersion 1 contains `projectId`, historical `streams` (`id`, `name`) and `items` (`id`, `kind`, `humanId`, `name`, `startDate`, `finishDate`, `streamIds`, `projectWide`). Dates are ISO calendar strings or null. Milestones use the same start/finish value. Snapshot references are historical and do not require current entities to remain present. Snapshots exclude soft-deleted schedule items at capture time.

Collections are optional for legacy files. Validation rejects malformed/duplicate baseline IDs, snapshot versions, invalid dates/kinds/scopes and missing historical stream references. Safety bounds: 1,000 baselines, 100,000 items/streams per snapshot; existing archive/entry bounds also apply. Baseline-containing saves declare minimumRuntimeVersion 1.6.0 to avoid older writers silently discarding historical state. The project schema stays 2; container format stays 1; no new technical migration is performed. Undo/Redo stacks and selected comparison-baseline UI state are not persisted.
