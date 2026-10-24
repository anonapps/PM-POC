"use client";
import { useState } from "react";
import type { ProjectState } from "../../application";
import { matchesFilters, toggleFilter } from "./filtering";
import { SearchableOptionList } from "./searchable-option-list";

type Collection = "streams" | "people" | "tasks" | "milestones" | "risks" | "decisions";
type RecordEntity = ProjectState[Collection][number];
export function recordFilterValues(entity: RecordEntity): Record<string, readonly string[]> {
  const scope = "scope" in entity ? entity.scope : undefined;
  return {
    Level:"riskLevel" in entity?[entity.riskLevel]:[],
    Status: "status" in entity ? [entity.status] : [],
    Owner: "ownerId" in entity ? [entity.ownerId ?? "unassigned"] : [],
    Scope: scope?.kind === "project" || ("projectWide" in entity && entity.projectWide) ? ["project"] : scope?.kind === "stream" ? [scope.streamId] : scope?.kind === "streams" ? scope.streamIds : "relatedStreamIds" in entity ? entity.relatedStreamIds : [],
  };
}
export function FilterChoices({label,options,selected,onChange,searchable=false}:{label:string;options:readonly {id:string;label:string}[];selected:readonly string[];onChange:(values:string[])=>void;searchable?:boolean}) {
  const option=(item:{id:string;label:string})=><label key={item.id}><input type="checkbox" aria-label={`Filter ${label}: ${item.label}`} checked={selected.includes(item.id)} onChange={()=>onChange(toggleFilter(selected,item.id))}/>{item.label}</label>;
  return <fieldset className="filter-category"><legend>{label}</legend>{searchable?<SearchableOptionList items={options} label={`Search ${label} filters`} renderOption={option}/>:options.map(option)}</fieldset>;
}
export function useRecordFilters(state: ProjectState, collection: Collection) {
  const [selected,setSelected]=useState<Record<string,string[]>>({});
  const entities=state[collection];
  const categories=["Status","Owner","Scope","Level"].map(category=>{
    const ids=[...new Set(entities.filter(entity=>!entity.deletion.isDeleted).flatMap(entity=>recordFilterValues(entity)[category]))];
    return {category,options:ids.map(id=>({id,label:category==="Owner"?(id==="unassigned"?"Unassigned":[state.people.find(person=>person.id===id)?.name,state.people.find(person=>person.id===id)?.humanId].filter(Boolean).join(" · ")||"Unavailable owner"):category==="Scope"?(id==="project"?"Project-wide":[state.streams.find(stream=>stream.id===id)?.name,state.streams.find(stream=>stream.id===id)?.humanId].filter(Boolean).join(" · ")||"Unavailable stream"):id}))};
  }).filter(item=>item.options.length>0);
  return {
    active:Object.values(selected).some(values=>values.length>0),
    reset:()=>setSelected({}),
    select:(category:string,values:string[])=>setSelected(previous=>({...previous,[category]:values})),
    matches:(entity:RecordEntity)=>matchesFilters(recordFilterValues(entity),selected),
    controls:<>{categories.map(({category,options})=><FilterChoices key={category} label={category} options={options} selected={selected[category]??[]} searchable={category!=="Status"&&category!=="Level"} onChange={values=>setSelected(previous=>({...previous,[category]:values}))}/>)}</>,
  };
}
