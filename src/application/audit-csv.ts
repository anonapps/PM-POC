import type { AuditEvent } from "./state";

export function auditEventsToCsv(events: readonly AuditEvent[]): string {
  const fields = ["timestamp", "command", "entityType", "entityId", "action", "field", "before", "after"] as const;
  const quote = (value: unknown): string => {
    const text = value === undefined ? "" : typeof value === "string" ? value : JSON.stringify(value);
    // Quoting does not stop spreadsheet programs from interpreting formula-like cells.
    const safe = /^[\s\uFEFF]*[=+@-]/u.test(text) ? "\'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
  };
  return [fields.join(","), ...events.map(event => fields.map(field => quote(event[field])).join(","))].join("\r\n");
}
