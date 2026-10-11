import { describe, expect, it } from 'vitest';
import { regressionFixture, REGRESSION_TODAY } from './regression-fixture';
import { serializeProject, deserializeProject } from '../persistence/pmp/codec';
import { createProjectStore } from '../application/store';
import { duplicate, softDelete, restore } from '../application/commands';
import { editRisk, isRiskActionOverdue } from '../features/risks/commands';
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
    for (const key of ['streams','tasks'] as const) expect(pairs(state[key], e => e.status, e => !!e.ownerId)).toBe(10);
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
  it('edits risk ratings and decision relationships without losing other records', () => {
    const store = createProjectStore(regressionFixture(), { createId: () => 'unused', now: () => meta.createdAt });
    expect(store.execute(editRisk('risk-2', { probability: 'High', impact: 'High', ownerId: 'person-30' }))).toBe(true);
    expect(store.getState().risks[1].riskLevel).toBe('High');
    expect(store.execute(editDecision('decision-2', { relatedRiskIds: ['risk-30'], ownerId: 'person-30', decisionDate: '2026-12-31' }))).toBe(true);
    expect(store.getState().decisions[1].relatedRiskIds).toEqual(['risk-30']);
    roundTrip(store.getState());
  });
});
