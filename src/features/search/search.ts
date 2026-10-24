import { matchesOption } from "../shared/option-matching";
import type { ProjectState } from "../../application";
import type { ModuleName } from "../shell/shell";
export type SearchEntityType="Stream"|"Person"|"Task"|"Milestone"|"Risk"|"Decision";
export interface SearchResult{readonly entityType:SearchEntityType;readonly module:ModuleName;readonly entityId:string;readonly humanId:string;readonly label:string;readonly isDeleted:boolean}
const registrations=[
 {type:"Stream",module:"Streams",collection:"streams"},{type:"Person",module:"People",collection:"people"},{type:"Task",module:"Tasks",collection:"tasks"},{type:"Milestone",module:"Milestones",collection:"milestones"},{type:"Risk",module:"Risk Log",collection:"risks"},{type:"Decision",module:"Decision Log",collection:"decisions"},
] as const;
type SearchEntity=ProjectState[(typeof registrations)[number]["collection"]][number];
/** Shared projection keeps module and global search in agreement, including hidden context. */
export function matchesEntitySearch(state:ProjectState,entity:SearchEntity,query:string):boolean {
  if(!query.trim())return true;
  const fields=Object.entries(entity).filter(([key,value])=>typeof value==="string"&&key!=="projectId"&&key!=="id").map(([,value])=>String(value));
  const related=(collection:readonly {id:string;humanId:string;name?:string;title?:string;deletion?:{isDeleted:boolean}}[],ids:readonly string[])=>{
    for(const id of ids){const target=collection.find(item=>item.id===id);if(target&&!target.deletion?.isDeleted)fields.push(target.humanId,target.name??target.title??"");}
  };
  if("ownerId" in entity&&entity.ownerId)related(state.people,[entity.ownerId]);
  if("scope" in entity){const scope=entity.scope;if(scope.kind==="project")fields.push("Project-wide");else related(state.streams,scope.kind==="stream"?[scope.streamId]:scope.streamIds);}
  if("projectWide" in entity&&entity.projectWide)fields.push("Project-wide");
  if("relatedStreamIds" in entity)related(state.streams,entity.relatedStreamIds);
  if("relatedTaskIds" in entity)related(state.tasks,entity.relatedTaskIds);
  if("relatedMilestoneIds" in entity)related(state.milestones,entity.relatedMilestoneIds);
  if("relatedRiskIds" in entity)related(state.risks,entity.relatedRiskIds);
  if("milestoneId" in entity&&entity.milestoneId)related(state.milestones,[entity.milestoneId]);
  if("parentTaskId" in entity&&entity.parentTaskId)related(state.tasks,[entity.parentTaskId]);
  if("actions" in entity)for(const action of entity.actions)fields.push(action.description,action.status,action.dueDate??"");
  for(const dependency of state.dependencies){
    const endpoint=dependency.successor.id===entity.id?dependency.predecessor:dependency.predecessor.id===entity.id?dependency.successor:undefined;
    if(endpoint)related(endpoint.kind==="task"?state.tasks:state.milestones,[endpoint.id]);
  }
  return matchesOption({label:fields.join(" ")},query);
}
export function searchProject(state:ProjectState,query:string,includeDeleted=false):SearchResult[]{
  if(!query.trim())return [];
  const results:SearchResult[]=[];
  for(const registration of registrations)for(const entity of state[registration.collection]){
    if(entity.deletion.isDeleted&&!includeDeleted)continue;
    if(!matchesEntitySearch(state,entity,query))continue;
    results.push({entityType:registration.type,module:registration.module,entityId:entity.id,humanId:entity.humanId,label:"name" in entity?entity.name:entity.title,isDeleted:entity.deletion.isDeleted});
  }
  return results.sort((a,b)=>registrations.findIndex(x=>x.type===a.entityType)-registrations.findIndex(x=>x.type===b.entityType)||a.humanId.localeCompare(b.humanId)||a.label.localeCompare(b.label));
}
