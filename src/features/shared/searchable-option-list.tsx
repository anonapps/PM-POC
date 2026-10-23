"use client";
import { useState, type ReactNode } from "react";

/** Accessible, case-insensitive filtering of dynamic single- or multi-select option lists. */
export function SearchableOptionList<T>({items,label,renderOption,emptyMessage="No matching options"}:{
  items:readonly T[];
  label:string;
  renderOption:(item:T)=>ReactNode;
  emptyMessage?:string;
}) {
  const [query,setQuery]=useState("");
  const needle=query.trim().toLocaleLowerCase();
  const matching=items.filter(item=>labelFor(item).toLocaleLowerCase().includes(needle));
  return <div className="searchable-option-list">
    <input type="search" aria-label={label} placeholder={label} value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key!=="Escape")event.stopPropagation();}}/>
    {matching.length?matching.map(renderOption):<small role="status">{emptyMessage}</small>}
  </div>;
}
function labelFor<T>(item:T):string {
  if(typeof item==="string")return item;
  if(item&&typeof item==="object"&&"label" in item)return String(item.label);
  return String(item);
}
