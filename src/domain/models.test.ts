import { describe, expect, it } from "vitest";

import type { Decision, Milestone, Person, Risk } from "./entities";
import type { Dependency, GenericRelationship } from "./relationships";
import { wouldCreateDependencyCycle } from "./relationships";
import { ACTIVE_DELETION_STATE } from "./types";
import { taskFixture } from "./test-fixtures";

describe("domain representations", () => {
  it("distinguishes stream-scoped and explicitly project-wide tasks", () => {
    expect(taskFixture().scope).toEqual({ kind: "stream", streamId: "stream-1" });
    expect(taskFixture({ scope: { kind: "project" } }).scope).toEqual({ kind: "project" });
  });

  it("supports a shared multi-stream milestone and explicit project scope", () => {
    const milestone = {
      id: "milestone-1", projectId: "project-1", humanId: "MILESTONE-001",
      name: "Gate", plannedDate: "2026-04-01", status: "Planned", ownerId: null,
      scope: { kind: "streams", streamIds: ["stream-1", "stream-2"] },
      relatedTaskIds: [], deletion: ACTIVE_DELETION_STATE,
    } satisfies Milestone;
    expect(milestone.scope.streamIds).toHaveLength(2);
    const projectWide: Milestone["scope"] = { kind: "project" };
    expect(projectWide.kind).toBe("project");
  });

  it("retains soft-deleted people as domain records", () => {
    const person: Person = {
      id: "person-1", projectId: "project-1", humanId: "PERSON-001", name: "Alex",
      deletion: { isDeleted: true, deletedAt: "2026-04-01T12:00:00Z" },
    };
    expect(person.deletion.isDeleted).toBe(true);
    expect(person.id).toBe("person-1");
  });

  it("represents risk actions and decision associations without UI state", () => {
    const risk: Risk = {
      id: "risk-1", projectId: "project-1", humanId: "RISK-001", title: "Delay",
      status: "Open", probability: "High", impact: "Medium", riskLevel: "High", ownerId: null,
      projectWide: true, relatedStreamIds: [], relatedTaskIds: [], relatedMilestoneIds: [],
      actions: [{ id: "action-1", description: "Mitigate", status: "Open" }],
      deletion: ACTIVE_DELETION_STATE,
    };
    const decision: Decision = {
      id: "decision-1", projectId: "project-1", humanId: "DECISION-001", title: "Proceed",
      decisionDate: "2026-03-01", ownerId: null, projectWide: false,
      relatedStreamIds: ["stream-1"], relatedTaskIds: [], relatedMilestoneIds: [], relatedRiskIds: [risk.id],
      deletion: ACTIVE_DELETION_STATE,
    };
    expect(risk.actions[0]?.status).toBe("Open");
    expect(decision.relatedRiskIds).toContain("risk-1");
  });

  it("keeps dependencies separate from generic relationships", () => {
    const relationship: GenericRelationship = {
      id: "relationship-1", projectId: "project-1", type: "related-to",
      source: { kind: "task", id: "a" }, target: { kind: "risk", id: "risk-1" },
    };
    const dependency: Dependency = {
      id: "dependency-1", projectId: "project-1", type: "Finish-to-Start",
      predecessor: { kind: "task", id: "a" }, successor: { kind: "task", id: "b" },
    };
    expect(relationship.type).toBe("related-to");
    expect(dependency.type).toBe("Finish-to-Start");
  });

  it("detects dependency cycles but permits an acyclic edge", () => {
    const dependency = (id: string, from: string, to: string): Dependency => ({
      id, projectId: "project-1", type: "Finish-to-Start",
      predecessor: { kind: "task", id: from }, successor: { kind: "task", id: to },
    });
    const existing = [dependency("one", "a", "b"), dependency("two", "b", "c")];
    expect(wouldCreateDependencyCycle(existing, dependency("three", "c", "a"))).toBe(true);
    expect(wouldCreateDependencyCycle(existing, dependency("four", "c", "d"))).toBe(false);
  });
});
