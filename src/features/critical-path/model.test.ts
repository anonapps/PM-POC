import { expect, it } from "vitest";
import { analysisRows, analysisTaskClassification, analysisTaskWarnings } from "./model";
import { calculateCriticalPath } from "../../domain/critical-path/calculate";
import { makeProjectState, taskFixture, streamFixture } from "../../domain/test-fixtures";
import { projectWarningProjection } from "../warnings/use-project-warnings";
it("orders by actual calculated start then stable internal ID, with unresolved dates last", () => {
  const state = makeProjectState({ tasks: [taskFixture({ id: "z", startDate: "2026-02-01", endDate: "2026-02-01" }), taskFixture({ id: "a", startDate: "2026-01-01", endDate: "2026-01-03" }), taskFixture({ id: "missing" })] });
  expect(analysisRows(state, calculateCriticalPath(state), null).map(r => r.task.id)).toEqual(["a", "z", "missing"]);
});
it("reuses existing FS and deletion warning records instead of double-counting CPM causes", () => {
  const state = makeProjectState({ tasks: [taskFixture({ id: "a", startDate: "2026-01-01", endDate: "2026-01-05" }), taskFixture({ id: "b", startDate: "2026-01-02", endDate: "2026-01-03" })], dependencies: [{ id: "ab", projectId: "project-1", predecessor: { kind: "task", id: "a" }, successor: { kind: "task", id: "b" }, type: "Finish-to-Start" }] });
  const warnings = projectWarningProjection(state, calculateCriticalPath(state).diagnostics);
  expect(warnings.filter(w => w.id === "fs:ab" || w.id === "cpm:schedule:ab")).toHaveLength(1);
});


it("shows the same linked-milestone diagnostic beside its task without duplicating projected warnings", () => {
  const state = makeProjectState({streams:[streamFixture()], tasks:[taskFixture({startDate:"2026-01-01",endDate:"2026-01-03"})],
    milestones:[{id:"m",projectId:"project-1",humanId:"MILESTONE-001",name:"Review",plannedDate:"2026-01-01",status:"Planned",ownerId:null,scope:{kind:"streams",streamIds:["stream-1"]},relatedTaskIds:[],deletion:{isDeleted:false}}],
    dependencies:[{id:"tm",projectId:"project-1",predecessor:{kind:"task",id:"task-1"},successor:{kind:"milestone",id:"m"},type:"Finish-to-Start"}]});
  const before=JSON.stringify(state), warnings=projectWarningProjection(state,calculateCriticalPath(state).diagnostics);
  const related=analysisTaskWarnings(state,warnings,"task-1");
  expect(related).toHaveLength(1);expect(related[0]).toMatchObject({id:"cpm:schedule:tm",dependencyId:"tm",entityType:"Milestone",entityId:"m"});
  expect(related[0]).toBe(warnings.find(w=>w.id==="cpm:schedule:tm"));
  expect(warnings.filter(w=>w.id==="cpm:schedule:tm")).toHaveLength(1);
  expect(analysisTaskWarnings(state,warnings,"unrelated")).toEqual([]);expect(JSON.stringify(state)).toBe(before);
});

it.each([
  {name:"missing",startDate:null,endDate:null,eligible:false},
  {name:"reversed",startDate:"2026-01-05",endDate:"2026-01-01",eligible:false},
  {name:"invalid calendar day",startDate:"2026-02-30",endDate:"2026-03-02",eligible:false},
  {name:"same day",startDate:"2026-01-01",endDate:"2026-01-01",eligible:true},
  {name:"leap day",startDate:"2028-02-28",endDate:"2028-03-01",eligible:true},
])("keeps $name schedule classification consistent while calculating and after calculation",({startDate,endDate,eligible})=>{
  const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture({startDate,endDate})]});
  const result=calculateCriticalPath(state),row=analysisRows(state,result,null)[0];
  expect(row.activity?.unscheduled).toBe(!eligible);
  expect(analysisTaskClassification(row)).toBe(eligible?"Critical":"Unscheduled");
  expect(analysisTaskClassification(analysisRows(state,null,null)[0])).toBe(eligible?"Unresolved":"Unscheduled");
});
