import { calculateParentProgress, deriveParentCompletion, deriveParentTaskDates, issueHumanId, type EntityKind, type SequencedEntityKind, type Task } from "../domain";
import type { ProjectState } from "./state";

export interface CommandContext { readonly createId: () => string; readonly now: () => string; }
export interface ProjectCommand { readonly type: string; apply(state: ProjectState, context: CommandContext): ProjectState; }

export function replaceState(next: ProjectState): ProjectCommand { return { type: "replace-state", apply: () => next }; }

const keyFor = (kind: EntityKind): keyof ProjectState | null => kind === "stream" ? "streams" : kind === "task" ? "tasks" : kind === "milestone" ? "milestones" : kind === "person" ? "people" : kind === "risk" ? "risks" : kind === "decision" ? "decisions" : null;

export function softDelete(kind: Exclude<EntityKind, "project">, id: string): ProjectCommand {
  return lifecycleCommand("soft-delete", kind, id, true);
}
export function restore(kind: Exclude<EntityKind, "project">, id: string): ProjectCommand {
  return lifecycleCommand("restore", kind, id, false);
}
function lifecycleCommand(type: string, kind: Exclude<EntityKind, "project">, id: string, deleted: boolean): ProjectCommand {
  return { type, apply(state, context) {
    const key = keyFor(kind)!;
    const list = state[key] as readonly any[];
    const found = list.find((e) => e.id === id);
    if (!found || found.deletion.isDeleted === deleted) return state;
    return recalculate({ ...state, [key]: list.map((e) => e.id === id ? { ...e, deletion: deleted ? { isDeleted: true, deletedAt: context.now() } : { isDeleted: false } } : e) } as ProjectState);
  }};
}

export type DuplicableKind = "task" | "milestone" | "risk" | "decision";
export function duplicate(kind: DuplicableKind, id: string): ProjectCommand {
  return { type: `duplicate-${kind}`, apply(state, context) {
    const key = keyFor(kind)!;
    const list = state[key] as readonly any[];
    const source = list.find((e) => e.id === id && !e.deletion.isDeleted);
    if (!source) return state;
    const issued = issueHumanId(state.identifierSequences, kind as SequencedEntityKind);
    const active = activeIdSet(state);
    const common = { ...source, id: context.createId(), humanId: issued.humanId, deletion: { isDeleted: false } };
    let copy: any = common;
    if (kind === "task") copy = { ...common, name: `${source.name} (Copy)`, status: "Not Started", progress: 0, actualCompletionDate: undefined, milestoneId: source.milestoneId && active.has(source.milestoneId) ? source.milestoneId : undefined, parentTaskId: source.parentTaskId && active.has(source.parentTaskId) ? source.parentTaskId : undefined };
    if (kind === "milestone") copy = { ...common, name: `${source.name} (Copy)`, status: "Planned", actualCompletionDate: undefined, relatedTaskIds: source.relatedTaskIds.filter((x: string) => active.has(x)), scope: source.scope.kind === "streams" ? { ...source.scope, streamIds: source.scope.streamIds.filter((x: string) => active.has(x)) } : source.scope };
    if (kind === "risk") copy = { ...common, title: `${source.title} (Copy)`, status: "Open", relatedStreamIds: source.relatedStreamIds.filter((x: string) => active.has(x)), relatedTaskIds: source.relatedTaskIds.filter((x: string) => active.has(x)), relatedMilestoneIds: source.relatedMilestoneIds.filter((x: string) => active.has(x)), actions: source.actions.map((a: any) => ({ ...a, id: context.createId(), status: "Open" })) };
    if (kind === "decision") copy = { ...common, title: `${source.title} (Copy)`, decisionDate: context.now().slice(0, 10), relatedStreamIds: source.relatedStreamIds.filter((x: string) => active.has(x)), relatedTaskIds: source.relatedTaskIds.filter((x: string) => active.has(x)), relatedMilestoneIds: source.relatedMilestoneIds.filter((x: string) => active.has(x)), relatedRiskIds: source.relatedRiskIds.filter((x: string) => active.has(x)) };
    return recalculate({ ...state, [key]: [...list, copy], identifierSequences: issued.sequences } as ProjectState);
  }};
}

function activeIdSet(state: ProjectState) { return new Set([...state.streams, ...state.tasks, ...state.milestones, ...state.people, ...state.risks, ...state.decisions].filter((e) => !e.deletion.isDeleted).map((e) => e.id)); }

export function recalculate(state: ProjectState): ProjectState {
  let tasks = [...state.tasks];
  for (let pass = 0; pass < 4; pass += 1) tasks = tasks.map((task) => {
    const children = tasks.filter((child) => child.parentTaskId === task.id && !child.deletion.isDeleted);
    if (!children.length) return task;
    const progress = calculateParentProgress(children) ?? task.progress;
    const dates = deriveParentTaskDates(children);
    const completion = deriveParentCompletion(children);
    return { ...task, progress, ...dates, ...completion } as Task;
  });
  return { ...state, tasks };
}
