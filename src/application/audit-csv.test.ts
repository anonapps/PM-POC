import { describe, expect, it } from "vitest";
import { auditEventsToCsv } from "./audit-csv";

describe("auditEventsToCsv", () => {
  it("writes a header and a row", () => {
    const csv = auditEventsToCsv([{ timestamp: "2026-10-16T10:00:00Z", command: "edit-task", entityType: "task", entityId: "task-1", action: "updated", field: "name", before: "Old", after: "New" }]);
    expect(csv).toContain("timestamp,command,entityType,entityId,action,field,before,after");
    expect(csv).toContain('"edit-task"');
    expect(csv).toContain('"Old","New"');
  });
  it("prevents spreadsheet formula interpretation", () => {
    const csv = auditEventsToCsv([{ timestamp: "2026-10-16T10:00:00Z", command: "edit-task", entityType: "task", entityId: "1", action: "updated", field: "name", before: "=1+1", after: " +SUM(A1:A2)" }]);
    expect(csv).toContain('"\'=1+1"');
    expect(csv).toContain('"\' +SUM(A1:A2)"');
  });
  it("escapes commas, quotes and newlines", () => {
    const csv = auditEventsToCsv([{ timestamp: "2026-10-16T10:00:00Z", command: "edit-task", entityType: "task", entityId: "1", action: "updated", field: "name", after: 'Hello, "world"\nAgain' }]);
    expect(csv).toContain('"Hello, ""world""\nAgain"');
  });
});
