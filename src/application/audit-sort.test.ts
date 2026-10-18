import { describe, expect, it } from "vitest";
import type { AuditEvent } from "./state";
import { sortAuditEvents } from "./audit-sort";

const event = (timestamp: string, entityId: string): AuditEvent => ({
  timestamp, entityId, entityType: "task", command: "edit-task", action: "updated",
});

describe("audit history chronological sorting", () => {
  it("keeps equal-timestamp events in their original order", () => {
    const events = [
      event("2026-10-18T09:00:00Z", "first"),
      event("2026-10-18T11:00:00+02:00", "second"),
      event("2026-10-18T09:00:00.000Z", "third"),
    ];
    expect(sortAuditEvents(events, true).map(item => item.entityId)).toEqual(["first", "second", "third"]);
    expect(sortAuditEvents(events, false).map(item => item.entityId)).toEqual(["first", "second", "third"]);
  });

  it("handles daylight-saving offset changes in chronological order", () => {
    const events = [
      event("2026-10-25T02:15:00+01:00", "after-fallback"),
      event("2026-10-25T02:45:00+02:00", "before-fallback"),
    ];
    expect(sortAuditEvents(events, false).map(item => item.entityId)).toEqual(["before-fallback", "after-fallback"]);
    expect(sortAuditEvents(events, true).map(item => item.entityId)).toEqual(["after-fallback", "before-fallback"]);
  });

  it("sorts by actual time even when timezone offsets differ", () => {
    const events = [
      event("2026-10-18T11:00:00+02:00", "later"),
      event("2026-10-18T10:30:00+03:00", "earlier"),
      event("2026-10-18T09:30:00Z", "latest"),
    ];
    expect(sortAuditEvents(events, false).map(item => item.entityId)).toEqual(["earlier", "later", "latest"]);
    expect(sortAuditEvents(events, true).map(item => item.entityId)).toEqual(["latest", "later", "earlier"]);
    expect(events.map(item => item.entityId)).toEqual(["later", "earlier", "latest"]);
  });
});
