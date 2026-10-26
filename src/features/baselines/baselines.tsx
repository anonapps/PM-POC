"use client";
import { useState } from "react";
import {comparisonStreamLabels,comparisonStreamOptions} from "./stream-comparison";
import type { ProjectStore } from "../../application";
import { createBaseline, deleteBaseline, renameBaseline } from "../../application/baselines";
import { compareSchedule, type ProjectBaseline } from "../../domain/baselines";
import { useProjectState } from "../shell/use-project-state";
import { Dialog } from "../shell/shell";
import { timelineDisplayDate } from "../shared/timeline-date";
import { FitTable } from "../shared/fit-table";
import { PredictiveSelect } from "../shared/predictive-select";
import { ModuleSearch } from "../shared/module-search";
import { PageToolbar } from "../shared/page-toolbar";
import { BaselineSelector, useBaselineSelection } from "./selection";
import { sortRows, nextSort, type SortSelection } from "../shared/sorting";
const date=(value:string|null|undefined)=>value?timelineDisplayDate(value):"Undated";
export const varianceLabel=(value:number|null)=>value===null?"—":`${value>0?"+":""}${value}d`;
export function BaselinesModule({store}:{store:ProjectStore}) {
  const state=useProjectState(store),{baseline,select}=useBaselineSelection();
  const [query,setQuery]=useState(""),[status,setStatus]=useState("All"),[kind,setKind]=useState("All"),[stream,setStream]=useState("All");
  const [edit,setEdit]=useState<ProjectBaseline|"new"|null>(null),[remove,setRemove]=useState<ProjectBaseline|null>(null),[name,setName]=useState(""),[description,setDescription]=useState("");
  const [sort,setSort]=useState<SortSelection<"name"|"start"|"finish"|"status">|null>(null);
  const historicalNames=new Map((baseline?.snapshot.streams??[]).map(s=>[s.id,s.name])),currentNames=new Map(state.streams.map(s=>[s.id,s.name]));
  const streams=comparisonStreamOptions(historicalNames,currentNames);
  const rows=baseline?compareSchedule(baseline.snapshot,state).filter(row=>{
    const item=row.current??row.baseline!;
    const labels=comparisonStreamLabels(row,historicalNames,currentNames);
    return (status==="All"||row.status===status)&&(kind==="All"||item.kind===kind)&&(stream==="All"||[...(row.baseline?.streamIds??[]),...(row.current?.streamIds??[])].includes(stream))&&(JSON.stringify(row)+" "+(labels.baseline??"")+" "+(labels.current??"")).toLowerCase().includes(query.toLowerCase());
  }):[];
  const sorted=sortRows(rows,sort,(row,key)=>key==="name"?(row.current??row.baseline!).name:key==="start"?row.startVariance:key==="finish"?row.finishVariance:row.status);
  const open=(b:ProjectBaseline|"new")=>{setEdit(b);setName(b==="new"?"":b.name);setDescription(b==="new"?"":b.description??"");};
  return <section className="panel baselines-panel"><PageToolbar><h1 className="module-page-title">Baselines</h1><ModuleSearch title="baselines" placeholder="Search schedule comparison" value={query} onChange={setQuery} activeFilters={status!=="All"||kind!=="All"||stream!=="All"} onClearFilters={()=>{setStatus("All");setKind("All");setStream("All");}}><label>Comparison status <select value={status} onChange={e=>setStatus(e.target.value)}>{["All","Matched","Added","Removed"].map(s=><option key={s}>{s}</option>)}</select></label><label>Entity <select value={kind} onChange={e=>setKind(e.target.value)}>{["All","task","milestone"].map(s=><option key={s}>{s}</option>)}</select></label><label>Stream <PredictiveSelect label="Comparison stream" value={stream} onChange={setStream} options={[{id:"All",name:"All"},...streams]}/></label></ModuleSearch><button type="button" onClick={()=>open("new")}>Create baseline</button></PageToolbar>
    <div className="baseline-controls"><BaselineSelector store={store}/><p>Positive variance means later. — means a date is unavailable. Snapshots preserve the schedule at creation.</p></div>
    <ul className="baseline-list">{(state.baselines??[]).map(b=><li key={b.id}><button type="button" className="secondary" title={b.name} aria-pressed={baseline?.id===b.id} onClick={()=>select(b.id)}>{b.name}</button><time dateTime={b.createdAt}>{new Date(b.createdAt).toLocaleString()}</time>{b.description&&<span title={b.description}>{b.description}</span>}<button type="button" className="secondary" aria-label={`Rename ${b.name}`} onClick={()=>open(b)}>Rename</button><button type="button" className="danger" aria-label={`Delete ${b.name}`} onClick={()=>setRemove(b)}>Delete</button></li>)}</ul>
    {!baseline?<p>Create a named baseline to compare this project’s schedule.</p>:<><h2>Schedule comparison · {baseline.name}</h2><FitTable className="comparison-table"><thead><tr>{([['name','Entity'],['status','Status']] as const).map(([key,label])=><th key={key}><button type="button" className="sort-heading" onClick={()=>setSort(s=>nextSort(s,key))}>{label}</button></th>)}<th>Streams</th><th>Baseline start</th><th>Current start</th><th><button type="button" className="sort-heading" onClick={()=>setSort(s=>nextSort(s,'start'))}>Start variance</button></th><th>Baseline finish</th><th>Current finish</th><th><button type="button" className="sort-heading" onClick={()=>setSort(s=>nextSort(s,'finish'))}>Finish variance</button></th></tr></thead><tbody>{sorted.map(row=>{const item=row.current??row.baseline!,labels=comparisonStreamLabels(row,historicalNames,currentNames);return <tr key={row.key}><td title={`${item.humanId} · ${item.name} · ${item.kind}`}><span className="comparison-entity">{item.humanId} · {item.name}</span><small className="comparison-kind">{item.kind}</small></td><td>{row.status}</td><td title={labels.baseline&&labels.current&&labels.baseline!==labels.current?`Baseline: ${labels.baseline} · Current: ${labels.current}`:labels.current??labels.baseline??undefined}>{labels.baseline&&labels.current&&labels.baseline!==labels.current?<><span>Baseline: {labels.baseline}</span> · <span>Current: {labels.current}</span></>:labels.current??labels.baseline}</td><td>{date(row.baseline?.startDate)}</td><td>{date(row.current?.startDate)}</td><td data-variance={row.startVariance===null?undefined:row.startVariance>0?"later":row.startVariance<0?"earlier":"same"}>{varianceLabel(row.startVariance)}</td><td>{date(row.baseline?.finishDate)}</td><td>{date(row.current?.finishDate)}</td><td data-variance={row.finishVariance===null?undefined:row.finishVariance>0?"later":row.finishVariance<0?"earlier":"same"}>{varianceLabel(row.finishVariance)}</td></tr>})}</tbody></FitTable>{!sorted.length&&<p>No matching entities.</p>}</>}
    {edit&&<Dialog title={edit==="new"?"Create baseline":"Rename baseline"} onClose={()=>setEdit(null)}><form onSubmit={e=>{e.preventDefault();if(!name.trim())return;store.execute(edit==="new"?createBaseline(name,description):renameBaseline(edit.id,name,description));if(edit==="new"){const created=store.getState().baselines?.at(-1);if(created)select(created.id);}setEdit(null);}} className="form-grid"><label>Name *<input autoFocus required maxLength={200} value={name} onChange={e=>setName(e.target.value)}/></label><label>Description<textarea maxLength={20000} value={description} onChange={e=>setDescription(e.target.value)}/></label><div className="form-actions"><button type="submit">{edit==="new"?"Create":"Save"}</button><button type="button" className="secondary" onClick={()=>setEdit(null)}>Cancel</button></div></form></Dialog>}
    {remove&&<Dialog title="Delete baseline?" onClose={()=>setRemove(null)}><p>Delete “{remove.name}” and its historical schedule? Live project dates remain unchanged. You can undo this action.</p><div className="form-actions"><button type="button" className="secondary" onClick={()=>setRemove(null)}>Cancel</button><button type="button" className="danger" onClick={()=>{store.execute(deleteBaseline(remove.id));setRemove(null);}}>Delete baseline</button></div></Dialog>}
  </section>;
}
