import {describe,expect,it}from"vitest";import{createProjectStore,restore,softDelete}from"../../application";import{makeProjectState}from"../../domain/test-fixtures";import{createPerson,createStream,duplicateStream,editPerson,editPersonDetails,editStream}from"./commands";
const context={createId:(()=>{let i=0;return()=>`id-${++i}`})(),now:()=>"2026-09-15T00:00:00Z"};
describe("v1.5 resource details and no-op edits",()=>{
  it("capitalises role and notes and restores both in one undo",()=>{
    const store=createProjectStore(makeProjectState(),context);
    store.execute(createPerson("alex"));
    const id=store.getState().people[0].id;
    store.execute(editPersonDetails(id,{role:"delivery lead",notes:"coordinates migration"}));
    expect(store.getState().people[0]).toMatchObject({role:"Delivery lead",notes:"Coordinates migration"});
    store.undo();
    expect(store.getState().people[0].role??"").toBe("");
    expect(store.getState().people[0].notes??"").toBe("");
  });
  it("preserves state reference for unchanged stream names",()=>{
    const store=createProjectStore(makeProjectState(),context);
    store.execute(createStream({name:"delivery",ownerId:null,status:"Not Started"}));
    const before=store.getState();
    const stream=before.streams[0];
    expect(editStream(stream.id,{name:"delivery"}).apply(before,context)).toBe(before);
  });
});
describe("v1.5 name normalisation and undo",()=>{
  it("capitalises created names and treats one committed edit as one undo step",()=>{
    const store=createProjectStore(makeProjectState(),context);
    store.execute(createPerson("alex"));
    const personId=store.getState().people[0].id;
    expect(store.getState().people[0].name).toBe("Alex");
    store.execute(editPerson(personId,"alex smith"));
    expect(store.getState().people[0].name).toBe("Alex smith");
    store.undo();
    expect(store.getState().people[0].name).toBe("Alex");
    store.execute(createStream({name:"delivery",ownerId:personId,status:"Not Started"}));
    expect(store.getState().streams[0].name).toBe("Delivery");
    store.execute(editStream(store.getState().streams[0].id,{name:"release planning"}));
    expect(store.getState().streams[0].name).toBe("Release planning");
    store.undo();
    expect(store.getState().streams[0].name).toBe("Delivery");
  });
});
describe("streams and people",()=>{it("creates and edits resources with global undo",()=>{const s=createProjectStore(makeProjectState(),context);s.execute(createPerson("Alex"));const p=s.getState().people[0];s.execute(editPerson(p.id,"Alex Smith"));s.execute(createStream({name:"Delivery",ownerId:p.id,status:"Not Started"}));expect(s.getState().streams[0].ownerId).toBe(p.id);s.execute(editStream(s.getState().streams[0].id,{priority:"High"}));expect(s.getState().streams[0].priority).toBe("High");s.undo();expect(s.getState().streams[0].priority).toBeUndefined();});it("soft deletes, shows historical ownership, restores, and excludes deleted owners from copies",()=>{const s=createProjectStore(makeProjectState(),context);s.execute(createPerson("Owner"));const p=s.getState().people[0];s.execute(createStream({name:"S",ownerId:p.id,status:"Not Started"}));s.execute(softDelete("person",p.id));expect(s.getState().streams[0].ownerId).toBe(p.id);s.execute(duplicateStream(s.getState().streams[0].id));expect(s.getState().streams[1].ownerId).toBeNull();s.execute(restore("person",p.id));expect(s.getState().people[0].deletion.isDeleted).toBe(false);});});
