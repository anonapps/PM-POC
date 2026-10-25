import { describe,expect,it } from "vitest";
import { createProjectStore,type ProjectCommand,type ProjectState } from "../application";
import { regressionFixture } from "./regression-fixture";
import { editPerson,editPersonDetails,editStream } from "../features/resources/commands";
import { editTask } from "../features/tasks/commands";
import { editMilestone } from "../features/milestones/commands";
import { editRisk,editRiskAction } from "../features/risks/commands";
import { editDecision } from "../features/decisions/commands";
import { updateProject } from "../features/overview/project";
import { deserializeProject,serializeProject } from "../persistence/pmp";
import { APP_VERSION } from "../shared/app-info";
const raw="équipe XML";const normalized="Équipe XML";
type Case={label:string;command:(state:ProjectState,value:string)=>ProjectCommand;read:(state:ProjectState)=>unknown};
const cases:Case[]=[
 {label:"Project name",command:(_,name)=>updateProject({name}),read:s=>s.project.name},
 {label:"Project description",command:(_,description)=>updateProject({description}),read:s=>s.project.description},
 {label:"Person name",command:(s,name)=>editPerson(s.people[0].id,name),read:s=>s.people[0].name},
 {label:"Person role",command:(s,role)=>editPersonDetails(s.people[0].id,{role}),read:s=>s.people[0].role},
 {label:"Person notes",command:(s,notes)=>editPersonDetails(s.people[0].id,{notes}),read:s=>s.people[0].notes},
 {label:"Stream name",command:(s,name)=>editStream(s.streams[0].id,{name}),read:s=>s.streams[0].name},
 {label:"Stream description",command:(s,description)=>editStream(s.streams[0].id,{description}),read:s=>s.streams[0].description},
 {label:"Task name",command:(s,name)=>editTask(s.tasks[0].id,{name}),read:s=>s.tasks[0].name},
 {label:"Task description",command:(s,description)=>editTask(s.tasks[0].id,{description}),read:s=>s.tasks[0].description},
 {label:"Milestone name",command:(s,name)=>editMilestone(s.milestones[0].id,{name}),read:s=>s.milestones[0].name},
 {label:"Milestone description",command:(s,description)=>editMilestone(s.milestones[0].id,{description}),read:s=>s.milestones[0].description},
 {label:"Risk title",command:(s,title)=>editRisk(s.risks[0].id,{title}),read:s=>s.risks[0].title},
 {label:"Risk description",command:(s,description)=>editRisk(s.risks[0].id,{description}),read:s=>s.risks[0].description},
 {label:"Decision title",command:(s,title)=>editDecision(s.decisions[0].id,{title}),read:s=>s.decisions[0].title},
 {label:"Decision description",command:(s,description)=>editDecision(s.decisions[0].id,{description}),read:s=>s.decisions[0].description},
 {label:"Risk action",command:(s,description)=>editRiskAction(s.risks[1].id,s.risks[1].actions[0].id,{description}),read:s=>s.risks[1].actions[0].description},
];
describe("atomic human-readable text edits",()=>{
 for(const scenario of cases)it(`${scenario.label}: one edit/event, no duplicate, Undo/Redo and PMP persistence`,()=>{
  const initial={...regressionFixture(),auditHistory:{enabled:true,events:[]}};
  const store=createProjectStore(initial,{createId:()=>"new-id",now:()=>"2026-10-24T12:00:00.000Z"});const before=store.getState();
  expect(store.execute(scenario.command(before,raw))).toBe(true);expect(scenario.read(store.getState())).toBe(normalized);
  expect(store.getState().auditHistory!.events).toHaveLength(1);
  expect(store.execute(scenario.command(store.getState(),raw))).toBe(false);expect(store.getState().auditHistory!.events).toHaveLength(1);
  store.undo();expect(scenario.read(store.getState())).toEqual(scenario.read(before));store.redo();expect(scenario.read(store.getState())).toBe(normalized);
  const encoded=serializeProject(store.getState(),{runtimeVersion:APP_VERSION,minimumRuntimeVersion:"1.2.0",createdAt:"2026-10-11T00:00:00Z",lastSavedAt:"2026-10-24T12:00:00Z"});expect(encoded.ok).toBe(true);if(!encoded.ok)return;
  const decoded=deserializeProject(encoded.value);expect(decoded.ok).toBe(true);if(decoded.ok)expect(decoded.value.projectState).toEqual(store.getState());
 });
 it("does not reformat untouched lowercase legacy fields on another edit",()=>{
  const seed=regressionFixture();const state={...seed,tasks:seed.tasks.map((t,i)=>i===4?{...t,name:"lower LEGACY",description:"untouched legacy"}:t),people:seed.people.map((p,i)=>i===0?{...p,role:"legacy ROLE",notes:"untouched notes"}:p)};
  const store=createProjectStore(state,{createId:()=>"new-id",now:()=>"2026-10-24T12:00:00Z"});
  store.execute(editTask(state.tasks[4].id,{ownerId:state.people[0].id}));expect(store.getState().tasks[4]).toMatchObject({name:"lower LEGACY",description:"untouched legacy"});
  store.execute(editPersonDetails(state.people[0].id,{role:"new ROLE"}));expect(store.getState().people[0].notes).toBe("untouched notes");
 });
 it("preserves notes whitespace and technical patch values",()=>{
  const store=createProjectStore(regressionFixture(),{createId:()=>"new-id",now:()=>"2026-10-24T12:00:00Z"});const s=store.getState();
  store.execute(editDecision(s.decisions[0].id,{description:"  (équipe XML)\nsecond LINE  ",ownerId:s.people[0].id}));
  expect(store.getState().decisions[0].description).toBe("  (Équipe XML)\nsecond LINE  ");expect(store.getState().decisions[0].ownerId).toBe(s.people[0].id);
 });
});

it("context Save does not normalise an unchanged legacy draft field",()=>{
 const seed=regressionFixture();const decision={...seed.decisions[0],description:"legacy LOWER text"};
 const store=createProjectStore({...seed,decisions:[decision],auditHistory:{enabled:true,events:[]}},{createId:()=>"id",now:()=>"2026-10-24T12:00:00Z"});
 store.execute(editDecision(decision.id,{description:decision.description,ownerId:seed.people[0].id}));
 expect(store.getState().decisions[0].description).toBe("legacy LOWER text");
 expect(store.getState().auditHistory!.events).toHaveLength(1);expect(store.getState().auditHistory!.events[0].field).toBe("ownerId");
});
