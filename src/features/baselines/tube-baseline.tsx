import type { ProjectBaseline } from "../../domain/baselines";
import { compareSchedule,dateVariance } from "../../domain/baselines";
import type { ProjectState } from "../../application";
/** Separate historical lanes preserve every live station, caption and click target. */
export function TubeBaselineStrip({baseline,state,start,end}:{baseline:ProjectBaseline;state:ProjectState;start:string;end:string}) {
 const rows=compareSchedule(baseline.snapshot,state).filter(row=>row.baseline?.kind==='milestone');
 const streams=[{id:'project',name:'Project-wide'},...baseline.snapshot.streams];
 return <section className="tube-baseline-strip" aria-label="Baseline milestone indicators"><h2>Baseline milestones · {baseline.name}</h2>{streams.map(stream=>{
  const items=rows.filter(row=>{const item=row.baseline!;return (item.projectWide?stream.id==='project':item.streamIds.includes(stream.id))&&item.finishDate&&item.finishDate>=start&&item.finishDate<end;});
  if(!items.length)return null;
  return <div className="tube-baseline-lane" key={stream.id}><span>{stream.name}</span><div style={{height:`${Math.max(28,items.length*24)}px`}}>{items.map((row,index)=>{const item=row.baseline!,x=(dateVariance(start,item.finishDate)??0)/(dateVariance(start,end)??1)*100;return <span key={item.id} className={`tube-baseline-indicator ${x>50?"label-left":"label-right"}`} role="img" tabIndex={0} aria-label={`${item.name}: baseline ${item.finishDate}, current ${row.current?.finishDate??'removed or undated'}`} title={`${item.humanId} · ${item.name} · Baseline ${item.finishDate} · Current ${row.current?.finishDate??'removed or undated'}`} style={{left:`${x}%`,top:`${index*24}px`}}>◇</span>})}</div></div>;
 })}<p>Hollow diamonds show historical dates in this time window. Inspect an indicator for details; live stations remain above.</p></section>;
}
