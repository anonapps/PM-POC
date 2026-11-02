import type { ProjectState } from "../../application";
import { compareSchedule, dateVariance, validScheduleDate, type ProjectBaseline, type ScheduleComparison } from "../../domain/baselines";
import type { MilestoneStatus } from "../../domain";
import { levelsFor } from "./model";

export interface HistoricalStation { row: ScheduleComparison; x: number; y: number }
export interface HistoricalLane { id: string; label: string; height: number; stations: HistoricalStation[] }

/** Snapshot dates and scopes are authoritative; current status is only a live filter. */
export function baselineTubeLanes(baseline: ProjectBaseline, state: ProjectState, start: string, end: string, showNames: boolean, query = "", statuses: readonly MilestoneStatus[] = [], sort: "original"|"asc"|"desc" = "original"): HistoricalLane[] {
  const needle = query.trim().toLocaleLowerCase();
  const rows = compareSchedule(baseline.snapshot, state).filter(row => row.baseline?.kind === "milestone" && validScheduleDate(row.baseline.finishDate) && row.baseline.finishDate >= start && row.baseline.finishDate < end);
  const streams = [...baseline.snapshot.streams];
  if (sort !== "original") streams.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:"base"})*(sort==="asc"?1:-1));
  return [{id:"project",name:"Project-wide"},...streams].flatMap(stream=>{
    const items = rows.filter(row=>{
      const item=row.baseline!,current=state.milestones.find(m=>m.id===item.id&&!m.deletion.isDeleted);
      return (item.projectWide?stream.id==="project":item.streamIds.includes(stream.id)) && (!needle || `${stream.name} ${item.name}`.toLocaleLowerCase().includes(needle)) && (!statuses.length || !!current && statuses.includes(current.status));
    }).map(row=>({row,x:(dateVariance(start,row.baseline!.finishDate)??0)/(dateVariance(start,end)??1)*100})).sort((a,b)=>a.x-b.x||a.row.key.localeCompare(b.row.key));
    if(!items.length)return [];
    const levels=levelsFor(items.map(item=>({x:item.x,label:item.row.baseline!.name})),showNames),step=showNames?48:28;
    return [{id:stream.id,label:stream.name,height:Math.max(showNames?48:28,(Math.max(...levels)+1)*step),stations:items.map((item,index)=>({...item,y:14+levels[index]*step}))}];
  });
}
