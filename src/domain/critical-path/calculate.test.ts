import { describe, expect, it } from "vitest";
import { makeProjectState, projectFixture, taskFixture } from "../test-fixtures";
import type { Dependency, Milestone } from "../index";
import { calculateCriticalPath } from "./calculate";

const link = (from: string, to: string, type: Dependency["type"] = "Finish-to-Start", id = `${from}-${to}-${type}`): Dependency => ({ id, projectId: "project-1", predecessor: { kind: "task", id: from }, successor: { kind: "task", id: to }, type });
const task = (id: string, startDate = "2026-10-25", endDate = "2026-10-27", stream = "design") => taskFixture({ id, name: id, humanId: `TASK-${id}`, startDate, endDate, scope: { kind: "stream", streamId: stream } });
const golden = () => makeProjectState({ project: projectFixture({ startDate: "2026-10-25" }), tasks: [task("001"), task("002", "2026-10-27", "2026-10-30", "delivery"), task("003", "2026-10-27", "2026-10-30"), task("004", "2026-10-30", "2026-11-03", "delivery"), task("005", "2026-10-27", "2026-10-29", "docs")], dependencies: [link("001", "002"), link("001", "003"), link("002", "004"), link("003", "004"), link("001", "005")] });
describe("approved CPM mathematics", () => {
  it("calculates the hand-derived same-day FS parallel network without mutation", () => {
    const source = golden(), before = JSON.stringify(source), result = calculateCriticalPath(source);
    expect(result).toMatchObject({ completion: "2026-11-03", criticalTaskCount: 4, pathCount: "2", provisional: false });
    expect(result.activities.find(a => a.id === "005")).toMatchObject({ earliestStart: "2026-10-27", totalFloat: 5, freeFloat: 5, critical: false });
    expect(JSON.stringify(source)).toBe(before);
    expect(calculateCriticalPath({ ...source, tasks: [...source.tasks].reverse(), dependencies: [...source.dependencies].reverse() })).toEqual(result);
  });
  it.each([
    ["Finish-to-Start", "2026-10-27", "2026-10-28"],
    ["Start-to-Start", "2026-10-25", "2026-10-26"],
    ["Finish-to-Finish", "2026-10-26", "2026-10-27"],
    ["Start-to-Finish", "2026-10-25", "2026-10-26"],
  ] as const)("uses %s endpoint constraints", (type, start, finish) => {
    const result = calculateCriticalPath(makeProjectState({ project: projectFixture({ startDate: "2026-10-25" }), tasks: [task("a"), task("b", "2026-10-25", "2026-10-26")], dependencies: [link("a", "b", type)] }));
    expect(result.activities.find(a => a.id === "b")).toMatchObject({ earliestStart: start, earliestFinish: finish });
    expect(result.activities.every(a => a.totalFloat! >= 0)).toBe(true);
    const a = result.activities.find(a => a.id === "a")!, b = result.activities.find(a => a.id === "b")!;
    expect(a).toMatchObject({ totalFloat: 0, freeFloat: 0, critical: true });
    expect(b).toMatchObject({ totalFloat: type === "Start-to-Start" || type === "Start-to-Finish" ? 1 : 0, freeFloat: type === "Start-to-Start" || type === "Start-to-Finish" ? 1 : 0 });
    expect(result.pathCount).toBe("1");
  });
  it("uses calendar days over leap day, includes completed and independent tasks", () => {
    const result = calculateCriticalPath(makeProjectState({ project: projectFixture({ startDate: "2028-02-28" }), tasks: [{ ...task("a", "2028-02-28", "2028-03-01"), status: "Completed", actualCompletionDate: "2028-03-05" }, task("b", "2028-02-28", "2028-02-28")] }));
    expect(result.activities[0]).toMatchObject({ duration: 3, earliestFinish: "2028-03-01", critical: true });
    expect(result.activities[1]).toMatchObject({ duration: 1, totalFloat: 2, freeFloat: 2 });
  });
  it("uses full-graph stream-relative float and deduplicates parallel records", () => {
    const source = { ...golden() }; source.dependencies = [...source.dependencies, { ...source.dependencies[0], id: "redundant" }];
    expect(calculateCriticalPath(source).pathCount).toBe("2");
    const docs = calculateCriticalPath(source, "docs");
    expect(docs).toMatchObject({ completion: "2026-10-29", criticalTaskCount: 1, pathCount: "1" });
    expect(docs.activities[0]).toMatchObject({ earliestStart: "2026-10-27", totalFloat: 0 });
  });
  it.each(["Finish-to-Start", "Start-to-Start", "Finish-to-Finish", "Start-to-Finish"] as const)("supports all milestone endpoint combinations for %s", type => {
    const milestone = (id: string): Milestone => ({ id, projectId: "project-1", humanId: `MILESTONE-${id}`, name: id, plannedDate: "2026-10-25", status: "Planned", ownerId: null, scope: { kind: "streams", streamIds: ["design", "delivery"] }, relatedTaskIds: [], deletion: { isDeleted: false } });
    const result = calculateCriticalPath(makeProjectState({ project: projectFixture({ startDate: "2026-10-25" }), tasks: [task("a"), task("b")], milestones: [milestone("m"), milestone("n"), milestone("unlinked")], dependencies: [{ ...link("a", "m", type), successor: { kind: "milestone", id: "m" } }, { ...link("m", "n", type), predecessor: { kind: "milestone", id: "m" }, successor: { kind: "milestone", id: "n" } }, { ...link("n", "b", type), predecessor: { kind: "milestone", id: "n" } }] }));
    expect(result.activities.filter(a => a.kind === "milestone")).toHaveLength(2);
    expect(result.activities.filter(a => a.kind === "milestone").every(a => a.duration === 0)).toBe(true);
  });
  it("isolates cycles and dependent chains but retains reliable earliest dates elsewhere", () => {
    const source = { ...golden() }; source.dependencies = [...source.dependencies, link("004", "002")];
    const result = calculateCriticalPath(source);
    expect(result).toMatchObject({ status: "Partial", provisional: true, pathCount: null });
    expect(result.activities.find(a => a.id === "002")?.earliestStart).toBeNull();
    expect(result.activities.find(a => a.id === "005")).toMatchObject({ datesReliable: true, floatReliable: false, critical: null });
    expect(result.diagnostics.filter(d => d.code === "cycle")).toHaveLength(2);
  });
  it("does not silently discard unknown or deleted predecessors", () => {
    for (const missing of [true, false]) {
      const source = { ...golden() }; source.tasks = missing ? source.tasks.filter(t => t.id !== "001") : source.tasks.map(t => t.id === "001" ? { ...t, deletion: { isDeleted: true } } : t);
      const result = calculateCriticalPath(source);
      expect(result.activities.some(a => a.id === "001")).toBe(false);
      expect(result.activities.find(a => a.id === "004")?.critical).toBeNull();
      expect(result.status).toBe("Partial");
    }
  });
  it("leaves unscheduled rows unclassified and distinguishes empty projects", () => {
    const source = { ...golden() }; source.tasks = source.tasks.map(t => t.id === "005" ? { ...t, endDate: null } : t);
    expect(calculateCriticalPath(source).activities.find(a => a.id === "005")).toMatchObject({ unscheduled: true, earliestStart: null, totalFloat: null, critical: null });
    expect(calculateCriticalPath(makeProjectState()).emptyReason).toBe("no-tasks");
  });
  it("counts exponentially many sequences without enumeration", () => {
    const tasks = [], dependencies: Dependency[] = [];
    for (let layer = 0; layer < 55; layer++) for (const side of ["a", "b"]) { const id = `${layer}${side}`; tasks.push(task(id, "2026-10-25", "2026-10-25")); if (layer) for (const before of ["a", "b"]) dependencies.push(link(`${layer - 1}${before}`, id)); }
    const result = calculateCriticalPath(makeProjectState({ project: projectFixture({ startDate: "2026-10-25" }), tasks, dependencies }));
    expect(result.pathCount).toBe((BigInt(2) ** BigInt(55)).toString());
  });
});
