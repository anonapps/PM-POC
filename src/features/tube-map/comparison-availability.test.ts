import { describe, expect, it } from 'vitest';
import { captureSchedule, type ProjectBaseline } from '../../domain/baselines';
import { makeProjectState, streamFixture, taskFixture } from '../../domain/test-fixtures';
import type { Milestone } from '../../domain/entities';
import { hasTubeComparisonDifference } from './comparison-availability';
const gate:Milestone={id:'gate',projectId:'project-1',humanId:'MILESTONE-001',name:'Gate',plannedDate:'2026-11-09',status:'Planned',ownerId:null,scope:{kind:'streams',streamIds:['stream-1','stream-2']},relatedTaskIds:[],deletion:{isDeleted:false}};
const state=makeProjectState({streams:[streamFixture(),streamFixture({id:'stream-2',name:'Operations'})],milestones:[gate],tasks:[taskFixture()]});
const baseline:ProjectBaseline={id:'original',name:'Original',createdAt:'2026-11-09T12:00:00Z',snapshot:captureSchedule(state)};
describe('Tube Map comparison availability',()=>{
 it('disables missing and identical baselines, including differently named copies',()=>{
  expect(hasTubeComparisonDifference(null,state)).toBe(false);
  expect(hasTubeComparisonDifference(baseline,state)).toBe(false);
  expect(hasTubeComparisonDifference({...baseline,id:'copy',name:'Copy'},state)).toBe(false);
 });
 it('ignores ordering and task-only changes',()=>{
  expect(hasTubeComparisonDifference(baseline,{...state,streams:[...state.streams].reverse(),tasks:[taskFixture({name:'Changed task',endDate:'2026-12-01'})],milestones:[{...gate,scope:{kind:'streams',streamIds:['stream-2','stream-1']}}]})).toBe(false);
 });
 it.each(['name','plannedDate','scope'] as const)('enables changed milestone %s',field=>{
  const changed=field==='name'?{...gate,name:'Renamed'}:field==='plannedDate'?{...gate,plannedDate:'2026-11-10'}:{...gate,scope:{kind:'project' as const}};
  expect(hasTubeComparisonDifference(baseline,{...state,milestones:[changed]})).toBe(true);
 });
 it('enables added/removed milestones and renamed streams without mutating snapshots',()=>{
  const before=JSON.stringify(baseline);
  expect(hasTubeComparisonDifference(baseline,{...state,milestones:[]})).toBe(true);
  expect(hasTubeComparisonDifference(baseline,{...state,milestones:[gate,{...gate,id:'added'}]})).toBe(true);
  expect(hasTubeComparisonDifference(baseline,{...state,streams:[streamFixture({name:'Renamed'}),state.streams[1]]})).toBe(true);
  expect(JSON.stringify(baseline)).toBe(before);
 });
});
