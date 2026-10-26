import type { Dependency } from "../domain";
import { dependencyEditError } from "../domain/dependency-analysis";
import type { ProjectCommand } from "./commands";
/** Edit in place; preserve the stable relationship ID and every unrelated link. */
export function editDependency(id:string,patch:Pick<Dependency,"predecessor"|"successor"|"type">):ProjectCommand {
 return {type:"edit-dependency",apply(state){
  const existing=state.dependencies.find(d=>d.id===id);if(!existing)return state;
  const candidate={...existing,...patch};if(dependencyEditError(state,candidate))return state;
  return {...state,dependencies:state.dependencies.map(d=>d.id===id?candidate:d)};
 }};
}
