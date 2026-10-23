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
  const matching=items.filter(item=>matchesOption(item,query));
  const noMatches=matching.length===0;
  return <div className="searchable-option-list">
    <input type="search" aria-label={label} placeholder={label} value={query} onChange={event=>setQuery(event.target.value)} onKeyDown={event=>{if(event.key==="Escape"){if(query){event.stopPropagation();setQuery("");}}else if(event.key.length===1||event.key==="Backspace"||event.key==="Delete"){event.stopPropagation();}}}/>
    {noMatches?<small role="status">{emptyMessage}</small>:matching.map(renderOption)}
  </div>;
}
export function matchesOption<T>(item:T,query:string):boolean {
  const terms=query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const haystack=labelFor(item).toLocaleLowerCase();
  return terms.every(term=>haystack.includes(term));
}
function labelFor<T>(item:T):string {
  if(typeof item==="string")return item;
  if(item&&typeof item==="object") {
    const values=["label","name","id"].filter(key=>key in item).map(key=>String((item as Record<string,unknown>)[key]??""));
    if(values.length)return values.join(" ");
  }
  return String(item);
}
