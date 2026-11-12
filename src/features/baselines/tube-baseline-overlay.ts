import type { ProjectState } from '../../application';
import { compareSchedule, dateVariance, validScheduleDate, type ProjectBaseline } from '../../domain/baselines';
import { timelineDisplayDate } from '../shared/timeline-date';
import type { TubeMapModel, TubeStream } from '../tube-map/model';

/** Nearest free horizontal target centre, in rendered pixels. Keep the date anchor
 * when possible; never move or resize a live station to make room for history. */
export function historicalMarkerCentre(anchor: number, halfWidth: number, obstacles: readonly { left: number; right: number }[], left: number, right: number) {
  const candidates = [anchor, left + halfWidth, right - halfWidth, ...obstacles.flatMap(box => [box.left - halfWidth - 2, box.right + halfWidth + 2])];
  return candidates.filter(x => x - halfWidth >= left && x + halfWidth <= right && obstacles.every(box => x + halfWidth <= box.left - 2 || x - halfWidth >= box.right + 2))
    .sort((a, b) => Math.abs(a - anchor) - Math.abs(b - anchor))[0] ?? anchor;
}

export interface TubeBaselineMarker {
  streamId: string;
  date: string;
  x: number;
  y: number;
  descriptions: string[];
  milestoneIds: string[];
}

/** Read-only historical projection; never changes live lane/station coordinates. */
export function buildTubeBaselineOverlay(baseline: ProjectBaseline, state: ProjectState, model: TubeMapModel, visible?: ReadonlyMap<string, ReadonlySet<string>>) {
  const rows = compareSchedule(baseline.snapshot, state).filter(row => row.baseline?.kind === 'milestone' && validScheduleDate(row.baseline.finishDate) && row.baseline.finishDate >= model.start && row.baseline.finishDate < model.end);
  const lanes = new Map(model.streams.map(stream => [stream.id, stream]));
  const historicalStreams = [{ id: 'project', name: 'Project-wide' }, ...baseline.snapshot.streams];
  const extraStreams: TubeStream[] = [];
  for (const stream of historicalStreams) {
    if ((visible && !visible.has(stream.id)) || lanes.has(stream.id) || !rows.some(row => row.baseline!.projectWide ? stream.id === 'project' : row.baseline!.streamIds.includes(stream.id))) continue;
    const lane = { id: stream.id, label: `${stream.name} (baseline only)`, lane: model.streams.length + extraStreams.length, top: model.height + extraStreams.length * 88, height: 88, contentHeight: 88 };
    lanes.set(stream.id, lane);
    extraStreams.push(lane);
  }
  const grouped = new Map<string, TubeBaselineMarker>();
  for (const row of rows) {
    const item = row.baseline!;
    const date = item.finishDate!;
    for (const streamId of item.projectWide ? ['project'] : item.streamIds) {
      if (visible && !visible.get(streamId)?.has(item.id)) continue;
      const lane = lanes.get(streamId);
      if (!lane) continue;
      const key = `${streamId}:${date}`;
      let marker = grouped.get(key);
      if (!marker) {
        marker = { streamId, date, x: (dateVariance(model.start, date)! / dateVariance(model.start, model.end)!) * 100, y: lane.top + 12, descriptions: [], milestoneIds: [] };
        grouped.set(key, marker);
      }
      const historicalName = historicalStreams.find(stream => stream.id === streamId)?.name ?? lane.label;
      marker.milestoneIds.push(item.id);
      marker.descriptions.push(`${item.humanId} · ${item.name} · ${historicalName}: baseline ${timelineDisplayDate(date)}, current ${row.current?.finishDate ? timelineDisplayDate(row.current.finishDate) : 'removed or undated'}`);
    }
  }
  return { markers: [...grouped.values()], extraStreams, height: model.height + extraStreams.length * 88 };
}
