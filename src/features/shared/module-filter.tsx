"use client";
import { useId, useState, type ReactNode } from "react";

/** Shared expandable filter panel; active selections stay visible until reset. */
export function ModuleFilter({title,active,onClear,children}:{
  title:string;active:boolean;onClear:()=>void;children:ReactNode;
}) {
  const [expanded,setExpanded]=useState(false);
  const id=useId();
  return <div className="module-filter-toolbar">
    <button type="button" className="secondary" aria-expanded={expanded} aria-controls={id} onClick={()=>setExpanded(previous=>!previous)}>
      Filter {title}{active?" · Active":""}
    </button>
    {expanded&&<div id={id} className="filters">{children}
      {active&&<button type="button" className="secondary" onClick={onClear}>Clear filters</button>}
    </div>}
  </div>;
}
