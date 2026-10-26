import { DEPENDENCY_TYPES,wouldCreateDependencyCycle,type Dependency,type DependencyEndpoint } from "./relationships";
import type { ScheduleSource } from "./baselines";
import { validScheduleDate } from "./baselines";
export type DependencySource=ScheduleSource&{readonly dependencies:readonly Dependency[]};
export function dependencyEntity(state:ScheduleSource,endpoint:DependencyEndpoint){return (endpoint.kind==="task"?state.tasks:state.milestones).find(e=>e.id===endpoint.id);}
export function dependencyScopes(state:ScheduleSource,endpoint:DependencyEndpoint):readonly string[]{
 const entity=dependencyEntity(state,endpoint);if(!entity)return [];
 return entity.scope.kind==="project"?["project"]:entity.scope.kind==="stream"?[entity.scope.streamId]:entity.scope.streamIds;
}
/** Project-wide is an explicit scope; two unassigned endpoints cannot establish a cross-stream link. */
export function isCrossStream(state:ScheduleSource,dependency:Dependency):boolean {
 const a=dependencyScopes(state,dependency.predecessor),b=dependencyScopes(state,dependency.successor);
 return a.length>0&&b.length>0&&!a.some(id=>b.includes(id));
}
const sameEndpoint=(a:DependencyEndpoint,b:DependencyEndpoint)=>a.kind===b.kind&&a.id===b.id;
export function dependencyEditError(state:DependencySource,candidate:Dependency):string|null {
 if(candidate.projectId!==state.project.id)return "Dependency belongs to a different project.";
 if(!DEPENDENCY_TYPES.includes(candidate.type))return "Unsupported dependency type.";
 for(const endpoint of [candidate.predecessor,candidate.successor]){
  if(!["task","milestone"].includes(endpoint.kind))return "Invalid dependency endpoint.";
  const entity=dependencyEntity(state,endpoint);if(!entity||entity.deletion.isDeleted)return "Choose active predecessor and successor items.";
 }
 const others=state.dependencies.filter(d=>d.id!==candidate.id);
 if(others.some(d=>sameEndpoint(d.predecessor,candidate.predecessor)&&sameEndpoint(d.successor,candidate.successor)&&d.type===candidate.type))return "This dependency already exists.";
 if(wouldCreateDependencyCycle(others,candidate))return "Self-references and circular dependencies are not allowed.";
 return null;
}
export function dependencyScheduleDates(state:DependencySource,dependency:Dependency) {
 const predecessor=dependencyEntity(state,dependency.predecessor),successor=dependencyEntity(state,dependency.successor);
 const start=(e:typeof predecessor)=>e&&("plannedDate" in e?e.plannedDate:e.startDate);
 const finish=(e:typeof predecessor)=>e&&("plannedDate" in e?e.plannedDate:e.endDate);
 return {before:dependency.type.startsWith("Finish")?finish(predecessor):start(predecessor),after:dependency.type.endsWith("Start")?start(successor):finish(successor)};
}
export function dependencyWarnings(state:DependencySource,dependency:Dependency):readonly string[] {
 const predecessor=dependencyEntity(state,dependency.predecessor),successor=dependencyEntity(state,dependency.successor);
 if(!predecessor||!successor)return ["Missing dependency reference"];
 if(predecessor.deletion.isDeleted||successor.deletion.isDeleted)return ["Dependency references a deleted item"];
 const consistency=dependencyEditError(state,dependency);if(consistency)return [consistency];
 const {before,after}=dependencyScheduleDates(state,dependency);
 if(!validScheduleDate(before)||!validScheduleDate(after))return ["Dependency dates are not scheduled"];
 return after<before?[`Schedule conflict: ${dependency.type} requires ${after} on or after ${before}. Dates are unchanged.`]:[];
}
