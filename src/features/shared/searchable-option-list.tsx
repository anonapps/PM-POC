"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

/** Accessible, case-insensitive filtering of dynamic single- or multi-select option lists. */
export function SearchableOptionList<T>({items,label,renderOption,emptyMessage="No matching options"}:{
  items:readonly T[];
  label:string;
  renderOption:(item:T)=>ReactNode;
  emptyMessage?:string;
}) {
  const [query,setQuery]=useState("");
  const rootRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const details=rootRef.current?.closest("details");
    if(!details)return;
    const resetOnClose=()=>{if(!details.open)setQuery("");};
    details.addEventListener("toggle",resetOnClose);
    return ()=>details.removeEventListener("toggle",resetOnClose);
  },[]);
  const matching=items.filter(item=>matchesOption(item,query));
  const noMatches=matching.length===0;
  const searching=query.trim().length>0;
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const root = event.currentTarget;
    const search = root.querySelector<HTMLInputElement>('input[type="search"]');
    const options = Array.from(root.querySelectorAll<HTMLElement>('input:not([type="search"]):not(:disabled),button:not(:disabled),[role="option"]:not([aria-disabled="true"])'));
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      setQuery("");
      const details = root.closest("details");
      if (details) {
        details.open = false;
        details.querySelector("summary")?.focus();
      }
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      event.stopPropagation();
      const index = options.indexOf(event.target as HTMLElement);
      const next = index < 0 ? (event.key === "ArrowDown" ? 0 : options.length - 1) : index + (event.key === "ArrowDown" ? 1 : -1);
      (options[next] ?? search)?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      event.stopPropagation();
      const target = event.target === search ? options[0] : event.target as HTMLElement;
      target?.click();
    } else if (!event.ctrlKey && !event.metaKey && !event.altKey && (event.key.length === 1 || event.key === "Backspace" || event.key === "Delete")) {
      event.stopPropagation();
    }
  };
  return <div ref={rootRef} className="searchable-option-list" onKeyDown={handleKeyDown}>
    <input type="search" aria-label={label} placeholder={label} value={query} onChange={event=>setQuery(event.target.value)}/>
    {searching&&<small role="status" aria-live="polite">{matching.length} {matching.length===1?"matching option":"matching options"}</small>}
    {noMatches?<small>{emptyMessage}</small>:matching.map(renderOption)}
  </div>;
}
export function matchesOption<T>(item:T,query:string):boolean {
  const normalise=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase();
  const terms=normalise(query.trim()).split(/\s+/).filter(Boolean);
  if(terms.length===0)return true;
  const haystack=normalise(labelFor(item));
  return terms.every(term=>haystack.includes(term));
}
function labelFor<T>(item:T):string {
  if(typeof item==="string")return item;
  if(item&&typeof item==="object") {
    const values=["label","name","humanId","id"].filter(key=>key in item).map(key=>String((item as Record<string,unknown>)[key]??""));
    if(values.length)return values.join(" ");
  }
  return String(item);
}
