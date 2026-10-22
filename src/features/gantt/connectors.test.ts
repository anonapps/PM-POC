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
  it("ignores a missing predecessor without accessing an undefined row", () => {
    expect(ganttConnectorPaths({ ...base, dependencies: [{ from: "missing", to: "b" }] })).toEqual([]);
  });
  it("ignores a missing successor without accessing an undefined row", () => {
    expect(ganttConnectorPaths({ ...base, dependencies: [{ from: "a", to: "missing" }] })).toEqual([]);
  });
  it("omits connectors when both dependency endpoints are outside the visible window", () => {
    const rows = base.rows.map(row => ({ ...row, start: "2027-01-01", end: "2027-01-05" }));
    expect(ganttConnectorPaths({ ...base, rows })).toEqual([]);
  });
  it("preserves connectors crossing the entire visible window", () => {
    const rows = [
      { ...base.rows[0], end: "2026-08-30" },
      { ...base.rows[1], start: "2026-10-02" },
    ];
    expect(ganttConnectorPaths({ ...base, rows })).toHaveLength(1);
  });
  it("omits connectors when both endpoints are before the visible window", () => {
    const rows = base.rows.map(row => ({ ...row, start: "2026-08-01", end: "2026-08-05" }));
    expect(ganttConnectorPaths({ ...base, rows })).toEqual([]);
  });
  it("omits a connector when one endpoint is on the timeline boundary and the other is entirely before it", () => {
    const rows = [{ ...base.rows[0], end: "2026-08-29" }, { ...base.rows[1], start: "2026-08-31" }];
    expect(ganttConnectorPaths({ ...base, rows })).toEqual([]);
  });
  it("omits connectors when a task is hidden or removed", () => {
    expect(ganttConnectorPaths({ ...base, rows: base.rows.slice(0, 1) })).toEqual([]);
  });
});
