import type { ProjectState } from "../../application";
export type NamedEntityKind = "stream" | "task" | "milestone";
export function hasNewDuplicateName(state: ProjectState, kind: NamedEntityKind, name: string, originalName?: string, editingId?: string): boolean {
  const normalized = name.trim().toLocaleLowerCase();
  if (!normalized || (originalName !== undefined && normalized === originalName.trim().toLocaleLowerCase())) return false;
  const records = kind === "stream" ? state.streams : kind === "task" ? state.tasks : state.milestones;
  return records.some(record => !record.deletion.isDeleted && record.id !== editingId && record.name.trim().toLocaleLowerCase() === normalized);
}
