import { describe, expect, it } from "vitest";

import { projectFixture, streamFixture, taskFixture } from "./test-fixtures";
import {
  validateMilestoneDate,
  validateProjectDates,
  validateProgress,
  validateRequiredText,
  validateStreamDates,
  validateTaskDates,
  validateTaskHierarchy,
} from "./validation";

describe("date validation", () => {
  it("makes an inverted project range critical", () => {
    const issues = validateProjectDates(projectFixture({ startDate: "2026-02-01", endDate: "2026-01-01" }));
    expect(issues).toMatchObject([{ severity: "critical", code: "project.invalid-date-range" }]);
  });

  it("reports stream inversion and project-boundary issues as warnings", () => {
    const issues = validateStreamDates(
      streamFixture({ startDate: "2027-02-01", endDate: "2027-01-01" }),
      projectFixture(),
    );
    expect(issues.map((issue) => issue.code)).toEqual([
      "stream.invalid-date-range",
      "stream.outside-project-dates",
    ]);
    expect(issues.every((issue) => issue.severity === "warning")).toBe(true);
  });

  it("reports task inversion, project, and stream boundary warnings", () => {
    const issues = validateTaskDates(
      taskFixture({ startDate: "2026-11-01", endDate: "2026-10-01" }),
      projectFixture(),
      streamFixture({ startDate: "2026-02-01", endDate: "2026-09-30" }),
    );
    expect(issues.map((issue) => issue.code)).toEqual([
      "task.invalid-date-range",
      "task.outside-stream-dates",
    ]);
  });

  it("warns when a milestone is outside project dates", () => {
    expect(validateMilestoneDate("milestone-1", "2027-01-01", projectFixture())[0]).toMatchObject({
      code: "milestone.outside-project-dates",
      severity: "warning",
    });
  });
});

describe("critical field validation", () => {
  it("rejects blank mandatory text and invalid progress", () => {
    expect(validateRequiredText("task-1", "name", "  ")[0]?.severity).toBe("critical");
    expect(validateRequiredText("task-1", "name", "Delivery")).toEqual([]);
    expect(validateProgress("project-1", 101)[0]?.code).toBe("progress.invalid");
    expect(validateProgress("project-1", 42)).toEqual([]);
  });
});

describe("task hierarchy validation", () => {
  it("accepts four levels and rejects a fifth", () => {
    const tasks = [
      taskFixture({ id: "one" }),
      taskFixture({ id: "two", parentTaskId: "one" }),
      taskFixture({ id: "three", parentTaskId: "two" }),
      taskFixture({ id: "four", parentTaskId: "three" }),
      taskFixture({ id: "five", parentTaskId: "four" }),
    ];
    expect(validateTaskHierarchy("four", tasks)).toEqual([]);
    expect(validateTaskHierarchy("five", tasks)[0]?.code).toBe("task.maximum-depth-exceeded");
  });

  it("rejects hierarchy cycles", () => {
    const tasks = [
      taskFixture({ id: "one", parentTaskId: "two" }),
      taskFixture({ id: "two", parentTaskId: "one" }),
    ];
    expect(validateTaskHierarchy("one", tasks)[0]?.code).toBe("task.invalid-parent-chain");
  });
});
