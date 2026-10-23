"use client";
import { useState } from "react";

export interface OwnerOption {id:string;name:string;deleted?:boolean}

/** Searchable owner selector. Keeps native select for keyboard and screen-reader support. */
export function SearchableOwnerSelect({label,value,disabled,people,onChange}:{
  label:string;value:string;disabled?:boolean;people:readonly OwnerOption[];onChange:(ownerId:string)=>void;
}) {
  const [query,setQuery]=useState("");
  const needle=query.trim().toLocaleLowerCase();
  const options=people.filter(person=>person.id===value||!needle||person.name.toLocaleLowerCase().includes(needle));
  return <div className="searchable-owner-select">
    <input type="search" aria-label={`Search ${label}`} placeholder="Search people" value={query} disabled={disabled} onChange={event=>setQuery(event.target.value)}/>
    <select aria-label={label} value={value} disabled={disabled} onChange={event=>{onChange(event.target.value);setQuery("");}}>
      <option value="">Unassigned</option>
      {options.map(person=><option key={person.id} value={person.id} disabled={person.deleted}>{person.name}{person.deleted?" (Deleted)":""}</option>)}
    </select>
  </div>;
}
