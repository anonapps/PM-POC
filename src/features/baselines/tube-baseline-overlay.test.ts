import { describe, expect, it } from 'vitest';
import { captureSchedule, type ProjectBaseline } from '../../domain/baselines';
import { makeProjectState, streamFixture } from '../../domain/test-fixtures';
import type { Milestone } from '../../domain';
import { buildTubeMap } from '../tube-map/model';
import { buildTubeBaselineOverlay } from './tube-baseline-overlay';

const milestone = (id: string, date: string, streams: string[] = []): Milestone => ({ id, projectId: 'project-1', humanId: `MILESTONE-${id}`, name: `Gate ${id}`, plannedDate: date, status: 'Planned', ownerId: null, scope: streams.length ? { kind: 'streams', streamIds: streams } : { kind: 'project' }, relatedTaskIds: [], deletion: { isDeleted: false } });
const baseline = (state: ReturnType<typeof makeProjectState>): ProjectBaseline => ({ id: 'plan', name: 'Original plan', createdAt: '2026-10-26T12:00:00Z', snapshot: captureSchedule(state) });

describe('same-map historical milestone projection', () => {
  it('uses historical dates and every historical scope without moving live stations or mutating snapshots', () => {
    const original = makeProjectState({ streams: [streamFixture(), streamFixture({ id: 's2', name: 'Beta' })], milestones: [milestone('1', '2026-10-27'), milestone('2', '2026-10-28', ['stream-1', 's2'])] });
    const plan = baseline(original), saved = JSON.stringify(plan);
    const current = { ...original, milestones: original.milestones.map(item => ({ ...item, plannedDate: '2026-11-05' })) };
    const model = buildTubeMap(current, '2026-10-26'), before = JSON.stringify(model);
    const result = buildTubeBaselineOverlay(plan, current, model);
    expect(result.markers).toHaveLength(3);
    expect(result.markers.find(marker => marker.streamId === 'project')!.x).toBeCloseTo(100 / 84);
    expect(result.markers.filter(marker => marker.date === '2026-10-28').map(marker => marker.streamId)).toEqual(['stream-1', 's2']);
    expect(result.markers[0].descriptions[0]).toContain('baseline 27/10/2026, current 05/11/2026');
    expect(JSON.stringify(plan)).toBe(saved); expect(JSON.stringify(model)).toBe(before);
    expect(result.extraStreams).toHaveLength(0);
  });

  it('keeps removed milestones and deleted/hidden historical streams in baseline-only lanes', () => {
    const original = makeProjectState({ streams: [streamFixture({ name: 'Historical stream' })], milestones: [milestone('1', '2026-10-27', ['stream-1'])] });
    const plan = baseline(original), current = { ...original, milestones: [], streams: [] };
    const model = buildTubeMap(current, '2026-10-26');
    const result = buildTubeBaselineOverlay(plan, current, model);
    expect(result.extraStreams).toMatchObject([{ label: 'Historical stream (baseline only)', top: model.height }]);
    expect(result.markers[0].descriptions[0]).toContain('removed or undated');
    expect(result.markers[0].y).toBeGreaterThan(model.height);
    expect(result.height).toBe(model.height + 88);
  });

  it('groups coincident milestones without losing their individual names and current dates', () => {
    const original = makeProjectState({ milestones: [milestone('1', '2026-10-27'), milestone('2', '2026-10-27')] });
    const result = buildTubeBaselineOverlay(baseline(original), original, buildTubeMap(original, '2026-10-26'));
    expect(result.markers).toHaveLength(1);
    expect(result.markers[0].descriptions).toHaveLength(2);
    expect(result.markers[0].descriptions.join('; ')).toContain('Gate 1');
    expect(result.markers[0].descriptions.join('; ')).toContain('Gate 2');
  });

  it('uses inclusive start/exclusive end and the sorted live stream IDs, including renamed streams', () => {
    const original = makeProjectState({ streams: [streamFixture({ name: 'Old name' })], milestones: [milestone('1', '2026-10-25'), milestone('2', '2026-10-26', ['stream-1']), milestone('3', '2027-01-18')] });
    const current = { ...original, streams: [streamFixture({ name: 'Renamed stream' })] };
    const model = buildTubeMap(current, '2026-10-26', 'desc');
    const result = buildTubeBaselineOverlay(baseline(original), current, model);
    expect(result.markers).toHaveLength(1); expect(result.markers[0].x).toBe(0);
    expect(result.markers[0].y).toBe(model.streams.find(stream => stream.id === 'stream-1')!.top + 12);
    expect(result.markers[0].descriptions[0]).toContain('Old name');
    expect(result.extraStreams).toHaveLength(0);
    const filtered = buildTubeMap(current, '2026-10-26', 'original', false, 'No match');
    expect(buildTubeBaselineOverlay(baseline(original), current, filtered).extraStreams[0].label).toBe('Old name (baseline only)');
  });
});
