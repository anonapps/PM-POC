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
  it("records dependency creation and removal", () => {
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const dependency = { id: "dep-1", projectId: "p1", type: "finish-to-start", predecessor: { kind: "task", id: "t1" }, successor: { kind: "task", id: "t2" } };
    const added = { ...before, dependencies: [dependency] } as unknown as ProjectState;
    const created = recordAuditChange(before, added, "add-dependency", "2026-10-16T10:01:00Z");
    expect(created.auditHistory?.events.at(-1)).toMatchObject({ entityType: "dependency", entityId: "dep-1", action: "created" });
    const removed = recordAuditChange(created, { ...created, dependencies: [] }, "remove-dependency", "2026-10-16T10:02:00Z");
    expect(removed.auditHistory?.events.at(-1)).toMatchObject({ entityType: "dependency", entityId: "dep-1", action: "deleted" });
  });
  it("records relationship creation", () => {
    const before: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const relationship = { id: "rel-1", projectId: "p1", type: "relates", source: { kind: "task", id: "t1" }, target: { kind: "risk", id: "r1" } };
    const after = { ...before, relationships: [relationship] } as unknown as ProjectState;
    const result = recordAuditChange(before, after, "add-relationship", "2026-10-16T10:01:00Z");
    expect(result.auditHistory?.events.at(-1)).toMatchObject({ entityType: "relationship", entityId: "rel-1", action: "created" });
  });
  it("records changed dependency endpoints without emitting unchanged fields", () => {
    const dependency = { id: "dep-1", projectId: "p1", type: "finish-to-start", predecessor: "t1", successor: "t2" };
    const before = { ...initial, auditHistory: { enabled: true, events: [] }, dependencies: [dependency] } as unknown as ProjectState;
    const after = { ...before, dependencies: [{ ...dependency, predecessor: "t3" }] } as unknown as ProjectState;
    const result = recordAuditChange(before, after, "edit-dependency", "2026-10-16T10:01:00Z");
    expect(result.auditHistory?.events).toHaveLength(1);
    expect(result.auditHistory?.events[0]).toMatchObject({ entityType: "dependency", field: "predecessor", before: "t1", after: "t3" });
  });
  it("reports recalculated risk level when probability changes", () => {
    const risk = { id: "risk-1", probability: 1, impact: 3, riskLevel: "low" };
    const before = { ...initial, auditHistory: { enabled: true, events: [] }, risks: [risk] } as unknown as ProjectState;
    const after = { ...before, risks: [{ ...risk, probability: 3, riskLevel: "high" }] } as unknown as ProjectState;
    const result = recordAuditChange(before, after, "edit-risk", "2026-10-16T10:01:00Z");
    expect(result.auditHistory?.events.map(event => event.field)).toContain("probability");
    expect(result.auditHistory?.events).toContainEqual(expect.objectContaining({ field: "riskLevel", before: "low", after: "high" }));
  });
  it("does not log risk-level recalculation without a probability or impact edit", () => {
    const risk = { id: "risk-1", probability: 1, impact: 3, riskLevel: "low" };
    const before = { ...initial, auditHistory: { enabled: true, events: [] }, risks: [risk] } as unknown as ProjectState;
    const after = { ...before, risks: [{ ...risk, riskLevel: "medium" }] } as unknown as ProjectState;
    const result = recordAuditChange(before, after, "recalculate", "2026-10-16T10:01:00Z");
    expect(result.auditHistory?.events).toHaveLength(0);
  });
  it("keeps existing history when disabled", () => {
    const state: ProjectState = { ...initial, auditHistory: { enabled: true, events: [] } };
    const result = setAuditEnabled(false).apply(state);
    expect(result.auditHistory).toEqual({ enabled: false, events: [] });
  });
});
