import { describe, expect, it } from "vitest";
import type { AuditEvent } from "./state";
import { auditEventMatchesSearch } from "./audit-search";

const event: AuditEvent = {
  timestamp: "2026-10-18T11:30:00Z",
  command: "edit-task",
  entityType: "task",
  entityId: "task-123",
  action: "updated",
  field: "name",
  before: "Old title",
  after: { title: "New title", labels: ["Release"] },
};

describe("audit event search", () => {
  it("matches timestamp, command, identity, action, field and snapshots", () => {
    for (const query of ["2026-10-18", "11:30", "EDIT-TASK", "task-123", "UPDATED", "name", "old title", "new title", "release"]) {
      expect(auditEventMatchesSearch(event, query)).toBe(true);
    }
  });
  it("trims queries and matches empty search", () => {
    expect(auditEventMatchesSearch(event, "  TASK-123  ")).toBe(true);
    expect(auditEventMatchesSearch(event, "  ")).toBe(true);
  });
  it("searches structured before/after values without relying on a display label", () => {
    const structured: AuditEvent = {
      ...event,
      field: "relatedStreamIds",
      before: ["stream-001"],
      after: ["stream-002", "stream-003"],
    };
    expect(auditEventMatchesSearch(structured, "stream-001")).toBe(true);
    expect(auditEventMatchesSearch(structured, "stream-003")).toBe(true);
    expect(auditEventMatchesSearch(structured, "stream-999")).toBe(false);
  });

  it("rejects nonmatching text", () => {
    expect(auditEventMatchesSearch(event, "unrelated milestone")).toBe(false);
  });
});
