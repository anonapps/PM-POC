import type { EntityKind, InternalId, ProjectId } from "./types";

export interface EntityReference {
  readonly kind: EntityKind;
  readonly id: InternalId;
}

export interface GenericRelationship {
  readonly id: InternalId;
  readonly projectId: ProjectId;
  readonly type: string;
  readonly source: EntityReference;
  readonly target: EntityReference;
}

export const DEPENDENCY_TYPES = [
  "Finish-to-Start",
  "Start-to-Start",
  "Finish-to-Finish",
  "Start-to-Finish",
] as const;
export type DependencyType = (typeof DEPENDENCY_TYPES)[number];
export type DependencyEntityKind = "task" | "milestone";

export interface DependencyEndpoint {
  readonly kind: DependencyEntityKind;
  readonly id: InternalId;
}

/** Dependencies are deliberately separate from generic relationships. */
export interface Dependency {
  readonly id: InternalId;
  readonly projectId: ProjectId;
  readonly predecessor: DependencyEndpoint;
  readonly successor: DependencyEndpoint;
  readonly type: DependencyType;
}

export function wouldCreateDependencyCycle(
  dependencies: readonly Dependency[],
  candidate: Dependency,
): boolean {
  const key = (endpoint: DependencyEndpoint) => `${endpoint.kind}:${endpoint.id}`;
  const candidateStart = key(candidate.predecessor);
  const candidateEnd = key(candidate.successor);
  if (candidateStart === candidateEnd) return true;

  const outgoing = new Map<string, string[]>();
  for (const dependency of [...dependencies, candidate]) {
    const from = key(dependency.predecessor);
    const targets = outgoing.get(from) ?? [];
    targets.push(key(dependency.successor));
    outgoing.set(from, targets);
  }

  const visited = new Set<string>();
  const pending = [candidateEnd];
  while (pending.length > 0) {
    const current = pending.pop();
    if (!current || visited.has(current)) continue;
    if (current === candidateStart) return true;
    visited.add(current);
    pending.push(...(outgoing.get(current) ?? []));
  }
  return false;
}
