import type { ProjectCommand, ProjectState } from "../../application";
import { wouldCreateDependencyCycle, type DependencyEndpoint } from "../../domain";

export function milestoneDependencyIssues(state: ProjectState, milestoneId: string): string[] {
  const milestone = state.milestones.find(item => item.id === milestoneId);
  if (!milestone || milestone.deletion.isDeleted) return [];
  return state.dependencies.filter(dependency => dependency.successor.kind === "milestone" && dependency.successor.id === milestoneId).flatMap(dependency => {
    const predecessor = dependency.predecessor.kind === "task"
      ? state.tasks.find(item => item.id === dependency.predecessor.id)
      : state.milestones.find(item => item.id === dependency.predecessor.id);
    if (!predecessor || predecessor.deletion.isDeleted) return ["Dependency references a deleted item"];
    const date = "plannedDate" in predecessor ? predecessor.plannedDate : predecessor.endDate;
    const label = "humanId" in predecessor ? predecessor.humanId : predecessor.id;
    const issues: string[] = [];
    if (!date) issues.push(`Dependency not scheduled: ${label}`);
    else if (milestone.plannedDate && milestone.plannedDate < date) issues.push(`Scheduling conflict: ${label} finishes ${date}`);
    const complete = "status" in predecessor && (predecessor.status === "Complete" || predecessor.status === "Completed");
    if (!complete && milestone.status === "Complete") issues.push(`Incomplete predecessor: ${label}`);
    return issues;
  });
}
export function canAddMilestoneDependency(state: ProjectState, predecessor: DependencyEndpoint, milestoneId: string): boolean {
  const source = predecessor.kind === "task" ? state.tasks.find(item => item.id === predecessor.id) : state.milestones.find(item => item.id === predecessor.id);
  const target = state.milestones.find(item => item.id === milestoneId);
  if (!source || source.deletion.isDeleted || !target || target.deletion.isDeleted) return false;
  if (state.dependencies.some(item => item.predecessor.kind === predecessor.kind && item.predecessor.id === predecessor.id && item.successor.kind === "milestone" && item.successor.id === milestoneId)) return false;
  return !wouldCreateDependencyCycle(state.dependencies, { id: "candidate", projectId: state.project.id, predecessor, successor: {kind:"milestone",id:milestoneId}, type: "Finish-to-Start" });
}
export function addMilestoneDependency(predecessor: DependencyEndpoint, milestoneId: string): ProjectCommand {
  return {type:"add-milestone-dependency",apply(state,context) {
    if (!canAddMilestoneDependency(state,predecessor,milestoneId)) return state;
    return {...state,dependencies:[...state.dependencies,{id:context.createId(),projectId:state.project.id,predecessor,successor:{kind:"milestone",id:milestoneId},type:"Finish-to-Start"}]};
  }};
}
export function removeMilestoneDependency(predecessor: DependencyEndpoint, milestoneId: string): ProjectCommand {
  return {type:"remove-milestone-dependency",apply(state) {
    return {...state,dependencies:state.dependencies.filter(item=>!(item.predecessor.kind===predecessor.kind&&item.predecessor.id===predecessor.id&&item.successor.kind==="milestone"&&item.successor.id===milestoneId))};
  }};
}
