import { captureSchedule, type ProjectBaseline, type ScheduleSnapshot, type ScheduleSource } from '../../domain/baselines';

/** Compare the captured Tube Map content, independent of filters, paging and task-only edits. */
export function hasTubeComparisonDifference(baseline: ProjectBaseline | null, state: ScheduleSource): boolean {
  if (!baseline) return false;
  const projection = (snapshot: ScheduleSnapshot) => JSON.stringify({
    streams: snapshot.streams.map(stream => [stream.id, stream.name]).sort((a, b) => a[0].localeCompare(b[0])),
    milestones: snapshot.items.filter(item => item.kind === 'milestone').map(item => ({
      id: item.id, name: item.name, date: item.finishDate, projectWide: item.projectWide,
      streams: [...item.streamIds].sort(),
    })).sort((a, b) => a.id.localeCompare(b.id)),
  });
  return projection(baseline.snapshot) !== projection(captureSchedule(state));
}
