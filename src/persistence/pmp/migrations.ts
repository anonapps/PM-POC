import type { ProjectState } from "../../application/state";
import { CURRENT_PROJECT_SCHEMA_VERSION, type PmpResult } from "./types";

export type Migration = (state: unknown) => unknown;
const migrations = new Map<number, Migration>();
migrations.set(1, (input) => {
  const state = structuredClone(input) as Record<string, unknown>;
  const project = state.project as Record<string, unknown>;
  project.metadata = { ...(project.metadata as Record<string, unknown>), schemaVersion: 2, minimumAppVersion: "1.1.0" };
  const dependencies = Array.isArray(state.dependencies) ? [...state.dependencies] : [];
  state.tasks = (state.tasks as Record<string, unknown>[]).map((task) => {
    const legacy = typeof task.dependencyTaskId === "string" ? task.dependencyTaskId : undefined;
    if (legacy) dependencies.push({ id: `migrated-${task.id}-${legacy}`, projectId: project.id, predecessor: { kind: "task", id: legacy }, successor: { kind: "task", id: task.id }, type: "Finish-to-Start" });
    const rest = { ...task }; const legacyDue = rest.dueDate; delete rest.dependencyTaskId; delete rest.dueDate;
    return { ...rest, startDate: task.startDate ?? null, endDate: task.endDate ?? legacyDue ?? null };
  });
  state.milestones = (state.milestones as Record<string, unknown>[]).map((milestone) => ({ ...milestone, scope: milestone.scope ?? { kind: "project" } }));
  state.dependencies = dependencies;
  return state;
});

export function migrateProject(state: ProjectState, fromVersion: number, toVersion = CURRENT_PROJECT_SCHEMA_VERSION): PmpResult<ProjectState> {
  if (fromVersion === toVersion) return { ok: true, value: structuredClone(state) };
  if (fromVersion > toVersion || toVersion > CURRENT_PROJECT_SCHEMA_VERSION) return { ok: false, errors: [{ code: "MIGRATION_FAILURE", message: "Requested migration target is unavailable." }] };
  let current: unknown = structuredClone(state);
  for (let version = fromVersion; version < toVersion; version++) { const migration = migrations.get(version); if (!migration) return { ok: false, errors: [{ code: "MIGRATION_FAILURE", message: `No migration registered from schema ${version} to ${version + 1}.` }] }; current = migration(current); }
  return { ok: true, value: current as ProjectState };
}
