import { createRisk } from '../risks/commands';
import {describe,it,expect} from 'vitest';
import {createProjectStore} from '../../application';
import {regressionFixture} from '../../testing/regression-fixture';
import {serializeProject,deserializeProject} from '../../persistence/pmp';
import {initialCreationDraft,prepareCreation,creationIsDirty,type CreationKind} from './entity-creation';
const kinds:CreationKind[]=['person','stream','task','milestone','risk','decision'];
const collections={person:'people',stream:'streams',task:'tasks',milestone:'milestones',risk:'risks',decision:'decisions'} as const;
for(const kind of kinds)describe(`${kind} unified panel command`,()=>{
 it('requires its original mandatory fields without mutating IDs or data',()=>{
  const state=regressionFixture(),draft=initialCreationDraft(kind);expect(creationIsDirty(kind,draft)).toBe(false);
  const result=prepareCreation(kind,draft,state);expect(result.errors.name).toContain('required');expect(result.command).toBeUndefined();
  if(kind==='decision'||kind==='milestone')expect(result.errors.date).toContain('required');
  expect(creationIsDirty(kind,{...draft,name:'Draft'})).toBe(true);expect(state.identifierSequences).toEqual(regressionFixture().identifierSequences);
 });
 it('creates required and optional fields atomically, with audit/history/dependencies and PMP round-trip',()=>{
  const state={...regressionFixture(),auditHistory:{enabled:true,events:[]}},draft={...initialCreationDraft(kind),name:'équipe XML',description:'notes XML\nsecond LINE',role:'lead QA',notes:'  legacy-style NOTES\nsecond LINE  ',date:'2028-02-29',ownerId:state.people[1].id,priority:'High',startDate:'2028-02-28',endDate:'2028-03-02',dueDate:'2028-03-04',progress:'35',scopeId:state.streams[1].id,projectWide:false,streamIds:[state.streams[1].id,state.streams[2].id],taskIds:[state.tasks[1].id],milestoneIds:[state.milestones[1].id],riskIds:[state.risks[1].id],predecessors:kind==='task'?[state.tasks[1].id]:kind==='milestone'?[`task:${state.tasks[1].id}`,`milestone:${state.milestones[1].id}`]:[]};
  if(kind==='risk')draft.actions=[{description:'initial action',status:'Open' as const,dueDate:'2028-03-04'}];
  const prepared=prepareCreation(kind,draft,state);expect(prepared.errors).toEqual({});let sequence=0;
  const store=createProjectStore(state,{createId:()=>`panel-${++sequence}`,now:()=> '2028-02-29T12:00:00Z'}),before=store.getState(),collection=collections[kind];
  expect(store.execute(prepared.command!)).toBe(true);const saved=store.getState(),created=saved[collection].at(-1)!;
  expect(saved[collection]).toHaveLength(31);expect('name' in created?created.name:created.title).toBe('Équipe XML');expect(saved.auditHistory!.events.filter(e=>e.action==='created'&&e.entityType===kind)).toHaveLength(1);
  if(kind==='person')expect(created).toMatchObject({role:'Lead QA',notes:'  Legacy-style NOTES\nsecond LINE  '});
  if(kind==='stream')expect(created).toMatchObject({ownerId:draft.ownerId,priority:'High',startDate:draft.startDate,endDate:draft.endDate});
  if(kind==='task'){expect(created).toMatchObject({scope:{kind:'stream',streamId:draft.scopeId},ownerId:draft.ownerId,progress:35});expect(saved.dependencies).toHaveLength(before.dependencies.length+1);}
  if(kind==='milestone'){expect(created).toMatchObject({scope:{kind:'streams',streamIds:draft.streamIds},relatedTaskIds:draft.taskIds});expect(saved.dependencies).toHaveLength(before.dependencies.length+2);}
  if(kind==='risk')expect(created).toMatchObject({relatedTaskIds:draft.taskIds,actions:[{description:'Initial action',dueDate:'2028-03-04'}]});
  if(kind==='decision')expect(created).toMatchObject({relatedRiskIds:draft.riskIds,relatedTaskIds:draft.taskIds,relatedStreamIds:draft.streamIds});
  const bytes=serializeProject(saved,{createdAt:'2026-01-01T00:00:00Z',lastSavedAt:'2028-02-29T12:00:00Z',runtimeVersion:'1.5.0-rc.1'});expect(bytes.ok).toBe(true);if(!bytes.ok)return;const reopened=deserializeProject(bytes.value);expect(reopened.ok).toBe(true);if(reopened.ok)expect(reopened.value.projectState).toEqual(JSON.parse(JSON.stringify(saved)));
  store.undo();expect(store.getState()[collection]).toEqual(before[collection]);expect(store.getState().dependencies).toEqual(before.dependencies);expect(store.getState().identifierSequences).toEqual(before.identifierSequences);store.redo();expect(store.getState()[collection]).toEqual(saved[collection]);expect(store.getState().dependencies).toEqual(saved.dependencies);
 });
});
describe('panel optional-field validation and relationships',()=>{
 it('validates calendars, ordering, numeric progress and active relationships',()=>{const s=regressionFixture(),d={...initialCreationDraft('task'),name:'Task',startDate:'2026-02-30',endDate:'2020-01-01',progress:'101',ownerId:'missing'};expect(prepareCreation('task',d,s).errors).toMatchObject({startDate:expect.any(String),endDate:expect.any(String),progress:expect.any(String),ownerId:expect.any(String)});});
 it('rejects an empty non-project milestone scope and incomplete risk actions',()=>{const s=regressionFixture();expect(prepareCreation('milestone',{...initialCreationDraft('milestone'),name:'Gate',date:'2028-02-29',projectWide:false},s).command).toBeUndefined();expect(prepareCreation('risk',{...initialCreationDraft('risk'),name:'Risk',actions:[{description:'',status:'Open'}]},s).errors.actions).toBeTruthy();});
 it('preserves Decision Project-wide exclusivity while retaining Task/Risk context',()=>{const s=regressionFixture(),d={...initialCreationDraft('decision'),name:'Decision',date:'2028-02-29',projectWide:true,streamIds:[s.streams[0].id],milestoneIds:[s.milestones[0].id],taskIds:[s.tasks[0].id],riskIds:[s.risks[0].id]};const result=prepareCreation('decision',d,s);const store=createProjectStore(s,{createId:()=> 'new',now:()=> '2028-02-29T12:00:00Z'});store.execute(result.command!);expect(store.getState().decisions.at(-1)).toMatchObject({projectWide:true,relatedStreamIds:[],relatedMilestoneIds:[],relatedTaskIds:d.taskIds,relatedRiskIds:d.riskIds});});
});


describe('atomic initial Risk actions',()=>{it('rejects an invalid initial action without consuming identities or history',()=>{const state=regressionFixture();const store=createProjectStore(state,{createId:()=>{throw new Error('No ID should be consumed');},now:()=> '2028-02-29T12:00:00Z'});expect(store.execute(createRisk({title:'Risk',status:'Open',probability:'Low',impact:'Low',ownerId:null,projectWide:true,relatedStreamIds:[],relatedTaskIds:[],relatedMilestoneIds:[]},[{description:'Action',status:'Open',dueDate:'2026-02-30'}]))).toBe(false);expect(store.canUndo()).toBe(false);});});

describe('People optional text bounds',()=>{it('associates length errors with Role/Notes instead of creating invalid data',()=>{const d={...initialCreationDraft('person'),name:'Person',role:'x'.repeat(501),notes:'x'.repeat(20001)};expect(prepareCreation('person',d,regressionFixture()).errors).toMatchObject({role:expect.any(String),notes:expect.any(String)});expect(prepareCreation('person',{...initialCreationDraft('person'),name:'Person',role:'ß'+'x'.repeat(499)},regressionFixture()).errors.role).toBeTruthy();});});
