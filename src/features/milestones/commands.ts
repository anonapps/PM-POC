import { issueHumanId, type Milestone, type MilestoneScope, type MilestoneStatus } from "../../domain";
import type { ProjectCommand, ProjectState } from "../../application";

export interface MilestoneDraft {
  name: string;
  description?: string;
  plannedDate: string;
  status: MilestoneStatus;
  ownerId: string | null;
  priority?: Milestone["priority"];
  scope: MilestoneScope;
  relatedTaskIds: readonly string[];
}

export function validateMilestone(state: ProjectState, draft: MilestoneDraft, historicalStreamIds: readonly string[] = []): readonly string[] {
  const errors: string[] = [];
  if (!draft.name.trim()) errors.push("Milestone name is required.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.plannedDate)) errors.push("Milestone date is required.");
  if (draft.ownerId && !state.people.some((person) => person.id === draft.ownerId && !person.deletion.isDeleted)) errors.push("Owner must be active.");
  if (draft.scope.kind === "streams" && draft.scope.streamIds.length === 0) errors.push("Select at least one active Stream or Project-wide.");
  if (draft.scope.kind === "streams" && draft.scope.streamIds.some((id) => !historicalStreamIds.includes(id) && !state.streams.some((stream) => stream.id === id && !stream.deletion.isDeleted))) errors.push("Related streams must be active.");
  if (draft.relatedTaskIds.some((id) => !state.tasks.some((task) => task.id === id && !task.deletion.isDeleted))) errors.push("Related tasks must be active.");
  return errors;
}

export function createMilestone(draft: MilestoneDraft): ProjectCommand {
  return { type: "create-milestone", apply(state, context) {
    if (validateMilestone(state, draft).length) return state;
    const issued = issueHumanId(state.identifierSequences, "milestone");
    const milestone: Milestone = { ...draft, name: draft.name.trim(), id: context.createId(), projectId: state.project.id, humanId: issued.humanId, actualCompletionDate: draft.status === "Complete" ? context.now().slice(0, 10) : undefined, deletion: { isDeleted: false } };
    return { ...state, milestones: [...state.milestones, milestone], identifierSequences: issued.sequences };
  } };
}

export function editMilestone(id: string, patch: Partial<MilestoneDraft>): ProjectCommand {
  return { type: "edit-milestone", apply(state, context) {
    const current = state.milestones.find((milestone) => milestone.id === id);
    if (!current) return state;
    const draft = { ...current, ...patch };
    const historicalStreamIds = current.scope.kind === "streams" ? current.scope.streamIds.filter((streamId) => state.streams.some((stream) => stream.id === streamId && stream.deletion.isDeleted)) : [];
    const errors = validateMilestone(state, draft, historicalStreamIds);
    // Historical deleted scope references do not block unrelated edits.
    if (errors.length && (patch.scope !== undefined || errors.some((error) => !error.includes("streams must be active")))) return state;
    const actualCompletionDate = patch.status ? (patch.status === "Complete" ? context.now().slice(0, 10) : undefined) : current.actualCompletionDate;
    return { ...state, milestones: state.milestones.map((milestone) => milestone.id === id ? { ...milestone, ...patch, name: draft.name.trim(), actualCompletionDate } : milestone) };
  } };
}

export const selectUpcomingMilestones = (state: ProjectState) => state.milestones.filter((milestone) => !milestone.deletion.isDeleted && milestone.status !== "Complete").sort((left, right) => left.plannedDate.localeCompare(right.plannedDate)).slice(0, 5);
