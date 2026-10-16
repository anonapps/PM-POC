import { describe, expect, it } from "vitest";
import { compareSortValues, nextSort, sortRows } from "./sorting";

describe("shared table sorting", () => {
  it("toggles the active column and resets direction for another column", () => {
    const first = nextSort(null, "name");
    expect(first).toEqual({key:"name",direction:"asc"});
    expect(nextSort(first,"name")).toEqual({key:"name",direction:"desc"});
    expect(nextSort(nextSort(first,"name"),"date")).toEqual({key:"date",direction:"asc"});
  });
  it("sorts natural IDs and preserves equal row order", () => {
    const rows = [{id:"TASK-10",group:"a"},{id:"TASK-2",group:"a"},{id:"TASK-1",group:"a"}];
    expect(sortRows(rows,{key:"id",direction:"asc"},(row,key)=>row[key]).map(x=>x.id)).toEqual(["TASK-1","TASK-2","TASK-10"]);
    expect(sortRows(rows,{key:"group",direction:"asc"},(row,key)=>row[key])).toEqual(rows);
    expect(rows[0].id).toBe("TASK-10");
  });
  it("keeps missing values last in both directions", () => {
    expect(compareSortValues(undefined,"a","asc")).toBeGreaterThan(0);
    expect(compareSortValues(undefined,"a","desc")).toBeGreaterThan(0);
    expect(compareSortValues("","a","desc")).toBeGreaterThan(0);
  });
  it("sorts numeric values numerically", () => {
    expect(compareSortValues(2,10,"asc")).toBeLessThan(0);
    expect(compareSortValues(2,10,"desc")).toBeGreaterThan(0);
  });
});
