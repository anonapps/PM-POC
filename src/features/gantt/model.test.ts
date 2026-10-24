import { todayPosition, positionForDate } from "./model";
import{describe,expect,it}from"vitest";import{makeProjectState,streamFixture,taskFixture}from"../../domain/test-fixtures";import{barPosition,buildGanttModel,timelineColumns}from"./model";
describe("Gantt v1.1 model",()=>{it("always includes Project-wide and exactly twelve columns",()=>{const m=buildGanttModel(makeProjectState(),"Week","2026-09-17");expect(m.rows[0]).toMatchObject({id:"project"});expect(m.columns).toHaveLength(12);expect(m.columns[2].start).toBe("2026-09-17")});it("uses Monday weeks and biweeks",()=>{expect(timelineColumns("Month","2026-09-17")[2].start).toBe("2026-09-14");expect(timelineColumns("Quarter","2026-09-17")[3].start).toBe("2026-09-28")});it("requires both dates and renders same-day tasks",()=>{expect(barPosition("2026-09-17",null,"2026-09-01","2026-09-30")).toBeNull();expect(barPosition("2026-09-17","2026-09-17","2026-09-01","2026-09-30")?.width).toBeGreaterThan(0)});it("duplicates milestone occurrences, not entities",()=>{const state=makeProjectState({streams:[streamFixture(),streamFixture({id:"s2",humanId:"STREAM-002"})],milestones:[{id:"m",projectId:"project-1",humanId:"MILESTONE-001",name:"Gate",plannedDate:"2026-09-17",status:"Planned",ownerId:null,scope:{kind:"streams",streamIds:["stream-1","s2"]},relatedTaskIds:[],deletion:{isDeleted:false}}]});expect(buildGanttModel(state,"Month","2026-09-17").rows.filter(r=>r.kind==="milestone")).toHaveLength(2)});it("shows every scheduled visible dependency",()=>{const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture({id:"a",startDate:"2026-09-01",endDate:"2026-09-02"}),taskFixture({id:"b",startDate:"2026-09-02",endDate:"2026-09-03"})],dependencies:[{id:"d",projectId:"project-1",predecessor:{kind:"task",id:"a"},successor:{kind:"task",id:"b"},type:"Finish-to-Start"}]});expect(buildGanttModel(state).dependencies).toHaveLength(1)})});

import { ganttConnectorPaths } from "./gantt";
describe("Gantt connector projection",()=>{it("creates a visible arrow path for each scheduled dependency",()=>{const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture({id:"a",startDate:"2026-09-14",endDate:"2026-09-16"}),taskFixture({id:"b",humanId:"TASK-002",startDate:"2026-09-17",endDate:"2026-09-18"})],dependencies:[{id:"d",projectId:"project-1",predecessor:{kind:"task",id:"a"},successor:{kind:"task",id:"b"},type:"Finish-to-Start"}]});expect(ganttConnectorPaths(buildGanttModel(state,"Month","2026-09-17"))).toHaveLength(1)})});

import { milestoneDependencyIssues } from "../milestones/dependencies";
describe("v1.2 Gantt milestone warning lookup",()=>{
 it("resolves composite Gantt row IDs to the underlying Milestone",()=>{
  const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture({id:"t",endDate:"2026-10-20",startDate:"2026-10-19"})],milestones:[{id:"m",projectId:"project-1",humanId:"MILESTONE-001",name:"Gate",plannedDate:"2026-10-15",status:"Planned",ownerId:null,scope:{kind:"streams",streamIds:["stream-1"]},relatedTaskIds:[],deletion:{isDeleted:false}}],dependencies:[{id:"d",projectId:"project-1",predecessor:{kind:"task",id:"t"},successor:{kind:"milestone",id:"m"},type:"Finish-to-Start"}]});
  const row=buildGanttModel(state,"Month","2026-10-15").rows.find(r=>r.kind==="milestone");
  expect(row?.id).toBe("m:stream-1");
  expect(milestoneDependencyIssues(state,row!.id.split(":")[0])).toEqual([expect.stringContaining("Scheduling conflict")]);
 });
});

describe("v1.2 Gantt year boundaries",()=>{it("shows both years when a week crosses New Year",()=>{const columns=timelineColumns("Month","2026-12-31");const boundary=columns.find(c=>c.start==="2026-12-28");expect(boundary?.label).toBe("28/12–03/01");});it("keeps same-year weekly labels compact",()=>{const columns=timelineColumns("Month","2026-09-17");expect(columns.find(c=>c.start==="2026-09-14")?.label).toBe("14/09–20/09");});});

describe("v1.5 Gantt empty stream filtering",()=>{it("retains undated tasks and hides only empty streams",()=>{const state=makeProjectState({streams:[streamFixture(),streamFixture({id:"empty",humanId:"STREAM-002",name:"Empty"})],tasks:[taskFixture({startDate:undefined,endDate:undefined})]});const model=buildGanttModel(state,"Week","2026-09-17",0,true);expect(model.rows.some(row=>row.id==="stream-1")).toBe(true);expect(model.rows.some(row=>row.id==="empty")).toBe(false);expect(model.rows[0].id).toBe("project");});});

describe("v1.5 Gantt filtering edge cases",()=>{
 it("does not count deleted tasks as stream content",()=>{const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture({deletion:{isDeleted:true}})]});expect(buildGanttModel(state,"Week","2026-09-17",0,true).rows.map(row=>row.id)).toEqual(["project"]);});
 it("does not remove streams when filtering is disabled",()=>{const state=makeProjectState({streams:[streamFixture()]});expect(buildGanttModel(state,"Week","2026-09-17",0,false).rows.some(row=>row.id==="stream-1")).toBe(true);});
});

describe("v1.5 milestone indentation",()=>{it("indents stream-scoped milestones below their stream",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[{id:"m1",projectId:"project-1",humanId:"MILESTONE-001",name:"Gate",plannedDate:"2026-09-17",status:"Planned",ownerId:null,scope:{kind:"streams",streamIds:["stream-1"]},relatedTaskIds:[],deletion:{isDeleted:false}}]});const model=buildGanttModel(state,"Week","2026-09-17");expect(model.rows.find(row=>row.id==="stream-1")?.depth).toBe(0);expect(model.rows.find(row=>row.id==="m1:stream-1")?.depth).toBe(1);});});
describe("v1.5 Gantt hierarchy",()=>{it("indents tasks and milestones beneath stream headings",()=>{const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture()]});const model=buildGanttModel(state,"Week","2026-09-17");expect(model.rows.find(row=>row.id==="stream-1")?.depth).toBe(0);expect(model.rows.find(row=>row.id==="task-1")?.depth).toBeGreaterThan(0);});});

describe("v1.5 Gantt shared milestone filtering",()=>{it("retains every stream linked to a milestone outside the visible window",()=>{const state=makeProjectState({streams:[streamFixture(),streamFixture({id:"s2",humanId:"STREAM-002",name:"Second"}),streamFixture({id:"empty",humanId:"STREAM-003",name:"Empty"})],milestones:[{id:"shared",projectId:"project-1",humanId:"MILESTONE-001",name:"Shared gate",plannedDate:"2027-12-01",status:"Planned",ownerId:null,scope:{kind:"streams",streamIds:["stream-1","s2"]},relatedTaskIds:[],deletion:{isDeleted:false}}]});const model=buildGanttModel(state,"Week","2026-09-17",0,true);expect(model.rows.filter(row=>row.kind==="section").map(row=>row.id)).toEqual(["project","stream-1","s2"]);expect(model.rows.filter(row=>row.kind==="milestone").map(row=>row.id)).toEqual(["shared:stream-1","shared:s2"]);});});

describe("v1.5 project-wide Gantt rows",()=>{it("preserves project-wide tasks while hiding empty streams",()=>{const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture({id:"project-task",humanId:"TASK-002",scope:{kind:"project"}})]});const model=buildGanttModel(state,"Week","2026-09-17",0,true);expect(model.rows.map(row=>row.id)).toEqual(["project","project-task"]);expect(model.rows[1].depth).toBeGreaterThan(0);});});

describe("v1.5 Gantt deleted milestone filtering",()=>{it("does not count deleted stream milestones as content",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[{id:"deleted-gate",projectId:"project-1",humanId:"MILESTONE-001",name:"Deleted gate",plannedDate:"2026-09-17",status:"Planned",ownerId:null,scope:{kind:"streams",streamIds:["stream-1"]},relatedTaskIds:[],deletion:{isDeleted:true}}]});const model=buildGanttModel(state,"Week","2026-09-17",0,true);expect(model.rows.map(row=>row.id)).toEqual(["project"]);});});

describe("v1.5 Gantt parent task filtering",()=>{it("retains a stream with a non-deleted parent even when its child is deleted",()=>{const state=makeProjectState({streams:[streamFixture()],tasks:[taskFixture({id:"parent",humanId:"TASK-001",name:"Parent"}),taskFixture({id:"child",humanId:"TASK-002",name:"Child",parentTaskId:"parent",deletion:{isDeleted:true}})]});const model=buildGanttModel(state,"Week","2026-09-17",0,true);expect(model.rows.map(row=>row.id)).toEqual(["project","stream-1","parent"]);});});

describe("v1.5 Gantt undated stream milestones",()=>{it("keeps a stream visible when a milestone is undated",()=>{const state=makeProjectState({streams:[streamFixture()],milestones:[{id:"unscheduled",projectId:"project-1",humanId:"MILESTONE-001",name:"Pending gate",plannedDate:"",status:"Tentative",ownerId:null,scope:{kind:"streams",streamIds:["stream-1"]},relatedTaskIds:[],deletion:{isDeleted:false}}]});const model=buildGanttModel(state,"Week","2026-09-17",0,true);expect(model.rows.map(row=>row.id)).toEqual(["project","stream-1","unscheduled:stream-1"]);});});

describe("v1.5 Gantt invalid date ranges",()=>{it("omits reversed and malformed ranges without throwing",()=>{expect(barPosition("2026-10-10","2026-10-01","2026-09-01","2026-12-31")).toBeNull();expect(barPosition("invalid","2026-10-01","2026-09-01","2026-12-31")).toBeNull();expect(barPosition("2026-10-01","invalid","2026-09-01","2026-12-31")).toBeNull();});});

describe("v1.5 Gantt date boundaries",()=>{it("renders a task that overlaps the start of the timeline",()=>{const bar=barPosition("2026-08-25","2026-09-03","2026-09-01","2026-09-30");expect(bar).not.toBeNull();expect(bar?.outside).toBe(false);expect(bar?.left).toBe(0);expect(bar?.width).toBeGreaterThan(0);});it("marks fully out-of-window tasks without rendering a bar",()=>{expect(barPosition("2027-01-01","2027-01-03","2026-09-01","2026-09-30")).toMatchObject({outside:true,width:0});});});

describe("v1.5 impossible Gantt dates",()=>{it("rejects dates that JavaScript would normalise into another month",()=>{expect(barPosition("2026-02-30","2026-03-02","2026-02-01","2026-03-31")).toBeNull();expect(barPosition("2026-02-01","2026-02-30","2026-02-01","2026-03-31")).toBeNull();});});

describe("v1.5 strict date-only Gantt bars",()=>{it("rejects timestamp strings and partial dates",()=>{expect(barPosition("2026-09-01T00:00:00Z","2026-09-02","2026-09-01","2026-09-30")).toBeNull();expect(barPosition("2026-09-01","2026-9-2","2026-09-01","2026-09-30")).toBeNull();});});

describe("v1.5 Gantt leap day",()=>{it("renders a valid leap day and rejects the same date in a non-leap year",()=>{expect(barPosition("2028-02-29","2028-02-29","2028-02-01","2028-03-31")?.outside).toBe(false);expect(barPosition("2027-02-29","2027-03-01","2027-02-01","2027-03-31")).toBeNull();});});

describe("v1.5 Gantt cross-year dates",()=>{it("positions tasks spanning New Year without truncating their visible segment",()=>{const bar=barPosition("2026-12-28","2027-01-04","2027-01-01","2027-01-31");expect(bar).not.toBeNull();expect(bar?.outside).toBe(false);expect(bar?.left).toBe(0);expect(bar?.width).toBeGreaterThan(0);});});


describe("v1.5 Gantt dependency integrity",()=>{
  it("excludes self-references without dropping valid task dependencies",()=>{
    const state=makeProjectState({tasks:[taskFixture({id:"a",humanId:"TASK-001",scope:{kind:"project"},startDate:"2026-09-17",endDate:"2026-09-18"}),taskFixture({id:"b",humanId:"TASK-002",scope:{kind:"project"},startDate:"2026-09-21",endDate:"2026-09-22"})],dependencies:[
      {id:"self",projectId:"project-1",predecessor:{kind:"task",id:"a"},successor:{kind:"task",id:"a"},type:"Finish-to-Start"},
      {id:"valid",projectId:"project-1",predecessor:{kind:"task",id:"a"},successor:{kind:"task",id:"b"},type:"Finish-to-Start"},
    ]});
    expect(buildGanttModel(state,"Week","2026-09-17").dependencies).toEqual([{from:"a",to:"b"}]);
  });
});

describe("Today marker calendar position", () => {
  it("includes the final visible day and excludes adjacent days", () => {
    expect(todayPosition("2026-10-24", "2026-10-13", "2026-10-24")).toBeCloseTo(95.833333);
    expect(todayPosition("2026-10-25", "2026-10-13", "2026-10-24")).toBeNull();
    expect(todayPosition("2026-10-12", "2026-10-13", "2026-10-24")).toBeNull();
  });
  it("uses half a day rather than half a column at every zoom", () => {
    for (const zoom of ["Week", "Month", "Quarter"] as const) {
      const columns = timelineColumns(zoom, "2026-10-24");
      const start = columns[0].start, end = columns[columns.length - 1].end;
      const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
      expect(todayPosition("2026-10-24", start, end)).toBeCloseTo(positionForDate("2026-10-24", start, end) + 50 / days);
    }
  });
});
