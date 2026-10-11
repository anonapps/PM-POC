import { describe, expect, it } from "vitest";
import { createProjectStore, softDelete } from "./index";
import { makeProjectState, streamFixture, taskFixture } from "../domain/test-fixtures";
import type { Decision, Milestone, Person } from "../domain";
const milestone:Milestone={id:"m1",projectId:"project-1",humanId:"MILESTONE-001",name:"Gate",plannedDate:"2026-10-20",status:"Planned",ownerId:"p1",scope:{kind:"project"},relatedTaskIds:[],deletion:{isDeleted:false}};
const person:Person={id:"p1",projectId:"project-1",humanId:"PERSON-001",name:"Owner",deletion:{isDeleted:false}};
const decision:Decision={id:"d1",projectId:"project-1",humanId:"DECISION-001",title:"Proceed",decisionDate:"2026-10-20",ownerId:null,projectWide:false,relatedStreamIds:["s1"],relatedTaskIds:[],relatedMilestoneIds:["m1"],relatedRiskIds:[],deletion:{isDeleted:false}};
const ctx={createId:()=>"id",now:()=>"2026-10-09T12:00:00Z"};
describe("v1.2 deletion reference cleanup",()=>{
 it("removes dependency links when predecessor Task is deleted",()=>{
 const state=makeProjectState({tasks:[taskFixture({id:"t1"})],milestones:[milestone],dependencies:[{id:"dep",projectId:"project-1",predecessor:{kind:"task",id:"t1"},successor:{kind:"milestone",id:"m1"},type:"Finish-to-Start"}]});
 const store=createProjectStore(state,ctx);store.execute(softDelete("task","t1"));
 expect(store.getState().dependencies).toHaveLength(0);expect(store.getState().milestones[0].deletion.isDeleted).toBe(false);
 });
 it("preserves Decisions but removes deleted Stream and Milestone context links",()=>{
 const store=createProjectStore(makeProjectState({streams:[streamFixture({id:"s1"})],milestones:[milestone],decisions:[decision]}),ctx);
 store.execute(softDelete("stream","s1"));store.execute(softDelete("milestone","m1"));
 expect(store.getState().decisions[0].relatedStreamIds).toEqual([]);
 expect(store.getState().decisions[0].relatedMilestoneIds).toEqual([]);
 expect(store.getState().decisions[0].deletion.isDeleted).toBe(false);
 });
 it("unassigns Milestones when owner is deleted",()=>{
 const store=createProjectStore(makeProjectState({people:[person],milestones:[milestone]}),ctx);
 store.execute(softDelete("person","p1"));expect(store.getState().milestones[0].ownerId).toBeNull();
 });
});
