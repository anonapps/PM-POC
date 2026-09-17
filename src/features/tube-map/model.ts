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

export function buildTubeMap(state: ProjectState, startDate = new Date().toISOString().slice(0, 10)): TubeMapModel {
  const start = mondayOf(startDate);
  const startTime = parse(start).getTime();
  const endTime = startTime + 84 * day;
  const end = iso(new Date(endTime));
  const weeks = Array.from({ length: 12 }, (_, index) => { const date = iso(new Date(startTime + index * 7 * day)); return { date, label: `W${String(isoWeek(date)).padStart(2, "0")}` }; });
  const baseStreams = [{ id: "project", label: "Project-wide", lane: 0 }, ...state.streams.filter((stream) => !stream.deletion.isDeleted).map((stream, index) => ({ id: stream.id, label: stream.name, lane: index + 1 }))];
  const candidates = state.milestones.filter((milestone) => !milestone.deletion.isDeleted).flatMap((milestone) => {
    const stamp = parse(milestone.plannedDate).getTime();
    const boundary = stamp < startTime ? "before" as const : stamp >= endTime ? "after" as const : "inside" as const;
    const x = Math.max(0, Math.min(100, ((stamp - startTime) / (endTime - startTime)) * 100));
    const ids = milestone.scope.kind === "project" ? ["project"] : milestone.scope.streamIds;
    return ids.map((streamId) => ({ id: `${milestone.id}:${streamId}`, entityId: milestone.id, label: milestone.name, date: milestone.plannedDate, x, streamId, boundary }));
  });
  let top = 0;
  const streams: TubeStream[] = [];
  const stations: TubeStation[] = [];
  for (const stream of baseStreams) {
    const laneCandidates = candidates.filter((station) => station.streamId === stream.id).sort((left, right) => left.x - right.x || left.entityId.localeCompare(right.entityId));
    const levels = levelsFor(laneCandidates);
    const maxLevel = Math.max(0, ...levels);
    const height = 76 + maxLevel * 30;
    streams.push({ ...stream, top, height });
    laneCandidates.forEach((station, index) => stations.push({ ...station, lane: stream.lane, level: levels[index], y: top + 38 + levels[index] * 30 }));
    top += height;
  }
  const connections = state.dependencies.filter((dependency) => dependency.predecessor.kind === "milestone" && dependency.successor.kind === "milestone").flatMap((dependency) => {
    const sources = stations.filter((station) => station.entityId === dependency.predecessor.id && station.boundary === "inside");
    const targets = stations.filter((station) => station.entityId === dependency.successor.id && station.boundary === "inside");
    const pairs = sources.flatMap((source) => targets.map((target) => ({ source, target, score: Math.abs(source.lane - target.lane) * 100 + Math.abs(source.x - target.x) })));
    const selected = pairs.sort((left, right) => left.score - right.score || left.source.id.localeCompare(right.source.id) || left.target.id.localeCompare(right.target.id))[0];
    return selected ? [{ from: selected.source.entityId, to: selected.target.entityId, fromX: selected.source.x, fromY: selected.source.y, toX: selected.target.x, toY: selected.target.y }] : [];
  });
  return { start, end, weeks, streams, stations, connections, height: top };
}
