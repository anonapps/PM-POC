import {describe,it,expect} from "vitest";
import {makeProjectState,streamFixture} from "../../domain/test-fixtures";
import {captureSchedule} from "../../domain/baselines";
import {baselineTubeLanes} from "./baseline-model";
import {buildTubeMap} from "./model";

const state=makeProjectState({streams:[streamFixture()],milestones:[{id:"m",projectId:"project-1",humanId:"MILESTONE-001",name:"Gate",plannedDate:"2026-11-09",status:"Planned",scope:{kind:"streams",streamIds:["stream-1"]},ownerId:null,relatedTaskIds:[],deletion:{isDeleted:false}}]});
const baseline={id:"b",name:"Original",createdAt:"2026-11-01T00:00:00Z",snapshot:captureSchedule(state)};
describe("Tube Map display projections",()=>{
 it("compacts lanes without changing dates, x positions or entity-level dependencies",()=>{
  const regular=buildTubeMap(state,"2026-11-02"),compact=buildTubeMap(state,"2026-11-02","original",false,"",[],{showNames:false});
  expect(compact.streams.every(s=>s.height===48)).toBe(true);
  expect(compact.height/regular.height).toBeCloseTo(48/88);
  expect(compact.stations.map(s=>[s.entityId,s.date,s.x])).toEqual(regular.stations.map(s=>[s.entityId,s.date,s.x]));
 });
 it("keeps dense compact hit targets on distinct 28px rows",()=>{
  const dense={...state,milestones:Array.from({length:4},(_,i)=>({...state.milestones[0],id:`m${i}`}))};
  const model=buildTubeMap(dense,"2026-11-02","original",false,"",[],{showNames:false}),ys=model.stations.map(s=>s.y);
  expect(new Set(ys).size).toBe(4);expect(ys[1]-ys[0]).toBe(28);
  expect(model.streams[1].height).toBe(112);
 });
 it("uses immutable historical dates/scopes, preserves removed lanes and reserves overlay space",()=>{
  const live={...state,streams:[],milestones:[]},before=JSON.stringify(baseline);
  const lanes=baselineTubeLanes(baseline,live,"2026-11-02","2027-01-25",false);
  expect(lanes[0]).toMatchObject({id:"stream-1",label:"Stream",height:28});
  expect(lanes[0].stations[0].x).toBeCloseTo(100/12);
  expect(lanes[0].stations[0].row.status).toBe("Removed");
  const model=buildTubeMap(live,"2026-11-02","original",false,"",[],{showNames:false,historicalLanes:lanes});
  expect(model.streams[1]).toMatchObject({id:"stream-1",height:76,contentHeight:48});
  const hidden={...state,streams:state.streams.map(stream=>({...stream,deletion:{isDeleted:true}}))};
  expect(buildTubeMap(hidden,"2026-11-02","original",false,"",[],{historicalLanes:lanes}).stations).toHaveLength(0);
  expect(JSON.stringify(baseline)).toBe(before);
 });
 it("shares boundaries, historical query/sort and live status filters without fabricating snapshot status",()=>{
  expect(baselineTubeLanes(baseline,state,"2026-11-09","2027-02-01",true)).toHaveLength(1);
  expect(baselineTubeLanes(baseline,state,"2026-08-17","2026-11-09",true)).toHaveLength(0);
  expect(baselineTubeLanes(baseline,state,"2026-11-02","2027-01-25",true,"missing")).toHaveLength(0);
  expect(baselineTubeLanes(baseline,state,"2026-11-02","2027-01-25",true,"gate",["Complete"])).toHaveLength(0);
  expect(baselineTubeLanes(baseline,state,"2026-11-02","2027-01-25",true,"gate",["Planned"])).toHaveLength(1);
  expect(baseline.snapshot.items[0]).not.toHaveProperty("status");
 });
});
