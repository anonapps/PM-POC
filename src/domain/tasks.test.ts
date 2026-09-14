import { describe, expect, it } from "vitest";

import {
  calculateParentProgress,
  calculateStreamProgress,
  deriveParentCompletion,
  deriveParentTaskDates,
  setLeafTaskStatus,
} from "./tasks";
import { taskFixture } from "./test-fixtures";

describe("task derivations", () => {
  it("calculates stream progress from active leaf and flat tasks only", () => {
    const tasks = [
      taskFixture({ id: "parent", progress: 90 }),
      taskFixture({ id: "one", parentTaskId: "parent", progress: 100 }),
      taskFixture({ id: "two", parentTaskId: "parent", progress: 50 }),
      taskFixture({ id: "flat", progress: 25 }),
      taskFixture({ id: "other", scope: { kind: "stream", streamId: "stream-2" }, progress: 0 }),
      taskFixture({ id: "deleted", progress: 0, deletion: { isDeleted: true } }),
    ];
    expect(calculateStreamProgress("stream-1", tasks)).toBe(58);
    expect(calculateStreamProgress("missing", tasks)).toBeNull();
  });

  it("equal-weights immediate children and rounds to an integer", () => {
    expect(calculateParentProgress([
      taskFixture({ progress: 20 }),
      taskFixture({ progress: 55 }),
    ])).toBe(38);
  });

  it("derives the earliest start and latest end", () => {
    expect(deriveParentTaskDates([
      taskFixture({ startDate: "2026-03-03", endDate: "2026-03-10" }),
      taskFixture({ startDate: "2026-02-01", endDate: "2026-04-01" }),
      taskFixture({}),
    ])).toEqual({ startDate: "2026-02-01", endDate: "2026-04-01" });
  });

  it("completes a parent using the latest child completion date", () => {
    expect(deriveParentCompletion([
      taskFixture({ status: "Completed", actualCompletionDate: "2026-03-01" }),
      taskFixture({ status: "Completed", actualCompletionDate: "2026-03-04" }),
    ])).toEqual({ status: "Completed", actualCompletionDate: "2026-03-04" });
  });

  it("moves a parent out of Completed when a child is reopened", () => {
    expect(deriveParentCompletion([
      taskFixture({ status: "Completed", actualCompletionDate: "2026-03-01" }),
      taskFixture({ status: "In Progress" }),
    ])).toEqual({ status: "In Progress" });
  });

  it("sets and clears leaf completion deterministically", () => {
    const task = taskFixture();
    const complete = setLeafTaskStatus(task, "Completed", "2026-05-01");
    expect(complete.actualCompletionDate).toBe("2026-05-01");
    expect(setLeafTaskStatus(complete, "In Progress", "2026-05-02").actualCompletionDate).toBeUndefined();
  });
});
