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
  it("exports no rows when history is empty", () => {
    expect(auditEventsToCsv([])).toBe("timestamp,command,entityType,entityId,action,field,before,after");
  });
  it("preserves the supplied event order", () => {
    const base = { timestamp: "2026-10-16T10:00:00Z", entityType: "task", entityId: "1", action: "updated" as const };
    const csv = auditEventsToCsv([{ ...base, command: "first" }, { ...base, command: "second" }]);
    expect(csv.indexOf('"first"')).toBeLessThan(csv.indexOf('"second"'));
  });
  it("neutralises formula prefixes with tabs, newlines, at signs and minus signs", () => {
    const base = { timestamp: "2026-10-16T10:00:00Z", command: "edit-task", entityType: "task", entityId: "1", action: "updated" as const, field: "name" };
    const csv = auditEventsToCsv([
      { ...base, before: "\t=HYPERLINK(A1)", after: "@SUM(A1)" },
      { ...base, before: "\n+1+2", after: "-2+3" },
    ]);
    expect(csv).toContain('"\'\\t=HYPERLINK(A1)"'.replace("\\t", "\t"));
    expect(csv).toContain('"\'@SUM(A1)"');
    expect(csv).toContain('"\'\\n+1+2"'.replace("\\n", "\n"));
    expect(csv).toContain('"\'-2+3"');
  });
  it("neutralises formula prefixes after Unicode whitespace", () => {
    const csv = auditEventsToCsv([{ timestamp: "2026-10-16T10:00:00Z", command: "edit-task", entityType: "task", entityId: "1", action: "updated", field: "name", before: "\u00a0=1+1", after: "\ufeff@SUM(A1)" }]);
    expect(csv).toContain('"\'\u00a0=1+1"');
    expect(csv).toContain('"\'\ufeff@SUM(A1)"');
  });
  it("escapes commas, quotes and newlines", () => {
    const csv = auditEventsToCsv([{ timestamp: "2026-10-16T10:00:00Z", command: "edit-task", entityType: "task", entityId: "1", action: "updated", field: "name", after: 'Hello, "world"\nAgain' }]);
    expect(csv).toContain('"Hello, ""world""\nAgain"');
  });
});
