import { regressionFixture } from "../../testing/regression-fixture";
import { matchesEntitySearch } from "./search";
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

describe("v1.5 completion and risk assessment search",()=>{
  it("indexes milestone actual completion dates",()=>{
    const state=makeProjectState({milestones:[{id:"m1",projectId:"project-1",humanId:"MILESTONE-001",name:"Deployment gate",plannedDate:"2026-10-01",actualCompletionDate:"2026-10-03",status:"Complete",ownerId:null,scope:{kind:"project"},relatedTaskIds:[],deletion:{isDeleted:false}}]});
    expect(searchProject(state,"2026-10-03")).toEqual([expect.objectContaining({module:"Milestones",label:"Deployment gate"})]);
  });
  it("indexes Risk impact and probability without changing result labels",()=>{
    const store=createProjectStore(makeProjectState(),{createId:()=> "risk-assessment",now:()=> "2026-09-15T00:00:00Z"});
    store.execute(createRisk({title:"Supply chain",status:"Open",probability:"Low",impact:"High",ownerId:null,projectWide:true,relatedStreamIds:[],relatedTaskIds:[],relatedMilestoneIds:[]}));
    expect(searchProject(store.getState(),"high")).toEqual([expect.objectContaining({module:"Risk Log",label:"Supply chain"})]);
  });
});

describe("v1.5 relational search",()=>{
  it("finds tasks by assigned owner name",()=>{
    const state=makeProjectState({people:[{id:"person-1",projectId:"project-1",humanId:"PERSON-001",name:"Jordan Rivera",deletion:{isDeleted:false}}],tasks:[taskFixture({name:"Delivery plan",ownerId:"person-1"})]});
    expect(searchProject(state,"Jordan Rivera").some(result=>result.module==="Tasks"&&result.label==="Delivery plan")).toBe(true);
  });
  it("finds stream-scoped tasks by their stream name",()=>{
    const state=makeProjectState({streams:[streamFixture({id:"stream-1",name:"Infrastructure"})],tasks:[taskFixture({name:"Migration task",scope:{kind:"stream",streamId:"stream-1"}})]});
    expect(searchProject(state,"Infrastructure")).toEqual(expect.arrayContaining([expect.objectContaining({module:"Tasks",label:"Migration task"})]));
  });
  it("finds project-wide tasks by their scope label",()=>{
    const state=makeProjectState({tasks:[taskFixture({name:"Programme governance",scope:{kind:"project"}})]});
    expect(searchProject(state,"project-wide")).toEqual([expect.objectContaining({module:"Tasks",label:"Programme governance"})]);
  });
  it("does not index names of deleted owners",()=>{
    const state=makeProjectState({people:[{id:"person-1",projectId:"project-1",humanId:"PERSON-001",name:"Former Owner",deletion:{isDeleted:true}}],tasks:[taskFixture({name:"Active task",ownerId:"person-1"})]});
    expect(searchProject(state,"Former Owner")).toEqual([]);
  });
});

describe("v1.5 Risk and Decision context search",()=>{
  it("indexes a Risk linked stream name",()=>{
    const store=createProjectStore(makeProjectState({streams:[streamFixture({id:"stream-1",name:"Network transition"})]}),{createId:()=> "risk-context",now:()=> "2026-09-15T00:00:00Z"});
    store.execute(createRisk({title:"Supplier delay",status:"Open",probability:"Medium",impact:"High",ownerId:null,projectWide:false,relatedStreamIds:["stream-1"],relatedTaskIds:[],relatedMilestoneIds:[]}));
    expect(searchProject(store.getState(),"Network transition")).toEqual(expect.arrayContaining([expect.objectContaining({module:"Risk Log",label:"Supplier delay"})]));
  });
  it("does not index deleted linked stream names",()=>{
    const store=createProjectStore(makeProjectState({streams:[streamFixture({id:"stream-1",name:"Archived network",deletion:{isDeleted:true}})]}),{createId:()=> "risk-context",now:()=> "2026-09-15T00:00:00Z"});
    store.execute(createRisk({title:"Supplier delay",status:"Open",probability:"Medium",impact:"High",ownerId:null,projectWide:false,relatedStreamIds:["stream-1"],relatedTaskIds:[],relatedMilestoneIds:[]}));
    expect(searchProject(store.getState(),"Archived network")).toEqual([]);
  });
});

describe("v1.5 legacy due date search",()=>{it("indexes preserved task due dates without exposing them as labels",()=>{const state=makeProjectState({tasks:[taskFixture({name:"Migration",legacyDueDate:"2026-12-18"})]});expect(searchProject(state,"2026-12-18")).toEqual([expect.objectContaining({module:"Tasks",label:"Migration"})]);});});


describe("v1.5 global multi-term search",()=>{
  it("matches ID and description terms regardless of order",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Delivery",description:"Cross-team handover"})]});
    expect(searchProject(state,"stream-001 handover")).toEqual([expect.objectContaining({module:"Streams",label:"Delivery"})]);
    expect(searchProject(state,"handover stream-001")).toHaveLength(1);
    expect(searchProject(state,"handover unrelated")).toHaveLength(0);
  });
  it("matches across a task title and its assigned owner",()=>{
    const state=makeProjectState({people:[{id:"person-1",projectId:"project-1",humanId:"PERSON-001",name:"Jordan Rivera",deletion:{isDeleted:false}}],tasks:[taskFixture({name:"Delivery plan",ownerId:"person-1"})]});
    expect(searchProject(state,"jordan delivery")).toEqual([expect.objectContaining({module:"Tasks",label:"Delivery plan"})]);
  });
});


describe("v1.5 global accent-insensitive search",()=>{
  it("finds an accented Stream name without requiring diacritics",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Équipe Réseau",description:"Migration"})]});
    expect(searchProject(state,"equipe reseau")).toEqual([expect.objectContaining({module:"Streams",label:"Équipe Réseau"})]);
    expect(searchProject(state,"MIGRATION equipe")).toHaveLength(1);
  });
});

describe("shared hidden-field projection",()=>{
  it("finds decision descriptions and task/risk human IDs with AND terms",()=>{
    const state=regressionFixture();
    const original=state.decisions[1];
    const decision={...original,description:"Procurement rationale",relatedTaskIds:[state.tasks[3].id],relatedRiskIds:[state.risks[4].id]};
    const next={...state,decisions:[decision]};
    expect(matchesEntitySearch(next,decision,"procurement task-004 risk-005")).toBe(true);
    expect(searchProject(next,"procurement task-004 risk-005").map(item=>item.entityId)).toEqual([decision.id]);
    expect(matchesEntitySearch(next,decision,"procurement missing")).toBe(false);
  });
  it("indexes risk actions and dependency names without dropping original fields",()=>{
    const state=regressionFixture();
    const risk=state.risks.find(item=>item.actions.length>0)!;
    expect(matchesEntitySearch(state,risk,"overdue mitigation")).toBe(true);
    const edge=state.dependencies.find(item=>item.successor.kind==="task"&&item.predecessor.kind==="task")!;
    const task=state.tasks.find(item=>item.id===edge.successor.id)!;
    const predecessor=state.tasks.find(item=>item.id===edge.predecessor.id)!;
    expect(matchesEntitySearch(state,task,predecessor.humanId)).toBe(true);
  });
});
