import {describe,expect,it}from"vitest";import{makeProjectState,streamFixture,taskFixture}from"../../domain/test-fixtures";import{searchProject}from"./search";
describe("global search",()=>{const state=makeProjectState({streams:[streamFixture({name:"Delivery"})],tasks:[taskFixture({name:"delivery plan"}),taskFixture({id:"deleted",humanId:"TASK-002",name:"Hidden",deletion:{isDeleted:true}})]});it("returns nothing for empty queries",()=>expect(searchProject(state,"  ")).toEqual([]));it("matches names case-insensitively with deterministic module order",()=>expect(searchProject(state,"DELIVERY").map(x=>x.humanId)).toEqual(["STREAM-001","TASK-001"]));it("matches human IDs and excludes deleted by default",()=>{expect(searchProject(state,"task-002")).toEqual([]);expect(searchProject(state,"TASK-002",true)[0]).toMatchObject({isDeleted:true,module:"Tasks"})})});

describe("v1.5 descriptive field search",()=>{
  it("finds hidden descriptive fields without changing displayed result labels",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Delivery",status:"In Progress"})]});
    const results=searchProject(state,"IN PROGRESS");
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({module:"Streams",label:"Delivery"});
  });
  it("keeps deleted records excluded unless explicitly included",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Archived",status:"In Progress",deletion:{isDeleted:true}})]});
    expect(searchProject(state,"in progress")).toHaveLength(0);
    expect(searchProject(state,"in progress",true)).toHaveLength(1);
  });
});

describe("v1.5 search matching",()=>{
  it("matches role and notes fields without exposing them as result titles",()=>{
    const state=makeProjectState({people:[{id:"person-1",projectId:"project-1",humanId:"PERSON-001",name:"Alex",role:"Delivery Lead",notes:"Critical migration",deletion:{isDeleted:false}}]});
    expect(searchProject(state,"delivery lead")[0]).toMatchObject({entityType:"Person",label:"Alex"});
    expect(searchProject(state,"MIGRATION")[0]).toMatchObject({entityType:"Person",label:"Alex"});
  });
  it("supports case-insensitive partial matches on descriptive values",()=>{
    const state=makeProjectState({streams:[streamFixture({name:"Delivery",status:"In Progress"})]});
    expect(searchProject(state,"  progrESS  ")).toHaveLength(1);
  });
});
