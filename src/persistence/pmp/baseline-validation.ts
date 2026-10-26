import { validScheduleDate } from "../../domain/baselines";
const object=(value:unknown):value is Record<string,unknown>=>!!value&&typeof value==="object"&&!Array.isArray(value);
const text=(v:unknown,max:number)=>typeof v==="string"&&v.trim().length>0&&v.length<=max;
const optionalDate=(v:unknown)=>v===null||validScheduleDate(v);
/** Historical references belong to the snapshot, never to today's entity collections. */
export function validBaselines(value:unknown,projectId:string):boolean {
  if(value===undefined)return true;
  if(!Array.isArray(value)||value.length>1000)return false;
  const baselineIds=new Set<string>();
  return value.every(b=>{
    if(!object(b)||!text(b.id,200)||baselineIds.has(b.id as string)||!text(b.name,200)||(b.description!==undefined&&(typeof b.description!=="string"||b.description.length>20000))||typeof b.createdAt!=="string"||!/^\d{4}-\d{2}-\d{2}T/.test(b.createdAt)||!Number.isFinite(Date.parse(b.createdAt))||!object(b.snapshot))return false;
    baselineIds.add(b.id as string);
    const s=b.snapshot;
    if(s.schemaVersion!==1||s.projectId!==projectId||!Array.isArray(s.streams)||s.streams.length>100000||!Array.isArray(s.items)||s.items.length>100000)return false;
    const streamIds=new Set<string>(),itemIds=new Set<string>();
    if(!s.streams.every(stream=>{if(!object(stream)||!text(stream.id,200)||streamIds.has(stream.id as string)||!text(stream.name,100000))return false;streamIds.add(stream.id as string);return true;}))return false;
    return s.items.every(item=>{
      if(!object(item)||!text(item.id,200)||itemIds.has(item.id as string)||!["task","milestone"].includes(item.kind as string)||!text(item.name,100000)||typeof item.humanId!=="string"||!new RegExp(`^${item.kind==="task"?"TASK":"MILESTONE"}-[0-9]{3,}$`).test(item.humanId)||!optionalDate(item.startDate)||!optionalDate(item.finishDate)||typeof item.projectWide!=="boolean"||!Array.isArray(item.streamIds)||new Set(item.streamIds).size!==item.streamIds.length||item.streamIds.some(id=>!streamIds.has(id)))return false;
      if(item.projectWide&&item.streamIds.length||item.kind==="task"&&!item.projectWide&&item.streamIds.length!==1)return false;
      if(item.kind==="milestone"&&item.startDate!==item.finishDate)return false;
      itemIds.add(item.id as string);return true;
    });
  });
}
