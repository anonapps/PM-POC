import type { Task } from "./entities";
import type { LifecycleStatus, LocalDate, TaskId } from "./types";

export const MAX_TASK_HIERARCHY_DEPTH = 4;

const activeTasks = (tasks: readonly Task[]) =>
  tasks.filter((task) => !task.deletion.isDeleted);

export function calculateStreamProgress(
  streamId: string,
  tasks: readonly Task[],
): number | null {
  const active = activeTasks(tasks);
  const parentIds = new Set(
    active.flatMap((task) => (task.parentTaskId ? [task.parentTaskId] : [])),
  );
  const leaves = active.filter(
    (task) =>
      task.scope.kind === "stream" &&
      task.scope.streamId === streamId &&
      !parentIds.has(task.id),
  );
  return averageProgress(leaves);
}

export function calculateParentProgress(children: readonly Task[]): number | null {
  return averageProgress(activeTasks(children));
}

function averageProgress(tasks: readonly Task[]): number | null {
  if (tasks.length === 0) return null;
  return Math.round(tasks.reduce((total, task) => total + task.progress, 0) / tasks.length);
}

/** Legacy helper retained for API compatibility; v1.1 never applies it automatically. */
export function deriveParentTaskDates(children: readonly Task[]) {
  const active = activeTasks(children);
  const starts = active.flatMap((child) => child.startDate ? [child.startDate] : []);
  const ends = active.flatMap((child) => child.endDate ? [child.endDate] : []);
  return { startDate: starts.length ? starts.reduce((a,b)=>a<b?a:b) : undefined, endDate: ends.length ? ends.reduce(laterDate) : undefined };
}

const laterDate = (left: LocalDate, right: LocalDate) =>
  left > right ? left : right;

export interface ParentCompletion {
  readonly status: LifecycleStatus;
  readonly actualCompletionDate?: LocalDate;
}

export function deriveParentCompletion(
  children: readonly Task[],
): ParentCompletion {
  const active = activeTasks(children);
  const allComplete =
    active.length > 0 && active.every((child) => child.status === "Completed");
  if (!allComplete) return { status: "In Progress" };

  const completionDates = active.flatMap((child) =>
    child.actualCompletionDate ? [child.actualCompletionDate] : [],
  );
  return {
    status: "Completed",
    actualCompletionDate:
      completionDates.length === active.length
        ? completionDates.reduce(laterDate)
        : undefined,
  };
}

export function setLeafTaskStatus(
  task: Task,
  status: LifecycleStatus,
  currentDate: LocalDate,
): Task {
  return {
    ...task,
    status,
    actualCompletionDate: status === "Completed" ? currentDate : undefined,
  };
}

export function getTaskHierarchyDepth(
  taskId: TaskId,
  tasks: readonly Task[],
): number | null {
  const byId = new Map(tasks.map((task) => [task.id, task]));
  let task = byId.get(taskId);
  if (!task) return null;

  let depth = 1;
  const visited = new Set<TaskId>([task.id]);
  while (task.parentTaskId) {
    if (visited.has(task.parentTaskId)) return null;
    visited.add(task.parentTaskId);
    task = byId.get(task.parentTaskId);
    if (!task) return null;
    depth += 1;
  }
  return depth;
}
