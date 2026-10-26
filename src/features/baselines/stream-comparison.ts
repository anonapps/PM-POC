import type {ScheduleComparison,ScheduleItem} from '../../domain/baselines';
type StreamNames=ReadonlyMap<string,string>;
const scopeNames=(item:ScheduleItem|null,names:StreamNames)=>!item?null:item.projectWide?'Project-wide':item.streamIds.map(id=>names.get(id)??id).join(', ')||'Unassigned';
/** Snapshot associations always use snapshot names, including removed entities. */
export function comparisonStreamLabels(row:ScheduleComparison,historical:StreamNames,current:StreamNames){
  return {baseline:scopeNames(row.baseline,historical),current:scopeNames(row.current,current)};
}
export function comparisonStreamOptions(historical:StreamNames,current:StreamNames){
  return [...new Set([...historical.keys(),...current.keys()])].map(id=>{
    const before=historical.get(id),after=current.get(id);
    return {id,name:before&&after&&before!==after?`${before} → ${after}`:after??before??id};
  });
}
