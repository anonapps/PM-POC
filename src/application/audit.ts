import type { ProjectState, AuditEvent } from "./state";

const COLLECTIONS = ["streams", "tasks", "milestones", "people", "risks", "decisions", "relationships", "dependencies"] as const;
const ENTITY_TYPES = { streams: "stream", tasks: "task", milestones: "milestone", people: "person", risks: "risk", decisions: "decision", relationships: "relationship", dependencies: "dependency" } as const;
export const MAX_AUDIT_EVENTS = 5000;
const MAX_SNAPSHOT_CHARS = 2000;
function compact(value: unknown): unknown {
  if (value === undefined) return undefined;
  const text = JSON.stringify(value);
  return text && text.length > MAX_SNAPSHOT_CHARS ? text.slice(0, MAX_SNAPSHOT_CHARS) + " [truncated]" : value;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const DERIVED_FIELDS = new Set(["riskLevel", "actualCompletionDate"]);
// Only editable project data belongs in the audit trail; runtime and file metadata do not.
const PROJECT_EXCLUDED_FIELDS = new Set(["metadata"]);
const TRACKED_FIELDS = new Set(["name", "title", "description", "startDate", "endDate", "plannedDate", "dueDate", "legacyDueDate", "status", "probability", "impact", "scope", "ownerId", "role", "notes", "priority", "progress", "parentTaskId", "milestoneId", "relatedStreamIds", "relatedTaskIds", "relatedMilestoneIds", "relatedRiskIds", "actions", "metadata", "decisionDate", "projectWide", "type", "source", "target", "predecessor", "successor"]);


export function recordAuditChange(before: ProjectState, after: ProjectState, command: string, timestamp: string): ProjectState {
  if (after.auditHistory?.enabled !== true || command === "set-audit-enabled" || command === "replace-state") return after;
  const events: AuditEvent[] = [];
  const humanIds = new Map([...after.streams, ...after.tasks, ...after.milestones, ...after.people, ...after.risks, ...after.decisions, ...before.streams, ...before.tasks, ...before.milestones, ...before.people, ...before.risks, ...before.decisions].map(item => [item.id, item.humanId]));
  const append = (entityType: string, entityId: string, action: AuditEvent["action"], field?: string, oldValue?: unknown, newValue?: unknown) => {
    const humanId = humanIds.get(entityId);
    events.push({ timestamp, command, entityType, entityId, ...(humanId ? { humanId } : {}), action, ...(field ? { field } : {}), ...(oldValue !== undefined ? { before: compact(oldValue) } : {}), ...(newValue !== undefined ? { after: compact(newValue) } : {}) });
  };
  const inspect = (entityType: string, oldEntity: Record<string, unknown> | undefined, newEntity: Record<string, unknown> | undefined, id: string) => {
    if (!oldEntity && newEntity) { append(entityType, id, "created", undefined, undefined, newEntity.humanId ?? newEntity.name ?? newEntity.title); return; }
    if (oldEntity && !newEntity) { append(entityType, id, "deleted"); return; }
    if (!oldEntity || !newEntity) return;
    const oldDeleted = (oldEntity.deletion as { isDeleted?: boolean } | undefined)?.isDeleted === true;
    const newDeleted = (newEntity.deletion as { isDeleted?: boolean } | undefined)?.isDeleted === true;
    if (oldDeleted !== newDeleted) { append(entityType, id, newDeleted ? "deleted" : "restored"); return; }
    if (entityType === "risk" && (!same(oldEntity.probability, newEntity.probability) || !same(oldEntity.impact, newEntity.impact)) && !same(oldEntity.riskLevel, newEntity.riskLevel)) append(entityType, id, "updated", "riskLevel", oldEntity.riskLevel, newEntity.riskLevel);
    for (const field of TRACKED_FIELDS) {
      if (DERIVED_FIELDS.has(field) || (entityType === "project" && PROJECT_EXCLUDED_FIELDS.has(field))) continue;
      if (!same(oldEntity[field], newEntity[field])) append(entityType, id, "updated", field, oldEntity[field], newEntity[field]);
    }
  };
  inspect("project", before.project as unknown as Record<string, unknown>, after.project as unknown as Record<string, unknown>, after.project.id);
  for (const collection of COLLECTIONS) {
    const previous = new Map(before[collection].map(entity => [entity.id, entity as unknown as Record<string, unknown>]));
    const current = new Map(after[collection].map(entity => [entity.id, entity as unknown as Record<string, unknown>]));
    for (const id of new Set([...previous.keys(), ...current.keys()])) inspect(ENTITY_TYPES[collection], previous.get(id), current.get(id), id);
  }
  if (!events.length) return after;
  const retained = after.auditHistory?.events ?? [];
  const incoming = events.slice(-MAX_AUDIT_EVENTS);
  const previousCount = Math.max(0, MAX_AUDIT_EVENTS - incoming.length);
  return { ...after, auditHistory: { enabled: true, events: [...(previousCount > 0 ? retained.slice(-previousCount) : []), ...incoming] } };
}

export function setAuditEnabled(enabled: boolean) { return { type: "set-audit-enabled", apply(state: ProjectState): ProjectState { return { ...state, auditHistory: { enabled, events: state.auditHistory?.events ?? [] } }; } }; }
