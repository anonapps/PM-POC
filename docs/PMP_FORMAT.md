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
