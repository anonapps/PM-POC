import {describe,it,expect} from 'vitest';
import {createProjectStore,softDelete,duplicate} from '../../application';
import {makeProjectState,taskFixture} from '../../domain/test-fixtures';
import {rowActionSucceeded,separatorTarget,ROW_FEEDBACK_MS} from './row-action-feedback-model';
const before=makeProjectState({tasks:[taskFixture({id:'source'})],identifierSequences:{stream:0,person:0,task:1,milestone:0,risk:0,decision:0}});
const context={createId:()=> 'copy',now:()=> '2026-11-09T12:00:00Z'};
describe('successful row action feedback',()=>{
 it('requires a real successful source deletion or same-collection duplicate',()=>{
  const store=createProjectStore(before,context);const original=store.getState();expect(store.execute(duplicate('task','source'))).toBe(true);expect(rowActionSucceeded('duplicate','source',original,store.getState())).toBe(true);
  const previous=store.getState();expect(store.execute(softDelete('task','source'))).toBe(true);expect(rowActionSucceeded('delete','source',previous,store.getState())).toBe(true);expect(ROW_FEEDBACK_MS).toBe(600);
 });
 it('rejects unchanged, missing, already-deleted and failed actions',()=>{
  const store=createProjectStore(before,context);expect(store.execute(softDelete('task','missing'))).toBe(false);expect(rowActionSucceeded('delete','source',before,store.getState())).toBe(false);expect(rowActionSucceeded('duplicate','missing',before,before)).toBe(false);
  expect(rowActionSucceeded('duplicate','source',before,{...before,people:[{id:'unrelated'} as never]})).toBe(false);
  const deleted={...before,tasks:[taskFixture({id:'source',deletion:{isDeleted:true,deletedAt:context.now()}})]};expect(rowActionSucceeded('delete','source',deleted,deleted)).toBe(false);
 });
 it('detects hard deletions from lists such as baselines',()=>{
  const baseline={id:'plan',name:'Plan',createdAt:context.now(),snapshot:{schemaVersion:1 as const,projectId:before.project.id,streams:[],items:[]}};
  expect(rowActionSucceeded('delete','plan',{...before,baselines:[baseline]},{...before,baselines:[]})).toBe(true);
 });
 it.each([
  [['a','b','c'],['a','c'],'b',{id:'c',edge:'top'}],
  [['a','b','c'],['b','c'],'a',{id:'b',edge:'top'}],
  [['a','b','c'],['a','b'],'c',{id:'b',edge:'bottom'}],
  [['a'],[],'a',null],
  [['c','b','a'],['c','a'],'b',{id:'a',edge:'top'}],
  [['b','d'],['d'],'b',{id:'d',edge:'top'}],
  [['a','b','c','d'],['a','d'],'b',{id:'d',edge:'top'}],
 ] as const)('uses visible stable neighbours %j -> %j',(ids,remaining,source,expected)=>expect(separatorTarget(ids,new Set(remaining),source)).toEqual(expected));
});
