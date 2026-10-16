import { describe, expect, it } from "vitest";
import { recordAuditChange, setAuditEnabled } from "./audit";
import type { ProjectState } from "./state";

const initial = {
  project: { id: "p1", name: "Before", metadata: { schemaVersion: 2, minimumAppVersion: "1.0.0" } },
  streams: [], tasks: [], milestones: [], people: [], risks: [], decisions: [], relationships: [], dependencies: [], identifierSequences: {},
} as unknown as ProjectState;

describe("project audit history", () => {
  it("does not record events by default", () => {
    const after = { ...initial, project: { ...initial.project, name: "After" } };
    expect(recordAuditChange(initial, after, "edit-project", "2026-10-16T10:00:00Z")).toBe(after);
  });
  it("records the changed field when enabled", () => {
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const after = { ...before, project: { ...before.project, name: "After" } };
    const result = recordAuditChange(before, after, "edit-project", "2026-10-16T10:00:00Z");
    expect(result.auditHistory?.events).toHaveLength(1);
    expect(result.auditHistory?.events[0]).toMatchObject({ field: "name", before: "Before", after: "After" });
  });
  it("limits history to the most recent 5000 events", () => {
    const old = Array.from({ length: 5000 }, (_, index) => ({
      timestamp: "2026-10-16T10:00:00Z", command: "edit-project", entityType: "project",
      entityId: "p1", action: "updated" as const, field: "name", after: String(index),
    }));
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: old } };
    const after = { ...before, project: { ...before.project, name: "After" } };
    const result = recordAuditChange(before, after, "edit-project", "2026-10-16T10:01:00Z");
    expect(result.auditHistory?.events).toHaveLength(5000);
    expect(result.auditHistory?.events[0]).toBe(old[1]);
    expect(result.auditHistory?.events.at(-1)?.after).toBe("After");
  });
  it("truncates large snapshots", () => {
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const after = { ...before, project: { ...before.project, name: "x".repeat(10000) } };
    const result = recordAuditChange(before, after, "edit-project", "2026-10-16T10:01:00Z");
    expect(String(result.auditHistory?.events[0]?.after).length).toBeLessThan(2100);
  });
  it("keeps existing history when disabled", () => {
    const state: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const result = setAuditEnabled(false).apply(state);
    expect(result.auditHistory).toEqual({ enabled: false, events: [] });
  });
});
