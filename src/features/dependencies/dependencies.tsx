"use client";
import { ActionButton } from "../shared/action-button";
import { ChoiceRow } from "../shared/choice-row";
import { FilterChoices } from "../shared/record-filters";
import { useViewportPanel } from "../shared/use-viewport-panel";
import { useState } from "react";
import type { ProjectStore } from "../../application";
import { DEPENDENCY_TYPES,type Dependency } from "../../domain";
import { dependencyEntity,dependencyScopes,dependencyEditError,dependencyWarnings,isCrossStream } from "../../domain/dependency-analysis";
import { editDependency } from "../../application/dependencies";
import { useProjectState } from "../shell/use-project-state";
import { PageToolbar } from "../shared/page-toolbar";
import { ModuleSearch } from "../shared/module-search";
import { FitTable } from "../shared/fit-table";
import { PredictiveSelect } from "../shared/predictive-select";
import { Dialog } from "../shell/shell";
import { nextSort,sortRows,type SortSelection } from "../shared/sorting";
export function DependenciesModule({store}:{store:ProjectStore}) {
 const panel=useViewportPanel();
 const state=useProjectState(store),[query,setQuery]=useState(""),[crossOnly,setCrossOnly]=useState(false),[warningsOnly,setWarningsOnly]=useState(false),[type,setType]=useState("All");
 const [sort,setSort]=useState<SortSelection<"predecessor"|"successor"|"type"|"scope"|"warnings">|null>(null),[editing,setEditing]=useState<Dependency|null>(null);
 const label=(endpoint:Dependency['predecessor'])=>{const e=dependencyEntity(state,endpoint);return e?`${e.humanId} · ${e.name}${e.deletion.isDeleted?' (deleted)':''}`:`Missing ${endpoint.kind}: ${endpoint.id}`;};
 const scope=(d:Dependency)=>[d.predecessor,d.successor].map(e=>dependencyScopes(state,e).map(id=>id==="project"?"Project-wide":state.streams.find(s=>s.id===id)?.name??id).join(', ')||'Unassigned').join(' → ');
 const rows=state.dependencies.filter(d=>(!crossOnly||isCrossStream(state,d))&&(!warningsOnly||dependencyWarnings(state,d).length>0)&&(type==="All"||d.type===type)&&[label(d.predecessor),label(d.successor),scope(d),d.type,...dependencyWarnings(state,d)].join(' ').toLowerCase().includes(query.toLowerCase()));
 const sorted=sortRows(rows,sort,(d,key)=>key==="predecessor"?label(d.predecessor):key==="successor"?label(d.successor):key==="scope"?scope(d):key==="warnings"?dependencyWarnings(state,d).length:d.type);
 const options=[...state.tasks.filter(e=>!e.deletion.isDeleted).map(e=>({id:`task:${e.id}`,name:`${e.humanId} · ${e.name}`})),...state.milestones.filter(e=>!e.deletion.isDeleted).map(e=>({id:`milestone:${e.id}`,name:`${e.humanId} · ${e.name}`}))];
 const setEndpoint=(field:'predecessor'|'successor',value:string)=>{const colon=value.indexOf(':');setEditing(d=>d?{...d,[field]:{kind:value.slice(0,colon),id:value.slice(colon+1)}} as Dependency:null);};
 const error=editing?dependencyEditError(state,editing):null;
 return <section ref={panel} className="panel dependencies-panel"><PageToolbar><h1 className="module-page-title">Dependencies</h1><ModuleSearch title="dependencies" value={query} onChange={setQuery} placeholder="Search items, streams, types or warnings" activeFilters={crossOnly||warningsOnly||type!=="All"} onClearFilters={()=>{setCrossOnly(false);setWarningsOnly(false);setType("All");}}><fieldset className="filter-category"><legend>Relationships</legend><ChoiceRow input={{type:"checkbox",checked:crossOnly,onChange:e=>setCrossOnly(e.target.checked)}}> Cross-stream only</ChoiceRow><ChoiceRow input={{type:"checkbox",checked:warningsOnly,onChange:e=>setWarningsOnly(e.target.checked)}}> Warnings only</ChoiceRow></fieldset><FilterChoices label="Type" options={DEPENDENCY_TYPES.map(id=>({id,label:id}))} selected={type==='All'?[]:[type]} onChange={values=>setType(values.at(-1)??'All')}/></ModuleSearch><span className="dependency-count">{rows.length} relationships</span></PageToolbar><div className="data-table-scroll" role="region" aria-label="Dependencies results" tabIndex={0}><FitTable className="dependency-table record-data-table"><thead><tr>{([['predecessor','Predecessor'],['successor','Successor'],['type','Type'],['scope','Streams'],['warnings','Warnings']] as const).map(([key,label])=><th key={key}><button type="button" className="sort-heading" onClick={()=>setSort(s=>nextSort(s,key))}>{label}</button></th>)}<th>Actions</th></tr></thead><tbody>{sorted.map(d=><tr key={d.id}><td title={label(d.predecessor)}>{label(d.predecessor)}</td><td title={label(d.successor)}>{label(d.successor)}</td><td title={d.type}>{d.type}</td><td title={`${scope(d)}${isCrossStream(state,d)?" · Cross-stream":""}`}>{scope(d)}{isCrossStream(state,d)&&<small>Cross-stream</small>}</td><td title={dependencyWarnings(state,d).join(' · ')||'No warnings'}>{dependencyWarnings(state,d).join(' · ')||'No warnings'}</td><td className="table-actions"><ActionButton type="button" variant="secondary" aria-label={`Edit dependency ${d.id}`} onClick={()=>setEditing({...d})}>Inspect / Edit</ActionButton></td></tr>)}</tbody></FitTable>{!rows.length&&<p>No matching dependencies.</p>}</div>
 {editing&&<Dialog title="Edit dependency" onClose={()=>setEditing(null)}><form className="form-grid" onSubmit={e=>{e.preventDefault();if(error)return;store.execute(editDependency(editing.id,editing));setEditing(null);}}><p>Relationship ID: {editing.id}</p><label>Predecessor<PredictiveSelect label="Dependency predecessor" options={options} value={`${editing.predecessor.kind}:${editing.predecessor.id}`} onChange={value=>setEndpoint('predecessor',value)}/></label><label>Successor<PredictiveSelect label="Dependency successor" options={options} value={`${editing.successor.kind}:${editing.successor.id}`} onChange={value=>setEndpoint('successor',value)}/></label><label>Type<select aria-label="Dependency type" value={editing.type} onChange={e=>setEditing({...editing,type:e.target.value as Dependency['type']})}>{DEPENDENCY_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>{error&&<p role="alert">{error}</p>}<p role="status">{dependencyWarnings(state,editing).join(' · ')||'No schedule warnings'}</p><div className="form-actions"><ActionButton type="submit" disabled={!!error}>Save dependency</ActionButton><ActionButton type="button" variant="secondary" onClick={()=>setEditing(null)}>Cancel</ActionButton></div></form></Dialog>}
 <footer role="contentinfo" className="dependency-description" aria-label="Dependency information">Warnings are informational. Dates never change automatically. Create dependencies through Tasks or Milestones.</footer>
 </section>;
}
