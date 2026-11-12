import type { ProjectState } from '../../application';
export type RowFeedbackKind='delete'|'duplicate';
export const ROW_FEEDBACK_MS=600;
function collections(state:ProjectState){return [state.people,state.streams,state.tasks,state.milestones,state.risks,state.decisions,state.baselines??[],state.dependencies,...state.risks.map(risk=>risk.actions)] as readonly (readonly {id:string;deletion?:{isDeleted:boolean}}[])[];}
export function rowActionSucceeded(kind:RowFeedbackKind,id:string,before:ProjectState,after:ProjectState):boolean {
 const old=collections(before),next=collections(after),index=old.findIndex(items=>items.some(item=>item.id===id));if(index<0)return false;
 const source=old[index].find(item=>item.id===id)!;if(source.deletion?.isDeleted)return false;
 const current=next.flat().find(item=>item.id===id);
 if(kind==='delete')return !current||current.deletion?.isDeleted===true;
 return !!current&&(next[index]??[]).some(item=>!old[index].some(previous=>previous.id===item.id));
}
/** Resolve a separator by stable visible identities, never by a post-delete row index. */
export function separatorTarget(ids:readonly string[],available:ReadonlySet<string>,sourceId:string):{id:string;edge:'top'|'bottom'}|null {
 const index=ids.indexOf(sourceId);if(index<0)return null;
 const next=ids.slice(index+1).find(id=>available.has(id));if(next)return{id:next,edge:'top'};
 const previous=ids.slice(0,index).reverse().find(id=>available.has(id));return previous?{id:previous,edge:'bottom'}:null;
}
