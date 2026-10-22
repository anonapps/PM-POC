import { describe, expect, it } from "vitest"; import { createInitialProjectState, projectReadiness, safeProjectFilename, updateProject, validateProjectDraft } from "./project"; import { createProjectStore } from "../../application";
const draft = { name: "Launch / Plan", startDate: "2026-09-15", status: "Not Started" as const };
describe("project creation and overview", () => { it("validates mandatory fields and date order", () => { expect(validateProjectDraft({ name: "", startDate: "", status: "Not Started" })).toHaveProperty("name"); expect(validateProjectDraft({ ...draft, endDate: "2020-01-01" })).toHaveProperty("endDate"); }); it("creates canonical state and a safe filename", () => { const state = createInitialProjectState(draft, "p1"); expect(state.project.id).toBe("p1"); expect(safeProjectFilename(draft.name)).toBe("Launch-Plan.pmp"); }); it("edits progress through global history", () => { const store = createProjectStore(createInitialProjectState(draft, "p1"), { createId: () => "x", now: () => "2026-01-01" }); store.execute(updateProject({ progress: 42 })); expect(store.isDirty()).toBe(true); expect(store.getState().project.progress).toBe(42); store.undo(); expect(store.getState().project.progress).toBe(0); store.redo(); expect(store.getState().project.progress).toBe(42); }); it("derives onboarding readiness", () => expect(projectReadiness(createInitialProjectState(draft, "p1")).map(x => x.ready)).toEqual([true,false,false,false])); });


describe("v1.5 New Project date validation",()=>{
  const draft={name:"Delivery",description:"",startDate:"2026-10-22",endDate:"2026-12-01",status:"Not Started" as const};
  it("rejects invalid calendar dates and timestamp-shaped inputs",()=>{
    expect(validateProjectDraft({...draft,startDate:"2026-02-30"}).startDate).toBe("Enter a valid start date.");
    expect(validateProjectDraft({...draft,endDate:"2026-11-31"}).endDate).toBe("Enter a valid end date.");
    expect(validateProjectDraft({...draft,startDate:"2026-10-22T00:00:00Z"}).startDate).toBe("Enter a valid start date.");
  });
  it("preserves invalid end-date feedback even when the start date is later",()=>{
    expect(validateProjectDraft({...draft,startDate:"2026-12-20",endDate:"2026-11-31"}).endDate).toBe("Enter a valid end date.");
  });
  it("accepts a real leap day and optional empty end date",()=>{
    expect(validateProjectDraft({...draft,startDate:"2028-02-29",endDate:""})).toEqual({});
  });
});


describe("v1.5 project text normalisation",()=>{
  it("capitalises project name and description on creation without lowercasing other characters",()=>{
    const state=createInitialProjectState({name:"  project NASA ",description:"  launch PLAN ",startDate:"2026-10-22",status:"Not Started"},"p2");
    expect(state.project.name).toBe("Project NASA");
    expect(state.project.description).toBe("Launch PLAN");
  });
  it("does not modify empty optional descriptions",()=>{
    expect(createInitialProjectState({...draft,description:"  "},"p3").project.description).toBeUndefined();
  });
});
