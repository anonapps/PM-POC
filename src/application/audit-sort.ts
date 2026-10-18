import type { AuditEvent } from "./state";

/** Sort by actual instant rather than timestamp text, which may use different UTC offsets. */
export function sortAuditEvents(events: readonly AuditEvent[], newestFirst: boolean): AuditEvent[] {
  return [...events].sort((a, b) =>
    newestFirst
      ? Date.parse(b.timestamp) - Date.parse(a.timestamp)
      : Date.parse(a.timestamp) - Date.parse(b.timestamp),
  );
}
