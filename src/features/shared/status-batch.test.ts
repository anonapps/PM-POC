import {describe,it,expect} from 'vitest';
import {createElement} from 'react';import {renderToStaticMarkup} from 'react-dom/server';
import {TASK_STATUSES,LIFECYCLE_STATUSES,MILESTONE_STATUSES} from '../../domain';
import {makeProjectState,taskFixture,streamFixture} from '../../domain/test-fixtures';
import {createProjectStore,duplicate} from '../../application';
import {createTask,editTask} from '../tasks/commands';
import {deserializeProject,serializeProject} from '../../persistence/pmp';
import {readFileSync} from 'node:fs';
import {buildGanttModel} from '../gantt/model';import {buildTubeMap} from '../tube-map/model';
import {TimelineStatusLegend,TASK_STATUS_COLOURS,MILESTONE_STATUS_COLOURS} from './timeline-status';
import {filterPanelPosition} from './filter-panel-position';
const meta={createdAt:'2026-01-01T00:00:00Z',lastSavedAt:'2026-10-24T12:00:00Z',runtimeVersion:'1.5.0-rc.1'};
describe('Tentative task model and compatibility',()=>{
 it('is task-only and supports creation/edit/history, persisted data and existing duplication reset',()=>{
  expect(TASK_STATUSES).toHaveLength(6);expect(LIFECYCLE_STATUSES).not.toContain('Tentative');let id=0;const store=createProjectStore(makeProjectState(),{createId:()=>`t${++id}`,now:()=>meta.lastSavedAt});
  expect(store.execute(createTask({name:'Draft task',status:'Tentative',progress:0,scope:{kind:'project'},ownerId:null}))).toBe(true);const task=store.getState().tasks[0];expect(task.status).toBe('Tentative');store.execute(editTask(task.id,{status:'Completed'}));store.undo();expect(store.getState().tasks[0].status).toBe('Tentative');
  const encoded=serializeProject(store.getState(),{...meta,minimumRuntimeVersion:"1.1.0"});expect(encoded.ok).toBe(true);if(!encoded.ok)return;const loaded=deserializeProject(encoded.value);expect(loaded.ok).toBe(true);if(loaded.ok){expect(loaded.value.projectState.tasks[0].status).toBe('Tentative');expect(loaded.value.manifest.compatibility.minimumRuntimeVersion).toBe('1.5.0-rc.1');}
  store.execute(duplicate('task',task.id));expect(store.getState().tasks[0].status).toBe('Tentative');expect(store.getState().tasks[1].status).toBe('Not Started');
 });
 it('loads and resaves the frozen legacy file without assigning Tentative to any existing task',()=>{const legacy=deserializeProject(new Uint8Array(readFileSync('src/testing/fixtures/v1.4-rich-project.pmp')));expect(legacy.ok).toBe(true);if(!legacy.ok)return;const statuses=legacy.value.projectState.tasks.map(t=>t.status);const encoded=serializeProject(legacy.value.projectState,{...meta,minimumRuntimeVersion:legacy.value.manifest.compatibility.minimumRuntimeVersion});expect(encoded.ok).toBe(true);if(!encoded.ok)return;const reopened=deserializeProject(encoded.value);expect(reopened.ok).toBe(true);if(reopened.ok)expect(reopened.value.projectState.tasks.map(t=>t.status)).toEqual(statuses);});
 it('rejects unknown task values without creating a record',()=>{const s=createProjectStore(makeProjectState(),{createId:()=> 'id',now:()=>meta.lastSavedAt});expect(s.execute(createTask({name:'Bad',status:'Unknown' as 'Tentative',progress:0,scope:{kind:'project'},ownerId:null}))).toBe(false);});
});
describe('chart status projection and legends',()=>{
 const milestones=MILESTONE_STATUSES.map((status,index)=>({id:`m${index}`,projectId:'project-1',humanId:`MILESTONE-00${index+1}` as const,name:`Gate ${status}`,plannedDate:'2026-10-24',status,ownerId:null,scope:{kind:'streams' as const,streamIds:['stream-1']},relatedTaskIds:[],deletion:{isDeleted:false}}));
 const state=makeProjectState({streams:[streamFixture(),streamFixture({id:'empty',humanId:'STREAM-002',name:'Empty'})],tasks:TASK_STATUSES.map((status,index)=>taskFixture({id:`t${index}`,humanId:`TASK-00${index+1}`,status,scope:{kind:'stream',streamId:'stream-1'}})),milestones});
 it('filters task statuses with grouping/empty-stream handling without altering canonical data',()=>{const before=JSON.stringify(state);const model=buildGanttModel(state,'Week','2026-10-24',0,true,['Tentative','On Hold']);expect(model.rows.filter(r=>r.kind==='task').map(r=>r.status)).toEqual(['Tentative','On Hold']);expect(model.rows.some(r=>r.id==='empty')).toBe(false);expect(model.rows.filter(r=>r.kind==='milestone')).toHaveLength(4);expect(JSON.stringify(state)).toBe(before);expect(buildGanttModel(state,'Week','2026-10-24').rows.filter(r=>r.kind==='task')).toHaveLength(6);});
 it('applies Tube status filtering before lane population/search and shared connections',()=>{const result=buildTubeMap(state,'2026-10-24','original',true,'Gate Planned',['Planned']);expect(result.stations).toHaveLength(1);expect(result.stations[0].status).toBe('Planned');expect(result.streams.map(s=>s.id)).toEqual(['project','stream-1']);const noMatches=buildTubeMap(state,'2026-10-24','original',true,'',['Delayed']);expect(noMatches.stations.every(s=>s.status==='Delayed')).toBe(true);expect(noMatches.streams.some(s=>s.id==='empty')).toBe(false);});
 it('always includes every status and shares one colour source with the actual chart',()=>{for(const kind of ['task','milestone'] as const){const html=renderToStaticMarkup(createElement(TimelineStatusLegend,{kind}));for(const status of kind==='task'?TASK_STATUSES:MILESTONE_STATUSES)expect(html).toContain(status);}expect(new Set(Object.values(TASK_STATUS_COLOURS)).size).toBe(6);expect(Object.keys(MILESTONE_STATUS_COLOURS)).toEqual([...MILESTONE_STATUSES]);});
});
describe('measured dropdown connection',()=>{
 it('places a short popup directly above its anchor, not a maximum-height gap away',()=>{const p=filterPanelPosition({left:300,top:800,bottom:834},1440,900,80,260);expect(p.top+80).toBe(794);expect(p.width).toBe(260);});
 it('uses below when the actual content fits there even near the viewport bottom',()=>{const p=filterPanelPosition({left:300,top:720,bottom:754},1440,900,80);expect(p.top).toBe(760);});
});
