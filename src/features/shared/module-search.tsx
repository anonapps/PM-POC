"use client";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";

/** One live Search/Filter popover shared by all record and discovery pages. */
export function ModuleSearch({title,value,onChange,placeholder,disabled=false,children,activeFilters=false,onClearFilters,defaultOpen=false,label}:{
  title:string;value:string;onChange:(value:string)=>void;placeholder:string;disabled?:boolean;
  children?:ReactNode;activeFilters?:boolean;onClearFilters?:()=>void;defaultOpen?:boolean;label?:string;
}) {
  const [expanded,setExpanded]=useState(defaultOpen);
  const id=useId();
  const triggerRef=useRef<HTMLButtonElement>(null);
  const rootRef=useRef<HTMLDivElement>(null);
  const open=expanded&&!disabled;
  useEffect(()=>{
    if(!open)return;
    const dismiss=(event:PointerEvent)=>{
      if(event.target instanceof Node&&!rootRef.current?.contains(event.target))setExpanded(false);
    };
    document.addEventListener("pointerdown",dismiss);
    return ()=>document.removeEventListener("pointerdown",dismiss);
  },[open]);
  const active=Boolean(value.trim())||activeFilters;
  return <div ref={rootRef} className="module-search-toolbar module-filter-toolbar shared-search-filter">
    <button ref={triggerRef} type="button" className="secondary" disabled={disabled} title={`Search ${title}`} aria-label={`Search and filter ${title}`} aria-expanded={open} aria-controls={open?id:undefined} onClick={()=>setExpanded(previous=>!previous)}>
      <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="9" r="6"/><path d="m13 13 5 5M17 3h6m-4 4h4m-2 4h2"/></svg>
      Search / Filter{active?" · Active":""}
    </button>
    {open&&<div id={id} className="module-search-controls filters" role="region" aria-label={`Search and filter controls for ${title}`} onKeyDown={event=>{if(event.key==="Escape"){event.preventDefault();event.stopPropagation();setExpanded(false);triggerRef.current?.focus();}}}>
      <label className="search-input">{label??`Search ${title}`}
        <input autoFocus type="search" value={value} onChange={event=>onChange(event.target.value)} placeholder={placeholder}/>
      </label>
      {children}
      {active&&<button type="button" className="secondary" onClick={()=>{onChange("");onClearFilters?.();}}>Clear search and filters</button>}
    </div>}
  </div>;
}
