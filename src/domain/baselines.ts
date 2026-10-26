import type { ProjectEntities } from "./entities";

export interface ScheduleItem {
  readonly id:string;
  readonly kind:"task"|"milestone";
  readonly humanId:string;
  readonly name:string;
  readonly startDate:string|null;
  readonly finishDate:string|null;
  readonly streamIds:readonly string[];
  readonly projectWide:boolean;
}
export interface ScheduleSnapshot {
  readonly schemaVersion:1;
  readonly projectId:string;
  readonly streams:readonly {readonly id:string;readonly name:string}[];
  readonly items:readonly ScheduleItem[];
}
export interface ProjectBaseline {
  readonly id:string;
  readonly name:string;
  readonly description?:string;
  readonly createdAt:string;
  readonly snapshot:ScheduleSnapshot;
}
export type ScheduleSource=Pick<ProjectEntities,"project"|"streams"|"tasks"|"milestones">;

/** A detached historical value, with no references to mutable live collections. */
export function captureSchedule(state:ScheduleSource):ScheduleSnapshot {
  return freezeSnapshot({schemaVersion:1,projectId:state.project.id,
    streams:state.streams.map(s=>({id:s.id,name:s.name})),
    items:[...state.tasks.filter(t=>!t.deletion.isDeleted).map(t=>({id:t.id,kind:"task" as const,humanId:t.humanId,name:t.name,startDate:t.startDate??null,finishDate:t.endDate??null,streamIds:t.scope.kind==="stream"?[t.scope.streamId]:[],projectWide:t.scope.kind==="project"})),
      ...state.milestones.filter(m=>!m.deletion.isDeleted).map(m=>({id:m.id,kind:"milestone" as const,humanId:m.humanId,name:m.name,startDate:m.plannedDate||null,finishDate:m.plannedDate||null,streamIds:m.scope.kind==="streams"?[...m.scope.streamIds]:[],projectWide:m.scope.kind==="project"}))]});
}
export function freezeSnapshot(snapshot:ScheduleSnapshot):ScheduleSnapshot {
  for(const stream of snapshot.streams)Object.freeze(stream);
  for(const item of snapshot.items){Object.freeze(item.streamIds);Object.freeze(item);}
  Object.freeze(snapshot.streams);Object.freeze(snapshot.items);return Object.freeze(snapshot);
}
export function validScheduleDate(value:unknown):value is string {
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;
  const timestamp=Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(timestamp)&&new Date(timestamp).toISOString().slice(0,10)===value;
}
/** Calendar days, independent of daylight saving and browser timezone. */
export function dateVariance(baseline:string|null|undefined,current:string|null|undefined):number|null {
  return validScheduleDate(baseline)&&validScheduleDate(current)?Math.round((Date.parse(`${current}T00:00:00Z`)-Date.parse(`${baseline}T00:00:00Z`))/86400000):null;
}
export interface ScheduleComparison {
  readonly key:string;
  readonly baseline:ScheduleItem|null;
  readonly current:ScheduleItem|null;
  readonly status:"Added"|"Removed"|"Matched";
  readonly startVariance:number|null;
  readonly finishVariance:number|null;
}
export function compareSchedule(baseline:ScheduleSnapshot,state:ScheduleSource):readonly ScheduleComparison[] {
  const key=(item:ScheduleItem)=>`${item.kind}:${item.id}`;
  const historical=new Map(baseline.items.map(item=>[key(item),item]));
  const current=new Map(captureSchedule(state).items.map(item=>[key(item),item]));
  return [...new Set([...historical.keys(),...current.keys()])].map(id=>{
    const before=historical.get(id)??null,after=current.get(id)??null;
    return {key:id,baseline:before,current:after,status:!before?"Added":!after?"Removed":"Matched",startVariance:dateVariance(before?.startDate,after?.startDate),finishVariance:dateVariance(before?.finishDate,after?.finishDate)};
  });
}
