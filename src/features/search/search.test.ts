import {describe,expect,it}from"vitest";import{makeProjectState,streamFixture,taskFixture}from"../../domain/test-fixtures";import{searchProject}from"./search";
import { createProjectStore } from "../../application";
import { createRisk, addRiskAction, editRiskAction } from "../risks/commands";
describe("global search",()=>{const state=makeProjectState({streams:[streamFixture({name:"Delivery"})],tasks:[taskFixture({name:"delivery plan"}),taskFixture({id:"deleted",humanId:"TASK-002",name:"Hidden",deletion:{isDeleted:true}})]});it("returns nothing for empty queries",()=>expect(searchProject(state,"  ")).toEqual([]));it("matches names case-insensitively with deterministic module order",()=>expect(searchProject(state,"DELIVERY").map(x=>x.humanId)).toEqual(["STREAM-001","TASK-001"]));it("matches human IDs and excludes deleted by default",()=>{expect(searchProject(state,"task-002")).toEqual([]);expect(searchProject(state,"TASK-002",true)[0]).toMatchObject({isDeleted:true,module:"Tasks"})})});

describe("v1.5 descriptive field search",()=>{
  it("finds hidden descriptive fields without changing displayed result labels",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Delivery",description:"Cross-team handover"})]});
    const results=searchProject(state,"CROSS-TEAM HANDOVER");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({module:"Streams",label:"Delivery"});
    expect(searchProject(state,"handover")).toHaveLength(1);
  });
  it("keeps deleted records excluded unless explicitly included",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Archived",description:"Cross-team handover",deletion:{isDeleted:true}})]});
    expect(searchProject(state,"cross-team handover")).toHaveLength(0);
    expect(searchProject(state,"cross-team handover",true)).toHaveLength(1);
  });
});

describe("v1.5 search matching",()=>{
  it("matches role and notes fields without exposing them as result titles",()=>{
    const state=makeProjectState({people:[{id:"person-1",projectId:"project-1",humanId:"PERSON-001",name:"Alex",role:"Delivery Lead",notes:"Critical migration",deletion:{isDeleted:false}}]});
    expect(searchProject(state,"delivery lead")[0]).toMatchObject({entityType:"Person",label:"Alex"});
    expect(searchProject(state,"MIGRATION")[0]).toMatchObject({entityType:"Person",label:"Alex"});
  });
  it("supports case-insensitive partial matches on descriptive values",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Delivery",description:"Cross-team handover"})]});
    expect(searchProject(state,"  HANDOVER  ")).toHaveLength(1);
  });
});

describe("v1.5 date search",()=>{it("matches task start dates",()=>{const state=makeProjectState({tasks:[taskFixture({name:"Planning",startDate:"2026-11-03"})]});expect(searchProject(state,"2026-11-03")[0]).toMatchObject({module:"Tasks",label:"Planning"});});});

describe("v1.5 risk action matching",()=>{it("searches action descriptions under the parent risk",()=>{const store=createProjectStore(makeProjectState(),{createId:(()=>{let i=0;return()=>`search-${++i}`})(),now:()=>"2026-09-15T00:00:00Z"});store.execute(createRisk({title:"Supplier delay",status:"Open",probability:"Medium",impact:"High",ownerId:null,projectWide:true,relatedStreamIds:[],relatedTaskIds:[],relatedMilestoneIds:[]}));store.execute(addRiskAction(store.getState().risks[0].id,"Contact vendor"));expect(searchProject(store.getState(),"VENDOR")[0]).toMatchObject({module:"Risk Log",label:"Supplier delay"});});});

describe("v1.5 nested risk action dates",()=>{it("finds action due dates without changing the parent risk result",()=>{const store=createProjectStore(makeProjectState(),{createId:(()=>{let i=0;return()=>`date-${++i}`})(),now:()=>"2026-09-15T00:00:00Z"});store.execute(createRisk({title:"Supplier delay",status:"Open",probability:"Medium",impact:"High",ownerId:null,projectWide:true,relatedStreamIds:[],relatedTaskIds:[],relatedMilestoneIds:[]}));store.execute(addRiskAction(store.getState().risks[0].id,"Call supplier","2026-11-09"));expect(searchProject(store.getState(),"2026-11-09")).toEqual([expect.objectContaining({module:"Risk Log",label:"Supplier delay"})]);});});

describe("v1.5 Risk action status search",()=>{
  it("finds an action status under its parent Risk even when the Risk has a different status",()=>{
    const store=createProjectStore(makeProjectState(),{createId:(()=>{let i=0;return()=>`status-${++i}`})(),now:()=>"2026-09-15T00:00:00Z"});
    store.execute(createRisk({title:"Supplier follow-up",status:"Open",probability:"Medium",impact:"High",ownerId:null,projectWide:true,relatedStreamIds:[],relatedTaskIds:[],relatedMilestoneIds:[]}));
    const riskId=store.getState().risks[0].id;
    store.execute(addRiskAction(riskId,"Call supplier"));
    const actionId=store.getState().risks[0].actions[0].id;
    store.execute(editRiskAction(riskId,actionId,{status:"Complete"}));
    expect(searchProject(store.getState(),"complete")).toEqual([expect.objectContaining({entityId:riskId,module:"Risk Log"})]);
  });
});

describe("v1.5 legacy due date search",()=>{it("indexes preserved task due dates without exposing them as labels",()=>{const state=makeProjectState({tasks:[taskFixture({name:"Migration",legacyDueDate:"2026-12-18"})]});expect(searchProject(state,"2026-12-18")).toEqual([expect.objectContaining({module:"Tasks",label:"Migration"})]);});});
