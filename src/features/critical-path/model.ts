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
