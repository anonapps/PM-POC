import type {ScheduleComparison} from '../../domain/baselines';
import {comparisonStreamLabels} from './stream-comparison';
export type ComparisonSortKey='name'|'status'|'streams'|'baselineStart'|'currentStart'|'start'|'baselineFinish'|'currentFinish'|'finish';
export function comparisonSortValue(row:ScheduleComparison,key:ComparisonSortKey,historical:ReadonlyMap<string,string>,current:ReadonlyMap<string,string>):string|number|null{
 const item=row.current??row.baseline!;
 switch(key){
  case 'name':return `${item.humanId} · ${item.name}`;
  case 'status':return row.status;
  case 'streams':{const labels=comparisonStreamLabels(row,historical,current);return labels.baseline&&labels.current&&labels.baseline!==labels.current?`Baseline: ${labels.baseline} · Current: ${labels.current}`:labels.current??labels.baseline??'';}
  case 'baselineStart':return row.baseline?.startDate??null;
  case 'currentStart':return row.current?.startDate??null;
  case 'start':return row.startVariance;
  case 'baselineFinish':return row.baseline?.finishDate??null;
  case 'currentFinish':return row.current?.finishDate??null;
  case 'finish':return row.finishVariance;
 }
}
