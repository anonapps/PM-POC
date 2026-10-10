import { describe, expect, it } from "vitest";
import { makeProjectState, streamFixture, taskFixture } from "../../domain/test-fixtures";
import type { Milestone } from "../../domain";
import { deriveOverviewTimeline } from "./timeline";

const milestone = (id: string, date: string, scope: Milestone["scope"]): Milestone => ({
  id, projectId: "project-1", humanId: "MILESTONE-001", name: id,
  plannedDate: date, status: "Planned", ownerId: null, scope, relatedTaskIds: [],
  deletion: { isDeleted: false },
});

describe("v1.2 Overview timeline", () => {
  it("shows an empty state with unscheduled Stream activities", () => {
    const state = makeProjectState({ streams: [streamFixture()], tasks: [taskFixture()] });
    const timeline = deriveOverviewTimeline(state);
    expect(timeline.start).toBeUndefined();
    expect(timeline.rows[0].unscheduled).toBe(1);
    expect(timeline.unscheduledTotal).toBe(1);
  });
  it("includes shared Milestones in each Stream without double-counting the project total", () => {
    const state = makeProjectState({
      streams: [streamFixture(), streamFixture({id:"stream-2",name:"Second"})],
      milestones: [milestone("m1","",{kind:"streams",streamIds:["stream-1","stream-2"]})],
    });
    const timeline = deriveOverviewTimeline(state);
    expect(timeline.rows[0].unscheduled).toBe(1);
    expect(timeline.rows[1].unscheduled).toBe(1);
    expect(timeline.unscheduledTotal).toBe(1);
  });
  it("extends the overall range to Project-wide Milestones", () => {
    const state = makeProjectState({
      streams: [streamFixture()],
      tasks: [taskFixture({startDate:"2026-10-01",endDate:"2026-12-01"})],
      milestones: [milestone("m2","2027-01-15",{kind:"project"})],
    });
    const timeline = deriveOverviewTimeline(state);
    expect(timeline.start).toBe("2026-10-01");
    expect(timeline.end).toBe("2027-01-15");
    expect(timeline.rows.at(-1)?.name).toBe("Project-wide");
  });
});
