import { captureSchedule } from "../domain/baselines";
import type { ProjectCommand } from "./commands";
export function createBaseline(name:string,description?:string):ProjectCommand {
  return {type:"create-baseline",apply(state,context){
    if(!name.trim()||name.trim().length>200||(description?.length??0)>20000)return state;
    const id=context.createId();
    if((state.baselines??[]).some(b=>b.id===id))return state;
    return {...state,baselines:[...(state.baselines??[]),{id,name:name.trim(),...(description?.trim()?{description:description.trim()}:{}),createdAt:context.now(),snapshot:captureSchedule(state)}]};
  }};
}
export function renameBaseline(id:string,name:string,description?:string):ProjectCommand {
  return {type:"rename-baseline",apply(state){
    if(!name.trim()||name.trim().length>200||(description?.length??0)>20000||!state.baselines?.some(b=>b.id===id))return state;
    return {...state,baselines:state.baselines.map(b=>b.id===id?{...b,name:name.trim(),description:description?.trim()||undefined}:b)};
  }};
}
export function deleteBaseline(id:string):ProjectCommand {
  return {type:"delete-baseline",apply(state){return state.baselines?.some(b=>b.id===id)?{...state,baselines:state.baselines.filter(b=>b.id!==id)}:state;}};
}
