import type { ProjectState } from "../../application/state";
import { CURRENT_PROJECT_SCHEMA_VERSION, type PmpResult } from "./types";

export type Migration = (state: unknown) => unknown;
const migrations = new Map<number, Migration>();

export function migrateProject(state: ProjectState, fromVersion: number, toVersion = CURRENT_PROJECT_SCHEMA_VERSION): PmpResult<ProjectState> {
  if (fromVersion === toVersion) return { ok: true, value: structuredClone(state) };
  if (fromVersion > toVersion || toVersion > CURRENT_PROJECT_SCHEMA_VERSION) return { ok: false, errors: [{ code: "MIGRATION_FAILURE", message: "Requested migration target is unavailable." }] };
  let current: unknown = structuredClone(state);
  for (let version = fromVersion; version < toVersion; version++) { const migration = migrations.get(version); if (!migration) return { ok: false, errors: [{ code: "MIGRATION_FAILURE", message: `No migration registered from schema ${version} to ${version + 1}.` }] }; current = migration(current); }
  return { ok: true, value: current as ProjectState };
}
