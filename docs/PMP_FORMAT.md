# PMP Format v1

Block 3 defines the platform-independent project container. `.pmp` is the sole project source of truth.

## Layout

A PMP v1 file is a deterministic ZIP archive containing exactly:

- `manifest.json`
- `project.json`
- `config.json`

No runtime files, filesystem paths, session history, file handles, undo/redo history, dirty-state history, derived warnings, credentials, or executable content are persisted.

## Manifest

The manifest identifies `PM-POC/PMP`, format version `1`, project schema version `1`, project ID, created/save timestamps, runtime compatibility metadata, and the fixed project/config entry names.

## Canonical serialization

JSON object keys are recursively sorted before encoding. ZIP metadata uses fixed timestamps and deterministic entry order. The v1 codec emits DEFLATE-formatted entries using deterministic stored DEFLATE blocks, avoiding platform/filesystem dependencies.

## Validation and security

Treat every PMP file as untrusted. The codec applies archive/entry size limits, exact entry allowlisting, duplicate-entry rejection, unsafe/path-traversal name rejection, fatal UTF-8 decoding, safe JSON parsing, manifest/config/project validation, project-ID matching, and prohibited session/persistence-field detection before returning trusted state.

## Compatibility and migration

Format and schema versions are explicit. Current v1 opens directly. Newer versions are rejected with a structured incompatibility result. Older schemas require an explicit registered migration path. Migration is never silent and the future Project File Service must write migrated data to a new `.pmp`, leaving the original untouched.

The initial migration registry is intentionally empty because no historical project schema exists yet.

## Boundary

This module operates only on in-memory bytes and canonical application state. Filesystem access, browser file handles, save lifecycle, launcher behaviour, and the Project File Service belong to later implementation blocks.
