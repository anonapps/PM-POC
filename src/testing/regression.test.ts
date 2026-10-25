import {readFileSync} from 'node:fs';
import { describe, expect, it } from 'vitest';
import { regressionFixture, REGRESSION_TODAY } from './regression-fixture';
import { serializeProject, deserializeProject } from '../persistence/pmp/codec';
import { createProjectStore } from '../application/store';
import { duplicate, softDelete, restore } from '../application/commands';
import { editRisk, isRiskActionOverdue } from '../features/risks/commands';
import { editTask } from '../features/tasks/commands';
import { editDecision } from '../features/decisions/commands';
import { searchProject } from '../features/search/search';
import { buildGanttModel } from '../features/gantt/model';
import { buildTubeMap } from '../features/tube-map/model';
import { writeFileSync } from 'node:fs';
const meta = { createdAt: '2026-10-11T00:00:00Z', lastSavedAt: '2026-10-11T00:00:00Z', runtimeVersion: '1.2.0' };
const collections = ['streams','people','tasks','milestones','risks','decisions'] as const;
const pairs = <T>(rows: readonly T[], a: (row: T) => unknown, b: (row: T) => unknown) => new Set(rows.map(row => `${a(row)}|${b(row)}`)).size;
function roundTrip(state = regressionFixture()) {
  const encoded = serializeProject(state, meta);
  expect(encoded.ok, JSON.stringify(encoded)).toBe(true);
  if (!encoded.ok) throw new Error('Invalid regression fixture');
  const decoded = deserializeProject(encoded.value);
  expect(decoded.ok).toBe(true);
  if (!decoded.ok) throw new Error('Cannot reopen regression fixture');
  expect(decoded.value.projectState).toEqual(JSON.parse(JSON.stringify(state)));
  return encoded.value;
}
describe('180-record regression', () => {
  it('has deterministic counts, unique IDs and supported scenario pairs', () => {
    const state = regressionFixture();
    expect(state).toEqual(regressionFixture());
    collections.forEach(key => expect(state[key]).toHaveLength(30));
    expect(new Set(collections.flatMap(key => state[key].map(e => e.id))).size).toBe(180);
    for (const key of ['streams','tasks'] as const) expect(pairs<{status:string;ownerId:string|null}>(state[key], e => e.status, e => !!e.ownerId)).toBe(10);
    expect(pairs(state.tasks, e => e.status, e => state.dependencies.some(d => d.successor.kind === 'task' && d.successor.id === e.id))).toBe(10);
    expect(pairs(state.milestones, e => e.status, e => state.dependencies.some(d => d.successor.kind === 'milestone' && d.successor.id === e.id))).toBe(8);
    expect(pairs(state.risks, e => e.probability, e => e.impact)).toBe(9);
    expect(pairs(state.risks, e => e.status, e => !!e.ownerId)).toBe(8);
    expect(pairs(state.milestones, e => e.status, e => !!e.ownerId)).toBe(8);
    expect(state.risks.some(r => r.actions.length === 0)).toBe(true);
    expect(state.risks.flatMap(r => r.actions).filter(a => isRiskActionOverdue(a, REGRESSION_TODAY))).toHaveLength(20);
  });
  it('round trips every field through a real .pmp container and emits an optional disposable browser fixture', () => {
    const bytes = roundTrip();
    if (process.env.REGRESSION_PMP_PATH) writeFileSync(process.env.REGRESSION_PMP_PATH, bytes);
    expect(bytes).toEqual(roundTrip());
  });
  it('finds every record by ID across all six modules', () => {
    const state = regressionFixture();
    collections.forEach(key => state[key].forEach(e => expect(searchProject(state, e.humanId).map(r => r.entityId)).toContain(e.id)));
  });
  it('projects all tasks and milestone scopes consistently across Gantt and Tube Map', () => {
    const state = regressionFixture(), gantt = buildGanttModel(state, 'Month', REGRESSION_TODAY), tube = buildTubeMap(state, REGRESSION_TODAY);
    expect(gantt.rows.filter(r => r.kind === 'task')).toHaveLength(30);
    expect(tube.streams).toHaveLength(31);
    expect(tube.weeks).toHaveLength(12);
    for (const milestone of state.milestones) {
      const count = milestone.scope.kind === 'project' ? 1 : milestone.scope.streamIds.length;
      expect(tube.stations.filter(s => s.entityId === milestone.id)).toHaveLength(count);
      expect(gantt.rows.filter(r => r.kind === 'milestone' && r.id.startsWith(`${milestone.id}:`))).toHaveLength(count);
    }
    expect(new Set(tube.stations.map(s => s.boundary))).toEqual(new Set(['before','inside','after']));
  });
  for (const [kind, collection] of [['task','tasks'],['milestone','milestones'],['risk','risks'],['decision','decisions']] as const) {
    it(`${kind}: duplicate, undo/redo, delete, restore and reopen at volume`, () => {
      let next = 0;
      const store = createProjectStore(regressionFixture(), { createId: () => `new-${++next}`, now: () => meta.createdAt });
      const before = store.getState();
      expect(store.execute(duplicate(kind, before[collection][1].id))).toBe(true);
      const copy = store.getState()[collection][30];
      expect(copy.humanId).toBe(`${kind.toUpperCase()}-031`);
      expect(store.undo()).toBe(true); expect(store.getState()).toEqual(before);
      expect(store.redo()).toBe(true);
      expect(store.execute(softDelete(kind, copy.id))).toBe(true);
      expect(searchProject(store.getState(), copy.humanId)).toHaveLength(0);
      expect(searchProject(store.getState(), copy.humanId, true)).toHaveLength(1);
      expect(store.execute(restore(kind, copy.id))).toBe(true);
      roundTrip(store.getState());
      store.acknowledgeSave(); expect(store.isDirty()).toBe(false);
      expect(store.undo()).toBe(true); expect(store.isDirty()).toBe(true);
    });
  }
  for (const progress of [0, 25, 50, 75, 100]) {
    it(`propagates ${progress}% through four hierarchy levels at volume`, () => {
      const store = createProjectStore(regressionFixture(), { createId: () => 'unused', now: () => meta.createdAt });
      store.execute(editTask('task-4', { progress, status: progress === 100 ? 'Completed' : 'In Progress' }));
      expect(store.getState().tasks.slice(0, 4).map(t => t.progress)).toEqual([progress, progress, progress, progress]);
      roundTrip(store.getState());
    });
  }
  for (const [kind, collection] of [['stream','streams'],['person','people']] as const) {
    it(`${kind}: delete and undo restore relationships atomically at volume`, () => {
      const store = createProjectStore(regressionFixture(), { createId: () => 'unused', now: () => meta.createdAt });
      const before = store.getState();
      store.execute(softDelete(kind, `${kind}-2`));
      expect(store.getState()[collection][1].deletion.isDeleted).toBe(true);
      roundTrip(store.getState());
      expect(store.undo()).toBe(true);
      expect(store.getState()).toEqual(before);
      expect(store.redo()).toBe(true);
      expect(store.execute(restore(kind, `${kind}-2`))).toBe(true);
      roundTrip(store.getState());
    });
  }
  it('removes original task dependencies on deletion and restores them on undo', () => {
    const store = createProjectStore(regressionFixture(), { createId: () => 'unused', now: () => meta.createdAt });
    const before = store.getState();
    store.execute(softDelete('task', 'task-9'));
    expect(store.getState().dependencies.some(d => d.predecessor.id === 'task-9' || d.successor.id === 'task-9')).toBe(false);
    roundTrip(store.getState());
    store.undo(); expect(store.getState()).toEqual(before);
  });
  it('edits risk ratings and decision relationships without losing other records', () => {
    const store = createProjectStore(regressionFixture(), { createId: () => 'unused', now: () => meta.createdAt });
    expect(store.execute(editRisk('risk-2', { probability: 'High', impact: 'High', ownerId: 'person-30' }))).toBe(true);
    expect(store.getState().risks[1].riskLevel).toBe('High');
    expect(store.execute(editDecision('decision-2', { relatedRiskIds: ['risk-30'], ownerId: 'person-30', decisionDate: '2026-12-31' }))).toBe(true);
    expect(store.getState().decisions[1].relatedRiskIds).toEqual(['risk-30']);
    roundTrip(store.getState());
  });
});


it('round-trips the real Atlas software delivery demonstration file and its relationships',()=>{
 const result=deserializeProject(new Uint8Array(readFileSync('docs/media/Atlas-Software-Delivery.pmp')));expect(result.ok).toBe(true);if(!result.ok)return;const s=result.value.projectState;expect(s.project.name).toBe('Atlas Software Delivery');expect(s.project.metadata.showProgress).toBe(false);expect([s.streams.length,s.people.length,s.tasks.length,s.milestones.length,s.risks.length,s.decisions.length]).toEqual([4,5,8,9,2,2]);expect(s.streams.map(stream=>s.tasks.filter(t=>t.scope.kind==='stream'&&t.scope.streamId===stream.id).length)).toEqual([2,2,2,2]);expect(s.streams.map(stream=>s.milestones.filter(m=>m.scope.kind==='streams'&&m.scope.streamIds.includes(stream.id)).length)).toEqual([2,2,5,0]);expect(s.dependencies).toHaveLength(7);expect(s.risks.map(r=>[r.probability,r.impact])).toEqual([['Low','Medium'],['High','High']]);expect(s.risks.every(r=>r.actions.length===1)).toBe(true);expect(s.auditHistory!.events).toHaveLength(39);const bytes=serializeProject(s,{createdAt:result.value.manifest.createdAt,lastSavedAt:result.value.manifest.lastSavedAt,runtimeVersion:'1.5.0',configuration:result.value.configuration});expect(bytes.ok).toBe(true);if(bytes.ok){const again=deserializeProject(bytes.value);expect(again.ok).toBe(true);if(again.ok)expect(again.value.projectState).toEqual(s);}
});
