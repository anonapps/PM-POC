import { expect, it } from "vitest";
import { criticalPathToCsv } from "./critical-path-csv";
import { calculateCriticalPath } from "../domain/critical-path/calculate";
import { makeProjectState, taskFixture } from "../domain/test-fixtures";
it("exports scoped unfiltered tasks including unresolved rows, excludes deleted, and protects untrusted cells", () => {
  const state = makeProjectState({ tasks: [taskFixture({ id: "a", humanId: "TASK-001", name: '=HYPERLINK("bad")\nquoted', startDate: "2026-01-01", endDate: "2026-01-02" }), taskFixture({ id: "b", humanId: "TASK-002" }), taskFixture({ id: "c", humanId: "TASK-003", deletion: { isDeleted: true } }), taskFixture({ id: "d", humanId: "TASK-004", scope: { kind: "project" } })] });
  const result = calculateCriticalPath(state, "stream-1"), csv = criticalPathToCsv(state, result);
  expect(csv).toContain("TASK-001"); expect(csv).toContain("TASK-002"); expect(csv).not.toContain("TASK-003"); expect(csv).not.toContain("TASK-004");
  expect(csv).toContain("'=" ); expect(csv).toContain('""bad""'); expect(csv).toContain('"Unscheduled"'); expect(csv).toContain('"Unresolved","",""');
});
