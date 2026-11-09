import {createElement} from "react";
import {renderToStaticMarkup} from "react-dom/server";
import {createProjectStore} from "../../application";
import {DependenciesModule} from "../dependencies/dependencies";
import {describe,it,expect} from "vitest";
import {makeProjectState,taskFixture} from "../../domain/test-fixtures";
import type {Dependency,Milestone} from "../../domain";
import {calculateCriticalPath} from "../../domain/critical-path/calculate";
import {projectWarningProjection} from "./use-project-warnings";
import {warningNavigation} from "./navigation";
import type {ProjectWarning} from "./warnings";
const gate=(id:string):Milestone=>({id,projectId:"project-1",humanId:"MILESTONE-001",name:"Same name",plannedDate:"2026-01-01",status:"Planned",ownerId:null,scope:{kind:"project"},relatedTaskIds:[],deletion:{isDeleted:false}});
const edge=(id:string,from:string,to:string):Dependency=>({id,projectId:"project-1",type:"Finish-to-Start",predecessor:{kind:"milestone",id:from},successor:{kind:"milestone",id:to}});
const warning:ProjectWarning={id:"w",type:"Critical path analysis",severity:"warning",entityType:"Milestone",entityId:"m",humanId:"MILESTONE-001",entityName:"Same name",description:"Review Dependencies",destination:"Dependencies",dependencyId:"stable-edge"};
describe("Fix 3 warning navigation",()=>{
 it("preserves task and other warning routes, including their original owning record",()=>{
  const state=makeProjectState();
  for(const item of [{...warning,entityType:"Task" as const,destination:"Tasks" as const,entityId:"task-1"},{...warning,entityType:"Task" as const},{...warning,type:"Finish-to-Start violation" as const,destination:"Milestones" as const}])expect(warningNavigation(state,item)).toMatchObject({destination:item.destination,entityId:item.entityId,dependencyIds:[],fallback:undefined});
 });
 it("projects relationship identity separately from milestone identity without duplicating warnings",()=>{
  const state=makeProjectState({tasks:[taskFixture({startDate:"2026-01-01",endDate:"2026-01-05"})],milestones:[gate("m")],dependencies:[{...edge("stable-edge","unused","m"),predecessor:{kind:"task",id:"task-1"}}]});
  const all=projectWarningProjection(state,calculateCriticalPath(state).diagnostics),item=all.find(w=>w.id==="cpm:schedule:stable-edge")!;
  expect(all.filter(w=>w.id===item.id)).toHaveLength(1);expect(item).toMatchObject({entityId:"m",dependencyIds:["stable-edge"]});
  expect(warningNavigation(state,item)).toMatchObject({destination:"Dependencies",entityId:"stable-edge"});
 });
 it("supplies sorted cycle IDs from the actual component, excluding bridges and unrelated cycles",()=>{
  const state=makeProjectState({milestones:["a","b","c","d"].map(gate),dependencies:[edge("z","a","b"),edge("a","b","a"),edge("other-1","c","d"),edge("other-2","d","c"),edge("bridge","b","c")]});
  const before=JSON.stringify(state),result=calculateCriticalPath(state),item=result.diagnostics.find(d=>d.id==="cpm:cycle:milestone:a")!;
  expect(item.dependencyIds).toEqual(["a","z"]);expect(result.diagnostics.find(d=>d.id==="cpm:cycle:milestone:c")!.dependencyIds).toEqual(["other-1","other-2"]);
  expect(result.activities.every(a=>a.critical===null)).toBe(true);expect(JSON.stringify(state)).toBe(before);
  expect(warningNavigation(state,projectWarningProjection(state,result.diagnostics).find(w=>w.id===item.id)!)).toMatchObject({destination:"Dependencies",entityId:"a",dependencyIds:["a","z"]});
 });
 it("deduplicates and sorts existing targets by stable ID, regardless of list or display order",()=>{
  const state=makeProjectState({dependencies:[edge("z","a","b"),edge("a","a","b")]});
  expect(warningNavigation(state,{...warning,dependencyId:undefined,dependencyIds:["z","missing","a","z"]})).toMatchObject({entityId:"a",dependencyIds:["a","z"]});
 });
 it("never substitutes an incident record or milestone-named dependency for a missing target",()=>{
  const state=makeProjectState({dependencies:[edge("m","a","b"),edge("incident","a","m")]});
  for(const item of [warning,{...warning,dependencyId:undefined,dependencyIds:[]}])expect(warningNavigation(state,item)).toMatchObject({destination:"Milestones",entityId:"m",dependencyIds:[],fallback:expect.stringContaining("No dependency can be identified")});
 });
 it("preserves date-only milestone warnings and retains missing metadata for a meaningful fallback",()=>{
  const state=makeProjectState({milestones:[gate("m")]});
  expect(warningNavigation(state,{...warning,destination:"Milestones",dependencyId:undefined})).toMatchObject({destination:"Milestones",entityId:"m",fallback:undefined});
  const item=projectWarningProjection(state,[{id:"stale",kind:"milestone",entityId:"m",dependencyId:"removed",code:"reference",description:"Review relationship"}]).find(w=>w.id==="stale")!;
  expect(warningNavigation(state,item)).toMatchObject({destination:"Milestones",entityId:"m",fallback:expect.any(String)});
 });
 it("renders a missing dependency target message and never marks another row",()=>{
  const state=makeProjectState({milestones:[gate("a"),gate("b")],dependencies:[edge("m","a","b")]});
  const store=createProjectStore(state,{createId:()=>"unused",now:()=>"2026-11-02T00:00:00Z"});
  const html=renderToStaticMarkup(createElement(DependenciesModule,{store,targetId:"removed"}));
  expect(html).toContain("The selected dependency is no longer available");expect(html).not.toContain('class="navigation-target"');expect(html).toContain('data-navigation-id="m"');
 });

});
