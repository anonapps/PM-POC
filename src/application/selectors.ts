import type { Dependency, EntityKind, EntityReference, GenericRelationship } from "../domain";
import type { ProjectState } from "./state";

function activeIds(state: ProjectState): Set<string> {
  const entities = [...state.streams, ...state.tasks, ...state.milestones, ...state.people, ...state.risks, ...state.decisions];
  return new Set([state.project.id, ...entities.filter((entity) => !entity.deletion.isDeleted).map((entity) => entity.id)]);
}

export const selectActiveStreams = (s: ProjectState) => s.streams.filter((e) => !e.deletion.isDeleted);
export const selectActiveTasks = (s: ProjectState) => s.tasks.filter((e) => !e.deletion.isDeleted);
export const selectActiveMilestones = (s: ProjectState) => s.milestones.filter((e) => !e.deletion.isDeleted);
export const selectActivePeople = (s: ProjectState) => s.people.filter((e) => !e.deletion.isDeleted);
export const selectActiveRisks = (s: ProjectState) => s.risks.filter((e) => !e.deletion.isDeleted);
export const selectActiveDecisions = (s: ProjectState) => s.decisions.filter((e) => !e.deletion.isDeleted);

export function isReferenceActive(state: ProjectState, reference: EntityReference): boolean {
  if (reference.kind === "project") return reference.id === state.project.id;
  return activeIds(state).has(reference.id);
}

export function selectActiveRelationships(state: ProjectState): readonly GenericRelationship[] {
  return state.relationships.filter((r) => isReferenceActive(state, r.source) && isReferenceActive(state, r.target));
}

export function selectActiveDependencies(state: ProjectState): readonly Dependency[] {
  const ids = activeIds(state);
  return state.dependencies.filter((d) => ids.has(d.predecessor.id) && ids.has(d.successor.id));
}

export function selectEntity(state: ProjectState, kind: EntityKind, id: string) {
  if (kind === "project") return state.project.id === id ? state.project : undefined;
  const collection = kind === "stream" ? state.streams : kind === "task" ? state.tasks : kind === "milestone" ? state.milestones : kind === "person" ? state.people : kind === "risk" ? state.risks : state.decisions;
  return collection.find((e) => e.id === id);
}
