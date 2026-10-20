import type { Decision, Dependency, GenericRelationship, IdentifierSequences, Milestone, Person, Project, Risk, Stream, Task } from "../domain";
import { EMPTY_IDENTIFIER_SEQUENCES, sequencesFromHumanIds } from "../domain";

export interface AuditEvent { readonly timestamp: string; readonly command: string; readonly entityType: string; readonly entityId: string; readonly humanId?: string; readonly action: "created" | "updated" | "deleted" | "restored"; readonly field?: string; readonly before?: unknown; readonly after?: unknown }
export interface AuditHistory { readonly enabled: boolean; readonly events: readonly AuditEvent[] }

export interface ProjectState {
  readonly auditHistory?: AuditHistory;
  readonly project: Project;
  readonly streams: readonly Stream[];
  readonly tasks: readonly Task[];
  readonly milestones: readonly Milestone[];
  readonly people: readonly Person[];
  readonly risks: readonly Risk[];
  readonly decisions: readonly Decision[];
  readonly relationships: readonly GenericRelationship[];
  readonly dependencies: readonly Dependency[];
  readonly identifierSequences: IdentifierSequences;
}

export type HydratableProjectState = Omit<ProjectState, "identifierSequences"> & { readonly identifierSequences?: Partial<IdentifierSequences> };

export function hydrateProjectState(input: HydratableProjectState): ProjectState {
  const ids = [...input.streams, ...input.tasks, ...input.milestones, ...input.people, ...input.risks, ...input.decisions].map((entity) => entity.humanId);
  const reconstructed = sequencesFromHumanIds(ids);
  const supplied = input.identifierSequences ?? {};
  const identifierSequences = Object.fromEntries(
    Object.keys(EMPTY_IDENTIFIER_SEQUENCES).map((kind) => [kind, Math.max(reconstructed[kind as keyof IdentifierSequences], supplied[kind as keyof IdentifierSequences] ?? 0)]),
  ) as unknown as IdentifierSequences;
  return { ...input, identifierSequences };
}

export function projectStateEquals(left: ProjectState, right: ProjectState): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}
