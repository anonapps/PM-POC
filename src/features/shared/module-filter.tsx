"use client";
import { useId, useRef, useState, type ReactNode } from "react";

/** Shared expandable filter panel; active selections stay visible until reset. */
export function ModuleFilter({title,active,onClear,children}:{
  title:string;active:boolean;onClear:()=>void;children:ReactNode;
}) {
  const [expanded,setExpanded]=useState(false);
  const id=useId();
  const triggerRef=useRef<HTMLButtonElement>(null);
  return <div className="module-filter-toolbar">
    <button ref={triggerRef} type="button" className="secondary" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(previous=>!previous)}>
      Filter {title}{active?" · Active":""}
    </button>
    {expanded&&<div id={id} className="filters" onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();setExpanded(false);triggerRef.current?.focus();}}}>{children}
      {active&&<button type="button" className="secondary" onClick={onClear}>Clear filters</button>}
    </div>}
  </div>;
}
