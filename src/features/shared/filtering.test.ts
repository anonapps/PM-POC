import { describe, expect, it } from "vitest";
import { matchesFilters, toggleFilter } from "./filtering";
import { recordFilterValues } from "./record-filters";
import { taskFixture } from "../../domain/test-fixtures";

describe("shared live filters",()=>{
  const fields={Level:[],Status:["In Progress"],Owner:["person-1"],Scope:["stream-1","stream-2"]};
  it("ORs selections within a category and ANDs categories",()=>{
    expect(matchesFilters(fields,{Status:["Completed","In Progress"],Owner:["person-1"]})).toBe(true);
    expect(matchesFilters(fields,{Status:["Completed","In Progress"],Owner:["person-2"]})).toBe(false);
    expect(matchesFilters(fields,{Scope:["stream-3","stream-2"]})).toBe(true);
  });
  it("empty categories do not filter and missing categories cannot match selections",()=>{
    expect(matchesFilters(fields,{Status:[]})).toBe(true);
    expect(matchesFilters(fields,{Missing:["value"]})).toBe(false);
  });
  it("toggle preserves independent selections",()=>{
    expect(toggleFilter(["a"],"b")).toEqual(["a","b"]);
    expect(toggleFilter(["a","b"],"a")).toEqual(["b"]);
  });
  it("uses stable IDs for owners and scopes and an explicit unassigned owner",()=>{
    expect(recordFilterValues(taskFixture())).toEqual({Level:[],Status:["In Progress"],Owner:["unassigned"],Scope:["stream-1"]});
    expect(recordFilterValues(taskFixture({ownerId:"person-1",scope:{kind:"project"}}))).toEqual({Level:[],Status:["In Progress"],Owner:["person-1"],Scope:["project"]});
  });
});
