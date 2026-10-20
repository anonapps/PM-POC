import type { AuditEvent } from "./state";

/** Match visible audit fields, including timestamps and before/after snapshots. */
export function auditEventMatchesSearch(event: AuditEvent, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [
    event.timestamp,
    event.command,
    event.entityType,
    event.entityId,
    event.action,
    event.field ?? "",
    event.before === undefined ? "" : JSON.stringify(event.before),
    event.after === undefined ? "" : JSON.stringify(event.after),
  ].join(" ").toLowerCase().includes(normalized);
}
