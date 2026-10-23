"use client";
import { useState } from "react";

export interface OwnerOption {id:string;name:string;deleted?:boolean}

/** Searchable owner selector. Keeps native select for keyboard and screen-reader support. */
export function SearchableOwnerSelect({label,value,disabled,people,onChange}:{
  label:string;value:string;disabled?:boolean;people:readonly OwnerOption[];onChange:(ownerId:string)=>void;
}) {
  const [query,setQuery]=useState("");
  const needle=query.trim().toLocaleLowerCase();
  const options=people.filter(person=>!needle||person.name.toLocaleLowerCase().includes(needle)||person.id.toLocaleLowerCase().includes(needle));
  const selected=people.find(person=>person.id===value);
  const visible=selected&&!selected?[selected,...options]:options;
  return <div className="searchable-owner-select">
    <input type="search" aria-label={`Search ${label}`} placeholder="Search people by name or ID" value={query} disabled={disabled} onChange={event=>setQuery(event.target.value)}/>
    {needle&&options.length===0&&<small role="status">No matching people</small>}
    <select aria-label={label} value={value} disabled={disabled} onChange={event=>{onChange(event.target.value);setQuery("");}}>
      <option value="">Unassigned</option>
      {value&&!options.some(person=>person.id===value)&&<option value={value} disabled>Previously assigned owner (unavailable)</option>}
      {visible.map(person=><option key={person.id} value={person.id} disabled={person.deleted}>{person.name}{person.deleted?" (Deleted)":""}</option>)}
    </select>
  </div>;
}
