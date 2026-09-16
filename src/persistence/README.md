# Persistence layer

The `pmp` module implements the platform-independent `.pmp` archive codec, manifest/schema validation, compatibility inspection, and migration registry. Its public API is exported from `pmp/index.ts`. Persistence may consume canonical application state, but application and domain code never import it.

Filesystem access and the Project File Service are intentionally not part of Block 3.

## Browser overwrite boundary

The browser adapter delegates file selection and replacement consent to the native File System Access API picker. Chrome owns its overwrite prompt; the application does not layer a second, potentially contradictory overwrite dialog over that native consent. Cancellation is returned as `CANCELLED`, and the previous active handle remains authoritative unless the complete Save As write succeeds.
