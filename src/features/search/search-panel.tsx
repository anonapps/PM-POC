"use client";
import { ChoiceRow } from "../shared/choice-row";
import { PageToolbar } from "../shared/page-toolbar";
import { ModuleSearch } from "../shared/module-search";
import { FilterChoices } from "../shared/record-filters";
import { useNavigationPreference } from "../shared/navigation-session";
import { useLayoutEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { restore, type ProjectStore } from "../../application";
import type { ModuleName } from "../shell/shell";
import { EmptyState, Status } from "../shell/shell";
import { searchProject, SEARCH_ENTITY_TYPES } from "./search";

export function SearchPanel({store,navigate}:{store:ProjectStore;navigate:(module:ModuleName,entityId?:string)=>void}) {
  const state=useSyncExternalStore(store.subscribe,store.getState,store.getState);
  const [query,setQuery]=useNavigationPreference("search.query","");
  const [includeDeleted,setIncludeDeleted]=useNavigationPreference("search.includeDeleted",false);
  const [types,setTypes]=useNavigationPreference<string[]>("search.types",[]);
  const [lastResult,setLastResult]=useNavigationPreference<string|null>("search.lastResult",null);
  const [scroll,setScroll]=useNavigationPreference("search.scroll",0);
  const panel=useRef<HTMLElement>(null),returnState=useRef({lastResult,scroll});
  const results=useMemo(()=>searchProject(state,query,includeDeleted).filter(result=>!types.length||types.includes(result.entityType)),[state,query,includeDeleted,types]);
  useLayoutEffect(()=>{
    const root=panel.current,workspace=root?.closest<HTMLElement>(".workspace");if(!root||!workspace)return;
    const initial=returnState.current;
    const frame=requestAnimationFrame(()=>{
      const title=[...root.querySelectorAll<HTMLButtonElement>(".search-result-title")].find(button=>button.dataset.searchResultKey===initial.lastResult);
      (title??root.querySelector<HTMLInputElement>('input[type="search"]'))?.focus({preventScroll:true});
      workspace.scrollTop=initial.scroll;
    });
    return()=>cancelAnimationFrame(frame);
  },[]);
  return <section ref={panel} className="panel"><PageToolbar><h1 className="module-page-title">SEARCH</h1><ModuleSearch title="project" label="Search names, IDs, roles, notes, status and dates" value={query} onChange={value=>{setQuery(value);setLastResult(null);}} placeholder="For example TASK-001" activeFilters={includeDeleted||types.length>0} onClearFilters={()=>{setIncludeDeleted(false);setTypes([]);}}><FilterChoices label="Entity type" options={SEARCH_ENTITY_TYPES.map(id=>({id,label:id}))} selected={types} onChange={setTypes}/><ChoiceRow labelProps={{className:"check"}} input={{type:"checkbox",checked:includeDeleted,onChange:event=>setIncludeDeleted(event.target.checked)}}> Include Deleted</ChoiceRow></ModuleSearch></PageToolbar>
    {query.trim()&&<p role="status" aria-live="polite" className="search-result-count">{results.length} {results.length===1?"result":"results"} found{includeDeleted?" (including deleted records)":""}</p>}
    {!query.trim()?<EmptyState title="Find anything in this project" description="Search any record by name, ID or descriptive details."/>:results.length===0?<EmptyState title="No results" description="Try another term or include deleted entities."/>:<ul className="search-results" aria-label="Search results">{results.map(result=>{
      const key=`${result.entityType}:${result.entityId}`;
      return <li key={key}><div className="search-result-row"><span className="search-result-summary"><button type="button" className="search-result-title" data-search-result-key={key} aria-label={`View ${result.entityType} ${result.humanId}: ${result.label}`} onClick={()=>{
        setLastResult(key);setScroll(panel.current?.closest<HTMLElement>(".workspace")?.scrollTop??0);navigate(result.module,result.entityId);
      }}>{result.label}</button><small>{result.entityType} · {result.humanId}</small></span>{result.isDeleted&&<Status>Deleted</Status>}{result.isDeleted&&result.restoreKind&&<div className="search-result-actions"><button type="button" className="secondary" onClick={()=>{if(result.restoreKind)store.execute(restore(result.restoreKind,result.entityId));}}>Restore</button></div>}</div></li>;
    })}</ul>}
  </section>;
}
