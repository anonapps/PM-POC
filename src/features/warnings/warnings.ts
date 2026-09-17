import type { ProjectState } from "@/application";
import type { ModuleName } from "@/features/shell/shell";
export type WarningEntityType = "Stream" | "Task" | "Milestone";
export type WarningType = "Child outside parent schedule" | "Finish-to-Start violation" | "Deleted predecessor" | "Deleted milestone stream" | "Task in deleted stream";
export interface ProjectWarning { readonly id:string; readonly type:WarningType; readonly severity:"warning"; readonly entityType:WarningEntityType; readonly entityId:string; readonly humanId:string; readonly entityName:string; readonly description:string; readonly relatedDate?:string; readonly destination:ModuleName; readonly action?:{kind:"remove-dependency"|"remove-scope";referenceId:string;label:string} }
export function deriveProjectWarnings(state:ProjectState):ProjectWarning[]{
 const warnings:ProjectWarning[]=[]; const activeTasks=new Map(state.tasks.filter(t=>!t.deletion.isDeleted).map(t=>[t.id,t])); const allTasks=new Map(state.tasks.map(t=>[t.id,t])); const streams=new Map(state.streams.map(s=>[s.id,s]));
 const add=(w:Omit<ProjectWarning,"severity">)=>warnings.push({...w,severity:"warning"});
 for(const task of activeTasks.values()){
  const parent=task.parentTaskId?activeTasks.get(task.parentTaskId):undefined;
  if(parent?.startDate&&parent.endDate&&task.startDate&&task.endDate&&(task.startDate<parent.startDate||task.endDate>parent.endDate))add({id:`child-schedule:${task.id}`,type:"Child outside parent schedule",entityType:"Task",entityId:task.id,humanId:task.humanId,entityName:task.name,description:`Task schedule extends outside parent ${parent.humanId}.`,relatedDate:task.startDate,destination:"Tasks"});
  if(task.scope.kind==="stream"&&streams.get(task.scope.streamId)?.deletion.isDeleted)add({id:`deleted-task-stream:${task.id}`,type:"Task in deleted stream",entityType:"Task",entityId:task.id,humanId:task.humanId,entityName:task.name,description:"Active Task belongs to a deleted Stream.",destination:"Tasks"});
 }
 for(const dependency of state.dependencies.filter(d=>d.type==="Finish-to-Start"&&d.predecessor.kind==="task"&&d.successor.kind==="task")){
  const predecessor=allTasks.get(dependency.predecessor.id),dependent=activeTasks.get(dependency.successor.id); if(!predecessor||!dependent)continue;
  const deletedStream=predecessor.scope.kind==="stream"&&streams.get(predecessor.scope.streamId)?.deletion.isDeleted;
  if(predecessor.deletion.isDeleted&&!deletedStream)add({id:`deleted-dependency:${dependency.id}`,type:"Deleted predecessor",entityType:"Task",entityId:dependent.id,humanId:dependent.humanId,entityName:dependent.name,description:`Dependency references deleted ${predecessor.humanId}.`,destination:"Tasks",action:{kind:"remove-dependency",referenceId:predecessor.id,label:"Remove dependency"}});
  else if(!predecessor.deletion.isDeleted&&predecessor.startDate&&predecessor.endDate&&dependent.startDate&&dependent.endDate&&dependent.startDate<predecessor.endDate)add({id:`fs:${dependency.id}`,type:"Finish-to-Start violation",entityType:"Task",entityId:dependent.id,humanId:dependent.humanId,entityName:dependent.name,description:`Starts before predecessor ${predecessor.humanId} ends.`,relatedDate:dependent.startDate,destination:"Tasks"});
 }
 for(const milestone of state.milestones){if(milestone.deletion.isDeleted||milestone.scope.kind!=="streams")continue;for(const streamId of milestone.scope.streamIds){const stream=streams.get(streamId);if(stream?.deletion.isDeleted)add({id:`deleted-scope:${milestone.id}:${streamId}`,type:"Deleted milestone stream",entityType:"Milestone",entityId:milestone.id,humanId:milestone.humanId,entityName:milestone.name,description:`Milestone scope references deleted ${stream.humanId}.`,relatedDate:milestone.plannedDate,destination:"Milestones",action:{kind:"remove-scope",referenceId:streamId,label:"Remove from milestone scope"}})}}
 return warnings.sort((a,b)=>(a.relatedDate??"9999").localeCompare(b.relatedDate??"9999")||a.id.localeCompare(b.id));
}
