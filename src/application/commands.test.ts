import { describe, expect, it } from "vitest";
import type { Decision, Milestone, Person, Risk, Task } from "../domain";
import { projectFixture, streamFixture, taskFixture } from "../domain/test-fixtures";
import { duplicate } from "./commands";
import { createProjectStore } from "./store";

const deletedPerson: Person = {
  id: "person-deleted",
  projectId: "project-1",
  humanId: "PERSON-004",
  name: "Former owner",
  deletion: { isDeleted: true, deletedAt: "2026-09-01T00:00:00Z" },
};

function stateWith(entity: Task | Milestone | Risk | Decision) {
  return {
    project: projectFixture(),
    streams: [streamFixture()],
    tasks: entity.humanId.startsWith("TASK-") ? [entity as Task] : [],
    milestones: entity.humanId.startsWith("MILESTONE-") ? [entity as Milestone] : [],
    people: [deletedPerson],
    risks: entity.humanId.startsWith("RISK-") ? [entity as Risk] : [],
    decisions: entity.humanId.startsWith("DECISION-") ? [entity as Decision] : [],
    relationships: [],
    dependencies: [],
  };
}

const context = {
  createId: (() => {
    let value = 0;
    return () => `new-${++value}`;
  })(),
  now: () => "2026-09-15T12:00:00Z",
};

describe("duplicate", () => {
  it("does not copy an inactive task owner", () => {
    const task = taskFixture({ ownerId: deletedPerson.id });
    const store = createProjectStore(stateWith(task), context);

    expect(store.execute(duplicate("task", task.id))).toBe(true);
    expect(store.getState().tasks[1]).toMatchObject({
      humanId: "TASK-002",
      ownerId: null,
    });
  });

  it("resets a duplicated milestone to Tentative and removes its inactive owner", () => {
    const milestone: Milestone = {
      id: "milestone-1",
      projectId: "project-1",
      humanId: "MILESTONE-007",
      name: "Release",
      plannedDate: "2026-10-01",
      status: "Complete",
      ownerId: deletedPerson.id,
      scope: { kind: "project" },
      relatedTaskIds: [],
      actualCompletionDate: "2026-09-10",
      deletion: { isDeleted: false },
    };
    const store = createProjectStore(stateWith(milestone), context);

    expect(store.execute(duplicate("milestone", milestone.id))).toBe(true);
    expect(store.getState().milestones[1]).toMatchObject({
      humanId: "MILESTONE-008",
      status: "Tentative",
      ownerId: null,
    });
    expect(store.getState().milestones[1]?.actualCompletionDate).toBeUndefined();
  });
});
