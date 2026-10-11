import { describe, expect, it } from "vitest";
import { makeProjectState, taskFixture } from "../../domain/test-fixtures";
import type { Milestone } from "../../domain";
import { addMilestoneDependency, canAddMilestoneDependency, milestoneDependencyIssues } from "./dependencies";
import { createProjectStore } from "../../application";

const milestone = (id:string,date:string,status:Milestone["status"]="Planned"):Milestone=>({
 id,projectId:"project-1",humanId:"MILESTONE-001",name:id,plannedDate:date,status,ownerId:null,
 scope:{kind:"project"},relatedTaskIds:[],deletion:{isDeleted:false},
});
describe("v1.2 Milestone dependencies",()=>{
 it("rejects self and circular dependencies",()=>{
  const state=makeProjectState({milestones:[milestone("m1","2026-10-01"),milestone("m2","2026-10-02")]});
  const store=createProjectStore(state,{createId:()=>"dep1",now:()=>"2026-10-01"});
  expect(canAddMilestoneDependency(store.getState(),{kind:"milestone",id:"m1"},"m1")).toBe(false);
  store.execute(addMilestoneDependency({kind:"milestone",id:"m1"},"m2"));
  expect(canAddMilestoneDependency(store.getState(),{kind:"milestone",id:"m2"},"m1")).toBe(false);
 });
 it("warns for undated Task predecessors and incomplete predecessors without blocking completion",()=>{
  const state=makeProjectState({tasks:[taskFixture()],milestones:[milestone("m1","2026-10-02","Complete")]});
  const store=createProjectStore(state,{createId:()=>"dep1",now:()=>"2026-10-01"});
  store.execute(addMilestoneDependency({kind:"task",id:"task-1"},"m1"));
  expect(milestoneDependencyIssues(store.getState(),"m1")).toEqual(expect.arrayContaining([
   expect.stringContaining("Dependency not scheduled"),expect.stringContaining("Incomplete predecessor")
  ]));
 });
 it("accepts same-day predecessors",()=>{
  const state=makeProjectState({tasks:[taskFixture({endDate:"2026-10-02",startDate:"2026-10-01",status:"Completed"})],milestones:[milestone("m1","2026-10-02")]});
  const store=createProjectStore(state,{createId:()=>"dep1",now:()=>"2026-10-01"});
  store.execute(addMilestoneDependency({kind:"task",id:"task-1"},"m1"));
  expect(milestoneDependencyIssues(store.getState(),"m1")).toEqual([]);
 });
});
