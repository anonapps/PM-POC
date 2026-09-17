import type { ProjectState } from "@/application";
import type { ModuleName } from "@/features/shell/shell";

export type WarningEntityType = "Stream" | "Task" | "Milestone";
export type WarningType =
  | "Invalid date range"
  | "Outside project dates"
  | "Outside stream dates"
  | "Child outside parent schedule"
  | "Finish-to-Start violation"
  | "Deleted predecessor"
  | "Deleted milestone stream"
  | "Task in deleted stream";

export interface ProjectWarning {
  readonly id: string;
  readonly type: WarningType;
  readonly severity: "warning";
  readonly entityType: WarningEntityType;
  readonly entityId: string;
  readonly humanId: string;
  readonly entityName: string;
  readonly description: string;
  readonly relatedDate?: string;
  readonly destination: ModuleName;
  readonly action?: { kind: "remove-dependency" | "remove-scope"; referenceId: string; label: string };
}

const before = (date?: string | null, boundary?: string | null) => Boolean(date && boundary && date < boundary);
const after = (date?: string | null, boundary?: string | null) => Boolean(date && boundary && date > boundary);

export function deriveProjectWarnings(state: ProjectState): ProjectWarning[] {
  const warnings: ProjectWarning[] = [];
  const add = (warning: Omit<ProjectWarning, "severity">) => warnings.push({ ...warning, severity: "warning" });
  const activeTasks = new Map(state.tasks.filter((task) => !task.deletion.isDeleted).map((task) => [task.id, task]));
  const allTasks = new Map(state.tasks.map((task) => [task.id, task]));
  const streams = new Map(state.streams.map((stream) => [stream.id, stream]));

  for (const stream of state.streams.filter((item) => !item.deletion.isDeleted)) {
    if (stream.startDate && stream.endDate && stream.startDate > stream.endDate) add({ id: `stream-range:${stream.id}`, type: "Invalid date range", entityType: "Stream", entityId: stream.id, humanId: stream.humanId, entityName: stream.name, description: "Stream starts after it ends.", relatedDate: stream.startDate, destination: "Streams" });
    if (before(stream.startDate, state.project.startDate) || after(stream.endDate, state.project.endDate)) add({ id: `stream-project:${stream.id}`, type: "Outside project dates", entityType: "Stream", entityId: stream.id, humanId: stream.humanId, entityName: stream.name, description: "Stream dates extend outside the Project date range.", relatedDate: before(stream.startDate, state.project.startDate) ? stream.startDate ?? undefined : stream.endDate ?? undefined, destination: "Streams" });
  }

  for (const task of activeTasks.values()) {
    if (task.startDate && task.endDate && task.startDate > task.endDate) add({ id: `task-range:${task.id}`, type: "Invalid date range", entityType: "Task", entityId: task.id, humanId: task.humanId, entityName: task.name, description: "Task starts after it ends. Correct the dates before saving.", relatedDate: task.startDate, destination: "Tasks" });
    if (before(task.startDate, state.project.startDate) || after(task.endDate, state.project.endDate)) add({ id: `task-project:${task.id}`, type: "Outside project dates", entityType: "Task", entityId: task.id, humanId: task.humanId, entityName: task.name, description: "Task dates extend outside the Project date range.", relatedDate: before(task.startDate, state.project.startDate) ? task.startDate ?? undefined : task.endDate ?? undefined, destination: "Tasks" });
    const parent = task.parentTaskId ? activeTasks.get(task.parentTaskId) : undefined;
    if (parent?.startDate && parent.endDate && task.startDate && task.endDate && (task.startDate < parent.startDate || task.endDate > parent.endDate)) add({ id: `child-schedule:${task.id}`, type: "Child outside parent schedule", entityType: "Task", entityId: task.id, humanId: task.humanId, entityName: task.name, description: `Task schedule extends outside parent ${parent.humanId}.`, relatedDate: task.startDate, destination: "Tasks" });
    if (task.scope.kind === "stream") {
      const stream = streams.get(task.scope.streamId);
      if (stream?.deletion.isDeleted) add({ id: `deleted-task-stream:${task.id}`, type: "Task in deleted stream", entityType: "Task", entityId: task.id, humanId: task.humanId, entityName: task.name, description: "Active Task belongs to a deleted Stream.", destination: "Tasks" });
      else if (stream && (before(task.startDate, stream.startDate) || after(task.endDate, stream.endDate))) add({ id: `task-stream:${task.id}`, type: "Outside stream dates", entityType: "Task", entityId: task.id, humanId: task.humanId, entityName: task.name, description: `Task dates extend outside ${stream.name}.`, relatedDate: before(task.startDate, stream.startDate) ? task.startDate ?? undefined : task.endDate ?? undefined, destination: "Tasks" });
    }
  }

  for (const dependency of state.dependencies.filter((item) => item.type === "Finish-to-Start" && item.predecessor.kind === "task" && item.successor.kind === "task")) {
    const predecessor = allTasks.get(dependency.predecessor.id);
    const dependent = activeTasks.get(dependency.successor.id);
    if (!predecessor || !dependent) continue;
    if (predecessor.deletion.isDeleted) add({ id: `deleted-dependency:${dependency.id}`, type: "Deleted predecessor", entityType: "Task", entityId: dependent.id, humanId: dependent.humanId, entityName: dependent.name, description: `Dependency references deleted ${predecessor.humanId}.`, destination: "Tasks", action: { kind: "remove-dependency", referenceId: predecessor.id, label: "Remove dependency" } });
    else if (predecessor.startDate && predecessor.endDate && dependent.startDate && dependent.endDate && dependent.startDate < predecessor.endDate) add({ id: `fs:${dependency.id}`, type: "Finish-to-Start violation", entityType: "Task", entityId: dependent.id, humanId: dependent.humanId, entityName: dependent.name, description: `Starts before predecessor ${predecessor.humanId} ends.`, relatedDate: dependent.startDate, destination: "Tasks" });
  }

  for (const milestone of state.milestones.filter((item) => !item.deletion.isDeleted)) {
    if (before(milestone.plannedDate, state.project.startDate) || after(milestone.plannedDate, state.project.endDate)) add({ id: `milestone-project:${milestone.id}`, type: "Outside project dates", entityType: "Milestone", entityId: milestone.id, humanId: milestone.humanId, entityName: milestone.name, description: "Milestone is outside the Project date range.", relatedDate: milestone.plannedDate, destination: "Milestones" });
    if (milestone.scope.kind !== "streams") continue;
    const activeRelated = milestone.scope.streamIds.map((id) => streams.get(id)).filter((stream) => stream && !stream.deletion.isDeleted);
    if (activeRelated.length && activeRelated.every((stream) => before(milestone.plannedDate, stream?.startDate) || after(milestone.plannedDate, stream?.endDate))) add({ id: `milestone-stream:${milestone.id}`, type: "Outside stream dates", entityType: "Milestone", entityId: milestone.id, humanId: milestone.humanId, entityName: milestone.name, description: "Milestone is outside all related Stream date ranges.", relatedDate: milestone.plannedDate, destination: "Milestones" });
    for (const streamId of milestone.scope.streamIds) {
      const stream = streams.get(streamId);
      if (stream?.deletion.isDeleted) add({ id: `deleted-scope:${milestone.id}:${streamId}`, type: "Deleted milestone stream", entityType: "Milestone", entityId: milestone.id, humanId: milestone.humanId, entityName: milestone.name, description: `Milestone scope references deleted ${stream.humanId}.`, relatedDate: milestone.plannedDate, destination: "Milestones", action: { kind: "remove-scope", referenceId: streamId, label: "Remove from milestone scope" } });
    }
  }

  return warnings.sort((left, right) => (left.relatedDate ?? "9999").localeCompare(right.relatedDate ?? "9999") || left.id.localeCompare(right.id));
}
