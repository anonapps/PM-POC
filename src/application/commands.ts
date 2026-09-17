import {
  calculateParentProgress,
  deriveParentCompletion,
  issueHumanId,
  type Decision,
  type EntityKind,
  type Milestone,
  type Risk,
  type Task,
} from "../domain";
import type { ProjectState } from "./state";

export interface CommandContext {
  readonly createId: () => string;
  readonly now: () => string;
}

export interface ProjectCommand {
  readonly type: string;
  apply(state: ProjectState, context: CommandContext): ProjectState;
}

export function replaceState(next: ProjectState): ProjectCommand {
  return { type: "replace-state", apply: () => next };
}

export function softDelete(kind: Exclude<EntityKind, "project">, id: string): ProjectCommand {
  return lifecycleCommand("soft-delete", kind, id, true);
}

export function restore(kind: Exclude<EntityKind, "project">, id: string): ProjectCommand {
  return lifecycleCommand("restore", kind, id, false);
}

function lifecycleCommand(type: string, kind: Exclude<EntityKind, "project">, id: string, deleted: boolean): ProjectCommand {
  return {
    type,
    apply(state, context) {
      const update = <Entity extends { readonly id: string; readonly deletion: { readonly isDeleted: boolean } }>(
        entities: readonly Entity[],
      ): readonly Entity[] | null => {
        const found = entities.find((entity) => entity.id === id);
        if (!found || found.deletion.isDeleted === deleted) return null;
        return entities.map((entity) =>
          entity.id === id
            ? {
                ...entity,
                deletion: deleted
                  ? { isDeleted: true, deletedAt: context.now() }
                  : { isDeleted: false },
              }
            : entity,
        );
      };

      if (kind === "stream") {
        const entities = update(state.streams);
        return entities ? recalculate({ ...state, streams: entities }) : state;
      }
      if (kind === "task") {
        const entities = update(state.tasks);
        if (!entities) return state;
        const source = state.tasks.find((task) => task.id === id);
        const tasks = deleted ? entities.map((task) => task.parentTaskId === id && !task.deletion.isDeleted
          ? { ...task, parentTaskId: source?.parentTaskId }
          : task) : entities;
        return recalculate({ ...state, tasks });
      }
      if (kind === "milestone") {
        const entities = update(state.milestones);
        return entities ? recalculate({ ...state, milestones: entities }) : state;
      }
      if (kind === "person") {
        const entities = update(state.people);
        return entities ? recalculate({ ...state, people: entities }) : state;
      }
      if (kind === "risk") {
        const entities = update(state.risks);
        return entities ? recalculate({ ...state, risks: entities }) : state;
      }
      const entities = update(state.decisions);
      return entities ? recalculate({ ...state, decisions: entities }) : state;
    },
  };
}

export type DuplicableKind = "task" | "milestone" | "risk" | "decision";

export function duplicate(kind: DuplicableKind, id: string): ProjectCommand {
  return {
    type: `duplicate-${kind}`,
    apply(state, context) {
      const active = activeIdSet(state);
      const ownerIfActive = (ownerId: string | null) =>
        ownerId && active.has(ownerId) ? ownerId : null;

      if (kind === "task") {
        const source = state.tasks.find((task) => task.id === id && !task.deletion.isDeleted);
        if (!source) return state;
        const issued = issueHumanId(state.identifierSequences, "task");
        const copy: Task = {
          ...source,
          id: context.createId(),
          humanId: issued.humanId,
          name: `${source.name} (Copy)`,
          status: "Not Started",
          progress: 0,
          actualCompletionDate: undefined,
          ownerId: ownerIfActive(source.ownerId),
          milestoneId: source.milestoneId && active.has(source.milestoneId) ? source.milestoneId : undefined,
          parentTaskId: source.parentTaskId && active.has(source.parentTaskId) ? source.parentTaskId : undefined,
          deletion: { isDeleted: false },
        };
        return recalculate({ ...state, tasks: [...state.tasks, copy], identifierSequences: issued.sequences });
      }

      if (kind === "milestone") {
        const source = state.milestones.find((milestone) => milestone.id === id && !milestone.deletion.isDeleted);
        if (!source) return state;
        const issued = issueHumanId(state.identifierSequences, "milestone");
        const copy: Milestone = {
          ...source,
          id: context.createId(),
          humanId: issued.humanId,
          name: `${source.name} (Copy)`,
          status: "Tentative",
          actualCompletionDate: undefined,
          ownerId: ownerIfActive(source.ownerId),
          relatedTaskIds: source.relatedTaskIds.filter((taskId) => active.has(taskId)),
          scope: source.scope.kind === "streams"
            ? { ...source.scope, streamIds: source.scope.streamIds.filter((streamId) => active.has(streamId)) }
            : source.scope,
          deletion: { isDeleted: false },
        };
        return recalculate({ ...state, milestones: [...state.milestones, copy], identifierSequences: issued.sequences });
      }

      if (kind === "risk") {
        const source = state.risks.find((risk) => risk.id === id && !risk.deletion.isDeleted);
        if (!source) return state;
        const issued = issueHumanId(state.identifierSequences, "risk");
        const copy: Risk = {
          ...source,
          id: context.createId(),
          humanId: issued.humanId,
          title: `${source.title} (Copy)`,
          status: "Open",
          ownerId: ownerIfActive(source.ownerId),
          relatedStreamIds: source.relatedStreamIds.filter((streamId) => active.has(streamId)),
          relatedTaskIds: source.relatedTaskIds.filter((taskId) => active.has(taskId)),
          relatedMilestoneIds: source.relatedMilestoneIds.filter((milestoneId) => active.has(milestoneId)),
          actions: source.actions.map((action) => ({ ...action, id: context.createId(), status: "Open" })),
          deletion: { isDeleted: false },
        };
        return recalculate({ ...state, risks: [...state.risks, copy], identifierSequences: issued.sequences });
      }

      const source = state.decisions.find((decision) => decision.id === id && !decision.deletion.isDeleted);
      if (!source) return state;
      const issued = issueHumanId(state.identifierSequences, "decision");
      const copy: Decision = {
        ...source,
        id: context.createId(),
        humanId: issued.humanId,
        title: `${source.title} (Copy)`,
        decisionDate: context.now().slice(0, 10),
        ownerId: ownerIfActive(source.ownerId),
        relatedStreamIds: source.relatedStreamIds.filter((streamId) => active.has(streamId)),
        relatedTaskIds: source.relatedTaskIds.filter((taskId) => active.has(taskId)),
        relatedMilestoneIds: source.relatedMilestoneIds.filter((milestoneId) => active.has(milestoneId)),
        relatedRiskIds: source.relatedRiskIds.filter((riskId) => active.has(riskId)),
        deletion: { isDeleted: false },
      };
      return recalculate({ ...state, decisions: [...state.decisions, copy], identifierSequences: issued.sequences });
    },
  };
}

function activeIdSet(state: ProjectState) {
  return new Set(
    [...state.streams, ...state.tasks, ...state.milestones, ...state.people, ...state.risks, ...state.decisions]
      .filter((entity) => !entity.deletion.isDeleted)
      .map((entity) => entity.id),
  );
}

export function recalculate(state: ProjectState): ProjectState {
  let tasks = [...state.tasks];
  for (let pass = 0; pass < 4; pass += 1)
    tasks = tasks.map((task) => {
      const children = tasks.filter((child) => child.parentTaskId === task.id && !child.deletion.isDeleted);
      if (!children.length) return task;
      const progress = calculateParentProgress(children) ?? task.progress;
      const completion = deriveParentCompletion(children);
      return { ...task, progress, ...completion } as Task;
    });
  return { ...state, tasks };
}
