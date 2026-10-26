import {it,expect} from 'vitest';
import {captureSchedule,compareSchedule} from '../../domain/baselines';
import {makeProjectState,streamFixture,taskFixture} from '../../domain/test-fixtures';
import {comparisonStreamLabels,comparisonStreamOptions} from './stream-comparison';
it('keeps the historical name when a current stream is renamed or soft-deleted',()=>{
 const source=makeProjectState({streams:[streamFixture({name:'Original delivery'})],tasks:[taskFixture()]});
 const snapshot=captureSchedule(source),current={...source,streams:[{...source.streams[0],name:'Renamed delivery',deletion:{isDeleted:true,deletedAt:'2026-10-26'}}]};
 const before=new Map(snapshot.streams.map(s=>[s.id,s.name])),after=new Map(current.streams.map(s=>[s.id,s.name]));
 const matched=compareSchedule(snapshot,current)[0];expect(comparisonStreamLabels(matched,before,after)).toEqual({baseline:'Original delivery',current:'Renamed delivery'});
 const removed=compareSchedule(snapshot,{...current,tasks:[]})[0];expect(comparisonStreamLabels(removed,before,after)).toEqual({baseline:'Original delivery',current:null});
 expect(comparisonStreamOptions(before,after)).toEqual([{id:'stream-1',name:'Original delivery → Renamed delivery'}]);
});
it('represents reassignment, project-wide and unassigned associations independently',()=>{
 const source=makeProjectState({streams:[streamFixture()],tasks:[taskFixture()]});const snapshot=captureSchedule(source);
 const current={...source,tasks:[{...source.tasks[0],scope:{kind:'project' as const}}]};
 expect(comparisonStreamLabels(compareSchedule(snapshot,current)[0],new Map([['stream-1','Original']]),new Map())).toEqual({baseline:'Original',current:'Project-wide'});
});
