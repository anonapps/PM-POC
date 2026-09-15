import type { ProjectState } from "../../application";
const day = 86_400_000;
const parse = (date: string) => new Date(`${date}T00:00:00Z`);
const iso = (date: Date) => date.toISOString().slice(0, 10);
export function mondayOf(date: string) { const value = parse(date); const weekday = value.getUTCDay() || 7; value.setUTCDate(value.getUTCDate() - weekday + 1); return iso(value); }
export function isoWeek(date: string) { const value = parse(date); value.setUTCDate(value.getUTCDate() + 4 - (value.getUTCDay() || 7)); const yearStart = new Date(Date.UTC(value.getUTCFullYear(), 0, 1)); return Math.ceil((((value.getTime() - yearStart.getTime()) / day) + 1) / 7); }
export interface TubeMapModel { start: string; end: string; weeks: readonly { date: string; label: string }[]; streams: readonly { id: string; label: string; lane: number }[]; stations: readonly { id: string; label: string; date: string; status: string; x: number; lanes: readonly number[]; boundary: "before" | "inside" | "after" }[]; connections: readonly { from: string; to: string }[] }
export function buildTubeMap(state: ProjectState, startDate = state.project.startDate): TubeMapModel {
  const start = mondayOf(startDate); const startTime = parse(start).getTime(); const endTime = startTime + 12 * 7 * day; const end = iso(new Date(endTime));
  const weeks = Array.from({ length: 12 }, (_, index) => { const date = iso(new Date(startTime + index * 7 * day)); return { date, label: `W${String(isoWeek(date)).padStart(2, "0")}` }; });
  const streams = state.streams.filter((stream) => !stream.deletion.isDeleted).map((stream, lane) => ({ id: stream.id, label: stream.name, lane })); const lanes = new Map(streams.map((stream) => [stream.id, stream.lane]));
  const stations = state.milestones.filter((milestone) => !milestone.deletion.isDeleted).map((milestone) => { const stamp = parse(milestone.plannedDate).getTime(); const boundary = stamp < startTime ? "before" as const : stamp > endTime ? "after" as const : "inside" as const; const x = Math.max(0, Math.min(100, ((stamp - startTime) / (endTime - startTime)) * 100)); const stationLanes = milestone.scope.kind === "project" ? streams.map((stream) => stream.lane) : milestone.scope.streamIds.flatMap((id) => lanes.has(id) ? [lanes.get(id)!] : []); return { id: milestone.id, label: milestone.name, date: milestone.plannedDate, status: milestone.status, x, lanes: stationLanes, boundary }; });
  const ids = new Set(stations.map((station) => station.id)); const connections = state.dependencies.filter((dependency) => dependency.predecessor.kind === "milestone" && dependency.successor.kind === "milestone" && ids.has(dependency.predecessor.id) && ids.has(dependency.successor.id)).map((dependency) => ({ from: dependency.predecessor.id, to: dependency.successor.id }));
  return { start, end, weeks, streams, stations, connections };
}
