import { taskScheduleDuration } from "../../domain/critical-path/calendar";
import type { ProjectWarning } from "../warnings/warnings";
import type { ProjectState } from "../../application/state";
import type { CriticalPathResult } from "../../domain/critical-path/types";
export function analysisRows(state: ProjectState, result: CriticalPathResult | null, scope: string | null) {
  const results = new Map(result?.activities.filter(a => a.kind === "task").map(a => [a.id, a]));
  return state.tasks.filter(t => !t.deletion.isDeleted && (scope === null || t.scope.kind === "stream" && t.scope.streamId === scope)).map(task => ({ task, activity: results.get(task.id) })).sort((a, b) => {
    const x = a.activity?.earliestStart, y = b.activity?.earliestStart;
    return (x && y ? x.localeCompare(y) : x ? -1 : y ? 1 : 0) || a.task.id.localeCompare(b.task.id);
  });
}
export const displayAnalysisDate = (date: string | null | undefined) => date ? `${date.slice(8, 10)}/${date.slice(5, 7)}/${date.slice(0, 4)}` : "—";

/** Use the engine's eligibility rule even while a fresh result is pending. */
export function analysisTaskClassification(row: ReturnType<typeof analysisRows>[number]): "Unscheduled" | "Unresolved" | "Critical" | "Noncritical" {
  return taskScheduleDuration(row.task) === null ? "Unscheduled" : row.activity?.critical == null ? "Unresolved" : row.activity.critical ? "Critical" : "Noncritical";
}

/** Reuse projected warning records; linked milestone diagnostics belong beside the relationship. */
export function analysisTaskWarnings(state: ProjectState, warnings: readonly ProjectWarning[], taskId: string): readonly ProjectWarning[] {
  const links = new Set(state.dependencies.filter(dependency =>
    dependency.predecessor.kind === "task" && dependency.predecessor.id === taskId ||
    dependency.successor.kind === "task" && dependency.successor.id === taskId
  ).map(dependency => dependency.id));
  return warnings.filter(warning => warning.entityType === "Task" && warning.entityId === taskId ||
    warning.entityType === "Milestone" && warning.dependencyId !== undefined && links.has(warning.dependencyId));
}
