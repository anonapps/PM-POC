import type { CalculationSource, CriticalPathResult } from "../domain/critical-path/types";

export function criticalPathToCsv(source: CalculationSource, result: CriticalPathResult): string {
  const quote = (value: unknown) => { const text = value == null ? "" : String(value); const safe = typeof value === "string" && /^[\s\uFEFF]*[=+@-]/u.test(text) ? `'${text}` : text; return `"${safe.replace(/"/g, '""')}"`; };
  const byId = new Map(result.activities.filter(a => a.kind === "task").map(a => [a.id, a]));
  const rows: unknown[][] = [["Task ID", "Name", "Stream", "Calculation scope", "Planned start", "Planned finish", "Calculated start", "Calculated finish", "Latest start", "Latest finish", "Critical", "Total float", "Free float", "Calculation status", "Dates reliable", "Float reliable", "Criticality reliable", "Completion provisional"]];
  for (const task of source.tasks.filter(t => !t.deletion.isDeleted && (result.scope === null || t.scope.kind === "stream" && t.scope.streamId === result.scope))) {
    const activity = byId.get(task.id);
    rows.push([task.humanId, task.name, task.scope.kind === "project" ? "Project-wide" : source.streams.find(s => task.scope.kind === "stream" && s.id === task.scope.streamId)?.name ?? task.scope.streamId, result.scope ?? "Project-wide", task.startDate, task.endDate, activity?.earliestStart, activity?.earliestFinish, activity?.latestStart, activity?.latestFinish, activity?.critical == null ? "Unresolved" : activity.critical ? "Yes" : "No", activity?.totalFloat, activity?.freeFloat, activity?.unscheduled ? "Unscheduled" : result.status, activity?.datesReliable ?? false, activity?.floatReliable ?? false, activity?.criticalityReliable ?? false, result.provisional]);
  }
  return rows.map(row => row.map(quote).join(",")).join("\r\n");
}
