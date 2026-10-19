import type { ProjectState } from "../../application";
const day = 86_400_000;
const parse = (date: string) => new Date(`${date}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
export function mondayOf(date: string) { const value = parse(date); const weekday = value.getUTCDay() || 7; value.setUTCDate(value.getUTCDate() - weekday + 1); return iso(value); }
export function isoWeek(date: string) { const value = parse(date); value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7)); const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1)); return Math.ceil((((value.getTime() - yearStart.getTime()) / day) + 1) / 7); }
export interface TubeStream { id: string; label: string; lane: number; top: number; height: number }
export interface TubeStation { id: string; entityId: string; label: string; date: string; x: number; lane: number; y: number; level: number; boundary: "before" | "inside" | "after" }
export interface TubeConnection { from: string; to: string; fromX: number; fromY: number; toX: number; toY: number }
export interface TubeMapModel { start: string; end: string; weeks: readonly { date: string; label: string }[]; streams: readonly TubeStream[]; stations: readonly TubeStation[]; connections: readonly TubeConnection[]; height: number }

function levelsFor(stations: readonly { x: number; label: string }[]) {
  const occupied: number[] = [];
  return stations.map((station) => {
    const halfWidth = Math.min(12, Math.max(3, station.label.length * 0.35));
    let level = 0;
    while (occupied[level] !== undefined && station.x - halfWidth < occupied[level]) level += 1;
    occupied[level] = station.x + halfWidth;
    return level;
  });
}

export function buildTubeMap(state: ProjectState, startDate = new Date().toISOString().slice(0, 10), streamSort: "original" | "asc" | "desc" = "original"): TubeMapModel {
  const start = mondayOf(startDate);
  const startTime = parse(start).getTime();
  const endTime = startTime + 84 * day;
  const end = iso(new Date(endTime));
  const weeks = Array.from({ length: 12 }, (_, index) => { const date = iso(new Date(startTime + index * 7 * day)); return { date, label: `W${String(isoWeek(date)).padStart(2, "0")}` }; });
  const activeStreams = state.streams.filter(stream => !stream.deletion.isDeleted); const orderedStreams = streamSort === "original" ? activeStreams : [...activeStreams].sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:"base"})*(streamSort==="asc"?1:-1));
  const baseStreams = [{ id: "project", label: "Project-wide", lane: 0 }, ...orderedStreams.map((stream, index) => ({ id: stream.id, label: stream.name, lane: index + 1 }))];
  const candidates = state.milestones.filter((milestone) => !milestone.deletion.isDeleted).flatMap((milestone) => {
    const stamp = parse(milestone.plannedDate).getTime();
    const boundary = stamp < startTime ? "before" as const : stamp >= endTime ? "after" as const : "inside" as const;
    const x = Math.max(0, Math.min(100, ((stamp - startTime) / (endTime - startTime)) * 100));
    const ids = milestone.scope.kind === "project" ? ["project"] : milestone.scope.streamIds;
    return ids.map((streamId) => ({ id: `${milestone.id}:${streamId}`, entityId: milestone.id, label: milestone.name, date: milestone.plannedDate, x, streamId, boundary }));
  });
  const candidatesByStream = new Map<string, typeof candidates>();
  for (const station of candidates) {
    const lane = candidatesByStream.get(station.streamId) ?? [];
    lane.push(station);
    candidatesByStream.set(station.streamId, lane);
  }
  let top = 0;
  const streams: TubeStream[] = [];
  const stations: TubeStation[] = [];
  for (const stream of baseStreams) {
    const laneCandidates = [...(candidatesByStream.get(stream.id) ?? [])].sort((left, right) => left.x - right.x || left.entityId.localeCompare(right.entityId));
    const visibleCandidates = laneCandidates.filter(station => station.boundary === "inside");
    const visibleLevels = levelsFor(visibleCandidates);
    const levelsById = new Map(visibleCandidates.map((station, index) => [station.id, visibleLevels[index]]));
    const levels = laneCandidates.map(station => levelsById.get(station.id) ?? 0);
    const maxLevel = Math.max(0, ...visibleLevels);
    const height = 76 + maxLevel * 30;
    streams.push({ ...stream, top, height });
    laneCandidates.forEach((station, index) => stations.push({ ...station, lane: stream.lane, level: levels[index], y: top + 38 + levels[index] * 30 }));
    top += height;
  }
  const visibleMilestoneIds = new Set(state.milestones.filter(milestone => !milestone.deletion.isDeleted).map(milestone => milestone.id));
  const stationsByMilestone = new Map<string, TubeStation[]>();
  for (const station of stations) {
    if (station.boundary !== "inside") continue;
    const occurrences = stationsByMilestone.get(station.entityId) ?? [];
    occurrences.push(station);
    stationsByMilestone.set(station.entityId, occurrences);
  }
  const connections = state.dependencies.filter((dependency) => dependency.predecessor.kind === "milestone" && dependency.successor.kind === "milestone" && visibleMilestoneIds.has(dependency.predecessor.id) && visibleMilestoneIds.has(dependency.successor.id)).flatMap((dependency) => {
    const sources = stationsByMilestone.get(dependency.predecessor.id) ?? [];
    const targets = stationsByMilestone.get(dependency.successor.id) ?? [];
    let selected: { source: TubeStation; target: TubeStation; score: number } | undefined;
    for (const source of sources) for (const target of targets) {
      const score = Math.abs(source.lane - target.lane) * 100 + Math.abs(source.x - target.x);
      if (!selected || score < selected.score || (score === selected.score && (source.id.localeCompare(selected.source.id) < 0 || (source.id === selected.source.id && target.id.localeCompare(selected.target.id) < 0)))) selected = { source, target, score };
    }
    return selected ? [{ from: selected.source.entityId, to: selected.target.entityId, fromX: selected.source.x, fromY: selected.source.y, toX: selected.target.x, toY: selected.target.y }] : [];
  });
  return { start, end, weeks, streams, stations, connections, height: top };
}
