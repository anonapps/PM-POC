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
  it("records the correct singular entity name for milestones", () => {
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const milestone = { id: "m1", humanId: "MILESTONE-001", name: "Gate" };
    const after = { ...before, milestones: [milestone] } as unknown as ProjectState;
    const result = recordAuditChange(before, after, "create-milestone", "2026-10-16T10:01:00Z");
    expect(result.auditHistory?.events[0]).toMatchObject({ entityType: "milestone", action: "created", entityId: "m1" });
  });
  it("does not record a configuration toggle as a project event", () => {
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const after = { ...before, project: { ...before.project, name: "After" } };
    expect(recordAuditChange(before, after, "set-audit-enabled", "2026-10-16T10:01:00Z")).toBe(after);
  });
  it("does not create events for unchanged state", () => {
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const result = recordAuditChange(before, before, "edit-project", "2026-10-16T10:01:00Z");
    expect(result.auditHistory?.events).toHaveLength(0);
  });
  it("keeps existing history when disabled", () => {
    const state: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const result = setAuditEnabled(false).apply(state);
    expect(result.auditHistory).toEqual({ enabled: false, events: [] });
  });
});
