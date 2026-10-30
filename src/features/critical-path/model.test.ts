import { expect, it } from "vitest";
import { analysisRows } from "./model";
import { calculateCriticalPath } from "../../domain/critical-path/calculate";
import { makeProjectState, taskFixture } from "../../domain/test-fixtures";
import { projectWarningProjection } from "../warnings/use-project-warnings";
it("orders by actual calculated start then stable internal ID, with unresolved dates last", () => {
  const state = makeProjectState({ tasks: [taskFixture({ id: "z", startDate: "2026-02-01", endDate: "2026-02-01" }), taskFixture({ id: "a", startDate: "2026-01-01", endDate: "2026-01-03" }), taskFixture({ id: "missing" })] });
  expect(analysisRows(state, calculateCriticalPath(state), null).map(r => r.task.id)).toEqual(["a", "z", "missing"]);
});
it("reuses existing FS and deletion warning records instead of double-counting CPM causes", () => {
  const state = makeProjectState({ tasks: [taskFixture({ id: "a", startDate: "2026-01-01", endDate: "2026-01-05" }), taskFixture({ id: "b", startDate: "2026-01-02", endDate: "2026-01-03" })], dependencies: [{ id: "ab", projectId: "project-1", predecessor: { kind: "task", id: "a" }, successor: { kind: "task", id: "b" }, type: "Finish-to-Start" }] });
  const warnings = projectWarningProjection(state, calculateCriticalPath(state).diagnostics);
  expect(warnings.filter(w => w.id === "fs:ab" || w.id === "cpm:schedule:ab")).toHaveLength(1);
});
