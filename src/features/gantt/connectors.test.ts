import { describe, expect, it } from "vitest";
import { ganttConnectorPaths } from "./gantt";
import type { GanttModel } from "./model";

const base: GanttModel = {
  start: "2026-09-01", end: "2026-09-30", columns: [],
  rows: [
    { kind: "task", id: "a", label: "First", start: "2026-09-01", end: "2026-09-10", progress: 0, depth: 1 },
    { kind: "task", id: "b", label: "Second", start: "2026-09-12", end: "2026-09-20", progress: 0, depth: 1 },
  ],
  dependencies: [{ from: "a", to: "b" }],
};

describe("Gantt connector validation", () => {
  it("renders a connector for valid task dates", () => {
    expect(ganttConnectorPaths(base)).toHaveLength(1);
  });
  it("omits connectors for impossible predecessor dates", () => {
    const rows = base.rows.map(row => row.id === "a" ? { ...row, end: "2026-02-30" } : row);
    expect(ganttConnectorPaths({ ...base, rows })).toEqual([]);
  });
  it("omits connectors for timestamp-formatted successor dates", () => {
    const rows = base.rows.map(row => row.id === "b" ? { ...row, start: "2026-09-12T00:00:00Z" } : row);
    expect(ganttConnectorPaths({ ...base, rows })).toEqual([]);
  });
  it("omits connectors when a task is hidden or removed", () => {
    expect(ganttConnectorPaths({ ...base, rows: base.rows.slice(0, 1) })).toEqual([]);
  });
});
