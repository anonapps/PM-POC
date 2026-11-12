import type { ProjectState } from "../../application";
import type { ProjectWarning } from "./warnings";

/** Only milestone CPM relationship warnings change their established routing. */
export function warningNavigation(state:ProjectState,warning:ProjectWarning) {
  if(warning.type!=="Critical path analysis" || warning.entityType!=="Milestone" || warning.dependencyIds===undefined && !warning.dependencyId && warning.destination!=="Dependencies")
    return {destination:warning.destination,entityId:warning.entityId,dependencyIds:[] as string[],fallback:undefined};
  const present=new Set(state.dependencies.map(dependency=>dependency.id));
  const ids=[...new Set([...(warning.dependencyIds??[]),...(warning.dependencyId?[warning.dependencyId]:[])])].filter(id=>present.has(id)).sort();
  return ids.length
    ? {destination:"Dependencies" as const,entityId:ids[0],dependencyIds:ids,fallback:undefined}
    : {destination:"Milestones" as const,entityId:warning.entityId,dependencyIds:ids,fallback:"No dependency can be identified. Open this milestone to review its relationships."};
}
