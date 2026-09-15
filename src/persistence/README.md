# Persistence layer

The `pmp` module implements the platform-independent `.pmp` archive codec, manifest/schema validation, compatibility inspection, and migration registry. Its public API is exported from `pmp/index.ts`. Persistence may consume canonical application state, but application and domain code never import it.

Filesystem access and the Project File Service are intentionally not part of Block 3.
