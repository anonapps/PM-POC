import { getTaskHierarchyDepth, type Milestone, type Stream, type Task } from "../../domain";
import { selectActiveDependencies, type ProjectState } from "../../application";

export type GanttRow =
  | { kind: "stream"; id: string; label: string; start?: string; end?: string; progress: number | null; depth: 0 }
  | { kind: "task"; id: string; label: string; start?: string; end?: string; progress: number; depth: number; scope: "stream" | "project" }
  | { kind: "milestone"; id: string; label: string; start: string; end: string; progress: number; depth: 0 };
export interface GanttModel { start: string; end: string; rows: readonly GanttRow[]; dependencies: readonly { from: string; to: string; type: string }[] }

const day = 86_400_000;
const time = (date: string) => Date.parse(`${date}T00:00:00Z`);
export function positionForDate(date: string, start: string, end: string) { const span = Math.max(day, time(end) - time(start)); return Math.max(0, Math.min(100, ((time(date) - time(start)) / span) * 100)); }
export function barPosition(start: string | undefined, end: string | undefined, rangeStart: string, rangeEnd: string) { if (!start && !end) return null; const left = positionForDate(start ?? end!, rangeStart, rangeEnd); const right = positionForDate(end ?? start!, rangeStart, rangeEnd); return { left, width: Math.max(0.75, right - left) }; }

function taskRows(tasks: readonly Task[], scope: "project" | "stream", streamId?: string): GanttRow[] {
  const included = tasks.filter((task) => !task.deletion.isDeleted && (scope === "project" ? task.scope.kind === "project" : task.scope.kind === "stream" && task.scope.streamId === streamId));
  const children = new Map<string | undefined, Task[]>();
  for (const task of included) children.set(task.parentTaskId, [...(children.get(task.parentTaskId) ?? []), task]);
  const visit = (parent: string | undefined): GanttRow[] => (children.get(parent) ?? []).flatMap((task) => [{ kind: "task" as const, id: task.id, label: task.name, start: task.startDate, end: task.endDate, progress: task.progress, depth: Math.min(4, getTaskHierarchyDepth(task.id, tasks) ?? 1), scope }, ...visit(task.id)]);
  return visit(undefined);
}
export function buildGanttModel(state: ProjectState): GanttModel {
  const streams = state.streams.filter((stream) => !stream.deletion.isDeleted);
  const milestones = state.milestones.filter((milestone) => !milestone.deletion.isDeleted);
  const dated = [state.project.startDate, state.project.endDate, ...streams.flatMap((stream: Stream) => [stream.startDate, stream.endDate]), ...state.tasks.filter((task) => !task.deletion.isDeleted).flatMap((task: Task) => [task.startDate, task.endDate]), ...milestones.map((milestone: Milestone) => milestone.plannedDate)].filter((date): date is string => Boolean(date)).sort();
  const start = dated[0] ?? state.project.startDate;
  const end = dated.at(-1) ?? state.project.startDate;
  const rows: GanttRow[] = [...taskRows(state.tasks, "project")];
  for (const stream of streams) rows.push({ kind: "stream", id: stream.id, label: stream.name, start: stream.startDate, end: stream.endDate, progress: null, depth: 0 }, ...taskRows(state.tasks, "stream", stream.id));
  rows.push(...milestones.map((milestone) => ({ kind: "milestone" as const, id: milestone.id, label: milestone.name, start: milestone.plannedDate, end: milestone.plannedDate, progress: milestone.status === "Complete" ? 100 : 0, depth: 0 as const })));
  const ids = new Set(rows.map((row) => row.id));
  const dependencies = selectActiveDependencies(state).filter((dependency) => ids.has(dependency.predecessor.id) && ids.has(dependency.successor.id)).map((dependency) => ({ from: dependency.predecessor.id, to: dependency.successor.id, type: dependency.type }));
  return { start, end, rows, dependencies };
}
