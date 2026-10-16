import type { ProjectState, AuditEvent } from "./state";

const COLLECTIONS = ["streams", "tasks", "milestones", "people", "risks", "decisions"] as const;
const ENTITY_TYPES = { streams: "stream", tasks: "task", milestones: "milestone", people: "person", risks: "risk", decisions: "decision" } as const;
export const MAX_AUDIT_EVENTS = 5000;
const MAX_SNAPSHOT_CHARS = 2000;
function compact(value: unknown): unknown {
  if (value === undefined) return undefined;
  const text = JSON.stringify(value);
  return text && text.length > MAX_SNAPSHOT_CHARS ? text.slice(0, MAX_SNAPSHOT_CHARS) + " [truncated]" : value;
}
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const DERIVED_FIELDS = new Set(["riskLevel", "actualCompletionDate"]);
const TRACKED_FIELDS = new Set(["name", "title", "description", "startDate", "endDate", "plannedDate", "dueDate", "status", "probability", "impact", "scope", "ownerId", "role", "notes", "priority", "progress", "parentTaskId", "milestoneId", "relatedStreamIds", "relatedTaskIds", "relatedMilestoneIds", "relatedRiskIds", "actions", "metadata", "decisionDate"]);


export function recordAuditChange(before: ProjectState, after: ProjectState, command: string, timestamp: string): ProjectState {
  if (after.auditHistory?.enabled !== true || command === "set-audit-enabled") return after;
  const events: AuditEvent[] = [];
  const append = (entityType: string, entityId: string, action: AuditEvent["action"], field?: string, oldValue?: unknown, newValue?: unknown) => {
    events.push({ timestamp, command, entityType, entityId, action, ...(field ? { field } : {}), ...(oldValue !== undefined ? { before: compact(oldValue) } : {}), ...(newValue !== undefined ? { after: compact(newValue) } : {}) });
  };
  const inspect = (entityType: string, oldEntity: Record<string, unknown> | undefined, newEntity: Record<string, unknown> | undefined, id: string) => {
    if (!oldEntity && newEntity) { append(entityType, id, "created", undefined, undefined, newEntity.humanId ?? newEntity.name); return; }
    if (oldEntity && !newEntity) { append(entityType, id, "deleted"); return; }
    if (!oldEntity || !newEntity) return;
    const oldDeleted = (oldEntity.deletion as { isDeleted?: boolean } | undefined)?.isDeleted;
    const newDeleted = (newEntity.deletion as { isDeleted?: boolean } | undefined)?.isDeleted;
    if (oldDeleted !== newDeleted) append(entityType, id, newDeleted ? "deleted" : "restored");
    if (entityType === "risk" && !same(oldEntity.riskLevel, newEntity.riskLevel)) append(entityType, id, "updated", "riskLevel", oldEntity.riskLevel, newEntity.riskLevel);
    for (const field of Object.keys(newEntity)) {
      if (!TRACKED_FIELDS.has(field) || DERIVED_FIELDS.has(field)) continue;
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
  return { ...after, auditHistory: { enabled: true, events: [...(after.auditHistory?.events ?? []), ...events].slice(-MAX_AUDIT_EVENTS) } };
}

export function setAuditEnabled(enabled: boolean) { return { type: "set-audit-enabled", apply(state: ProjectState): ProjectState { return { ...state, auditHistory: { enabled, events: state.auditHistory?.events ?? [] } }; } }; }
