import type { ProjectState, AuditEvent } from "./state";

const COLLECTIONS = ["streams", "tasks", "milestones", "people", "risks", "decisions"] as const;
export const MAX_AUDIT_EVENTS = 5000;
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

export function recordAuditChange(before: ProjectState, after: ProjectState, command: string, timestamp: string): ProjectState {
  if (after.auditHistory?.enabled !== true || command === "set-audit-enabled") return after;
  const events: AuditEvent[] = [];
  const append = (entityType: string, entityId: string, action: AuditEvent["action"], field?: string, oldValue?: unknown, newValue?: unknown) => {
    events.push({ timestamp, command, entityType, entityId, action, ...(field ? { field } : {}), ...(oldValue !== undefined ? { before: oldValue } : {}), ...(newValue !== undefined ? { after: newValue } : {}) });
  };
  const inspect = (entityType: string, oldEntity: Record<string, unknown> | undefined, newEntity: Record<string, unknown> | undefined, id: string) => {
    if (!oldEntity && newEntity) { append(entityType, id, "created", undefined, undefined, newEntity.humanId ?? newEntity.name); return; }
    if (oldEntity && !newEntity) { append(entityType, id, "deleted"); return; }
    if (!oldEntity || !newEntity) return;
    const oldDeleted = (oldEntity.deletion as { isDeleted?: boolean } | undefined)?.isDeleted;
    const newDeleted = (newEntity.deletion as { isDeleted?: boolean } | undefined)?.isDeleted;
    if (oldDeleted !== newDeleted) append(entityType, id, newDeleted ? "deleted" : "restored");
    for (const field of Object.keys(newEntity)) {
      if (field === "deletion" || field === "projectId" || field === "id" || field === "humanId") continue;
      if (!same(oldEntity[field], newEntity[field])) append(entityType, id, "updated", field, oldEntity[field], newEntity[field]);
    }
  };
  inspect("project", before.project as unknown as Record<string, unknown>, after.project as unknown as Record<string, unknown>, after.project.id);
  for (const collection of COLLECTIONS) {
    const previous = new Map(before[collection].map(entity => [entity.id, entity as unknown as Record<string, unknown>]));
    const current = new Map(after[collection].map(entity => [entity.id, entity as unknown as Record<string, unknown>]));
    for (const id of new Set([...previous.keys(), ...current.keys()])) inspect(collection === "people" ? "person" : collection.slice(0, -1), previous.get(id), current.get(id), id);
  }
  if (!events.length) return after;
  return { ...after, auditHistory: { enabled: true, events: [...(after.auditHistory?.events ?? []), ...events].slice(-MAX_AUDIT_EVENTS) } };
}

export function setAuditEnabled(enabled: boolean) { return { type: "set-audit-enabled", apply(state: ProjectState): ProjectState { return { ...state, auditHistory: { enabled, events: state.auditHistory?.events ?? [] } }; } }; }
