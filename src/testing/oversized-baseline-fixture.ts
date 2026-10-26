import {regressionFixture} from './regression-fixture';
import {captureSchedule} from '../domain/baselines';
/** Valid, bounded entities whose repeated UTF-8 history exceeds the PMP entry limit. */
export function oversizedBaselineFixture(){
  const original=regressionFixture();
  const state={...original,tasks:original.tasks.map((task,index)=>({...task,name:`Task ${index+1} ${'é'.repeat(2000)}`}))};
  const snapshot=captureSchedule(state);
  return {...state,baselines:Array.from({length:150},(_,index)=>({id:`large-baseline-${index}`,name:`Plan ${index}`,createdAt:'2026-10-26T12:00:00Z',snapshot}))};
}
